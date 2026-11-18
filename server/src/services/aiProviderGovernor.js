// Owner: M2 — shared provider concurrency, timeout, output cap and usage accounting.
import { randomUUID } from 'node:crypto';
import redis from '../config/redisClient.js';
import { aiRequestConfig, rateLimitConfig } from '../config/rateLimitConfig.js';
import { consumeRateLimit } from '../middleware/tokenBucketRateLimit.js';
import { estimateTokenCount } from '../middleware/aiQuota.js';
import { HttpError } from '../middleware/errorHandler.js';

const CONCURRENCY_KEY = 'commerceforge:ai:provider:leases';
const USAGE_KEY = 'commerceforge:ai:usage';

const ACQUIRE_LEASE = `
local parts = redis.call('TIME')
local now_ms = (tonumber(parts[1]) * 1000) + math.floor(tonumber(parts[2]) / 1000)
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now_ms)
local active = redis.call('ZCARD', KEYS[1])
local maximum = tonumber(ARGV[1])
if active >= maximum then return {0, active} end
redis.call('ZADD', KEYS[1], now_ms + tonumber(ARGV[3]), ARGV[2])
redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[3]) * 2)
return {1, active + 1}
`;

const RELEASE_LEASE = `return redis.call('ZREM', KEYS[1], ARGV[1])`;

function reportedTokens(usage, keys, fallback) {
  if (!usage) return fallback;
  for (const key of keys) {
    const value = Number(usage[key]);
    if (Number.isSafeInteger(value) && value >= 0) return value;
  }
  return fallback;
}

function outputContent(response) {
  return response?.output_text ?? response?.text ?? response?.content ?? response?.choices?.[0]?.message?.content ?? response;
}

export function createAiProviderGovernor({ redisClient = redis, config = aiRequestConfig } = {}) {
  return async function runAiProvider({ input, providerCall, quota }) {
    if (typeof providerCall !== 'function') throw new TypeError('providerCall must be a function');
    if (!quota?.identities?.ip || !quota?.identities?.user || !quota?.identities?.tenant) {
      throw new HttpError(503, 'ai_quota_context_required', 'AI provider calls require the request quota context');
    }
    const inputTokensEstimated = estimateTokenCount(input);
    if (inputTokensEstimated > config.maxInputTokens) {
      throw new HttpError(413, 'ai_input_too_large', `AI input exceeds the ${config.maxInputTokens} token request limit`);
    }

    const leaseId = randomUUID();
    const leaseTtlMs = config.timeoutMs + 5000;
    let acquired;
    try {
      acquired = await redisClient.eval(ACQUIRE_LEASE, 1, CONCURRENCY_KEY, config.maxConcurrency, leaseId, leaseTtlMs);
    } catch {
      throw new HttpError(503, 'ai_provider_limits_unavailable', 'AI provider protection is temporarily unavailable');
    }
    if (Number(acquired[0]) !== 1) throw new HttpError(503, 'ai_provider_busy', 'AI provider concurrency limit reached');

    const abortController = new AbortController();
    let timeout;
    try {
      const timedOut = new Promise((_, reject) => {
        timeout = setTimeout(() => {
          abortController.abort();
          reject(new HttpError(504, 'ai_provider_timeout', 'AI provider request timed out'));
        }, config.timeoutMs);
      });
      const response = await Promise.race([
        providerCall({ input, signal: abortController.signal, maxOutputTokens: config.maxOutputTokens }),
        timedOut,
      ]);

      const usage = response?.usage;
      const outputFallback = estimateTokenCount(outputContent(response));
      const inputTokens = reportedTokens(usage, ['input_tokens', 'prompt_tokens', 'inputTokens'], inputTokensEstimated);
      const outputTokens = reportedTokens(usage, ['output_tokens', 'completion_tokens', 'outputTokens'], outputFallback);
      const providerCost = Number(usage?.cost_microusd ?? usage?.costMicrousd);
      const calculatedCost = Math.round(
        inputTokens * Math.max(0, config.inputCostMicrousdPer1k) / 1000 +
        outputTokens * Math.max(0, config.outputCostMicrousdPer1k) / 1000,
      );
      const costMicrousd = Number.isSafeInteger(providerCost) && providerCost >= 0 ? providerCost : calculatedCost;
      await redisClient.hincrby(USAGE_KEY, 'requests', 1);
      await redisClient.hincrby(USAGE_KEY, 'input_tokens', inputTokens);
      await redisClient.hincrby(USAGE_KEY, 'output_tokens', outputTokens);
      await redisClient.hincrby(USAGE_KEY, 'estimated_cost_microusd', costMicrousd);

      if (outputTokens > config.maxOutputTokens) {
        throw new HttpError(502, 'ai_output_too_large', 'AI provider returned more output tokens than the configured limit');
      }

      const outputScopes = [
        { name: 'ai-ip', config: rateLimitConfig.aiIp, identity: quota.identities.ip },
        { name: 'ai-user', config: rateLimitConfig.aiUser, identity: quota.identities.user },
        { name: 'ai-tenant', config: rateLimitConfig.aiTenant, identity: quota.identities.tenant },
      ];
      for (const scope of outputScopes) {
        const result = await consumeRateLimit({ ...scope, cost: outputTokens, redisClient });
        if (!result.allowed) throw new HttpError(429, 'ai_quota_exceeded', 'AI usage quota exceeded. Try again later.');
      }

      return { response, usage: { inputTokens, outputTokens, costMicrousd } };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(502, 'ai_provider_failed', 'AI provider request failed');
    } finally {
      clearTimeout(timeout);
      try { await redisClient.eval(RELEASE_LEASE, 1, CONCURRENCY_KEY, leaseId); } catch { /* The lease expires if Redis is unavailable. */ }
    }
  };
}

export async function getAiUsageMetrics(redisClient = redis) {
  try {
    const [usage, activeProviderRequests] = await Promise.all([
      redisClient.hgetall(USAGE_KEY),
      redisClient.zcard(CONCURRENCY_KEY),
    ]);
    return {
      requests: Number(usage.requests || 0),
      inputTokens: Number(usage.input_tokens || 0),
      outputTokens: Number(usage.output_tokens || 0),
      estimatedCostMicrousd: Number(usage.estimated_cost_microusd || 0),
      activeProviderRequests: Number(activeProviderRequests || 0),
      maxConcurrency: aiRequestConfig.maxConcurrency,
    };
  } catch {
    throw new HttpError(503, 'ai_usage_metrics_unavailable', 'AI usage metrics are temporarily unavailable');
  }
}

// Owner: M2 — server-side token budgets for future authenticated AI endpoints.
import { rateLimitConfig, aiRequestConfig } from '../config/rateLimitConfig.js';
import redis from '../config/redisClient.js';
import { consumeRateLimit } from './tokenBucketRateLimit.js';
import { HttpError } from './errorHandler.js';

export function estimateTokenCount(value) {
  let serialized;
  try { serialized = typeof value === 'string' ? value : JSON.stringify(value ?? ''); }
  catch { throw new HttpError(400, 'invalid_ai_input', 'AI request input must be JSON serializable'); }
  // Conservative byte-based estimate. Provider usage is checked again after the call.
  return Math.max(1, Math.ceil(Buffer.byteLength(serialized, 'utf8') / 3));
}

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

function resolvedUserId(req) {
  return req.user?.id || req.user?._id;
}

function resolvedTenantId(req) {
  return req.tenant?.id || req.tenant?._id || req.rateLimitTenantId;
}

export function createAiQuotaMiddleware({ redisClient = redis, config = aiRequestConfig } = {}) {
  return async function aiQuota(req, res, next) {
    try {
      const userId = resolvedUserId(req);
      const tenantId = resolvedTenantId(req);
      if (!userId) throw new HttpError(401, 'authentication_required', 'Sign in to use AI features');
      if (!tenantId) throw new HttpError(503, 'trusted_tenant_required', 'AI quotas require a server-resolved tenant context');

      const inputTokens = estimateTokenCount(req.body);
      if (inputTokens > config.maxInputTokens) {
        throw new HttpError(413, 'ai_input_too_large', `AI input exceeds the ${config.maxInputTokens} token request limit`);
      }

      const scopes = [
        { name: 'ai-ip', config: rateLimitConfig.aiIp, identity: clientIp(req) },
        { name: 'ai-user', config: rateLimitConfig.aiUser, identity: String(userId) },
        { name: 'ai-tenant', config: rateLimitConfig.aiTenant, identity: String(tenantId) },
      ];
      for (const scope of scopes) {
        const result = await consumeRateLimit({ ...scope, cost: inputTokens, redisClient });
        res.set(`RateLimit-${scope.name}-Limit`, String(result.capacity));
        res.set(`RateLimit-${scope.name}-Remaining`, String(Math.floor(result.remaining)));
        if (!result.allowed) {
          res.set('Retry-After', String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
          return res.status(429).json({ error: { code: 'ai_quota_exceeded', message: 'AI usage quota exceeded. Try again later.' } });
        }
      }

      req.aiQuota = Object.freeze({
        inputTokens,
        maxInputTokens: config.maxInputTokens,
        maxOutputTokens: config.maxOutputTokens,
        identities: Object.freeze({ ip: clientIp(req), user: String(userId), tenant: String(tenantId) }),
      });
      return next();
    } catch (error) {
      if (error instanceof HttpError) return next(error);
      return next(new HttpError(503, 'ai_quota_unavailable', 'AI usage protection is temporarily unavailable'));
    }
  };
}

export const aiQuota = createAiQuotaMiddleware();

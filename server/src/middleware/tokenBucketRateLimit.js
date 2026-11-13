// Owner: M2 — atomic Redis-backed token bucket shared by every API instance.
import { createHash } from 'node:crypto';
import redis from '../config/redisClient.js';
import { rateLimitConfig } from '../config/rateLimitConfig.js';
import { HttpError } from './errorHandler.js';

const CONSUME_TOKEN_SCRIPT = `
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local ttl_ms = tonumber(ARGV[3])
local cost = tonumber(ARGV[4]) or 1
local now_parts = redis.call('TIME')
local now_ms = (tonumber(now_parts[1]) * 1000) + math.floor(tonumber(now_parts[2]) / 1000)
local tokens = tonumber(redis.call('HGET', KEYS[1], 'tokens'))
local updated_at = tonumber(redis.call('HGET', KEYS[1], 'updatedAt'))

if tokens == nil then
  tokens = capacity
  updated_at = now_ms
else
  local elapsed_ms = math.max(0, now_ms - (updated_at or now_ms))
  tokens = math.min(capacity, tokens + (elapsed_ms * refill_rate / 1000))
end

local allowed = 0
local retry_after_ms = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
else
  retry_after_ms = math.ceil(((cost - tokens) / refill_rate) * 1000)
end

redis.call('HSET', KEYS[1], 'tokens', tokens, 'updatedAt', now_ms)
redis.call('PEXPIRE', KEYS[1], ttl_ms)
return { allowed, tokens, retry_after_ms }
`;

function buildRateLimitKey(name, key) {
  return `commerceforge:rate-limit:${name}:${key}`;
}

export function createTokenBucketLimiter({ name, config, keyGenerator }) {
  if (!name || !config || !(config.capacity > 0) || !(config.refillRate > 0) || !keyGenerator) {
    throw new TypeError('A token bucket needs a name, positive capacity/refill rate, and key generator');
  }
  const ttlMs = Math.max(1000, Math.ceil((config.capacity / config.refillRate) * 2000));

  return async function tokenBucketMiddleware(req, res, next) {
    try {
      const identity = keyGenerator(req);
      if (!identity) throw new HttpError(400, 'rate_limit_key_missing', 'Could not determine rate-limit scope');
      const [allowed, remaining, retryAfterMs] = await redis.eval(
        CONSUME_TOKEN_SCRIPT,
        1,
        buildRateLimitKey(name, identity),
        config.capacity,
        config.refillRate,
        ttlMs,
        1,
      );

      const tokensLeft = Math.max(0, Math.floor(Number(remaining)));
      res.set('RateLimit-Limit', String(config.capacity));
      res.set('RateLimit-Remaining', String(tokensLeft));
      res.set('RateLimit-Reset', String(Math.ceil((config.capacity - Number(remaining)) / config.refillRate)));

      if (Number(allowed) !== 1) {
        const retryAfter = Math.max(1, Math.ceil(Number(retryAfterMs) / 1000));
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({
          error: { code: 'rate_limit_exceeded', message: 'Too many requests. Try again later.' },
        });
      }
      return next();
    } catch (error) {
      if (error instanceof HttpError) return next(error);
      return next(new HttpError(503, 'rate_limit_unavailable', 'Request protection is temporarily unavailable'));
    }
  };
}

const ipKey = (req) => req.ip || req.socket.remoteAddress || 'unknown';
const tenantKey = (req) => req.tenantId || 'default';
const normalizedEmailKey = (req) => createHash('sha256')
  .update(String(req.body?.email || '').trim().toLowerCase() || 'missing-email')
  .digest('hex');
const userKey = (req) => req.user?.id || ipKey(req);

export const globalRateLimit = createTokenBucketLimiter({ name: 'global-ip', config: rateLimitConfig.global, keyGenerator: ipKey });
export const tenantRateLimit = createTokenBucketLimiter({ name: 'tenant', config: rateLimitConfig.tenant, keyGenerator: tenantKey });
export const loginIpRateLimit = createTokenBucketLimiter({ name: 'login-ip', config: rateLimitConfig.loginIp, keyGenerator: ipKey });
export const loginAccountRateLimit = createTokenBucketLimiter({ name: 'login-account', config: rateLimitConfig.loginAccount, keyGenerator: normalizedEmailKey });
export const registerRateLimit = createTokenBucketLimiter({ name: 'register-ip', config: rateLimitConfig.registerIp, keyGenerator: ipKey });
export const checkoutIpRateLimit = createTokenBucketLimiter({ name: 'checkout-ip', config: rateLimitConfig.checkoutIp, keyGenerator: ipKey });
export const checkoutAccountRateLimit = createTokenBucketLimiter({ name: 'checkout-user', config: rateLimitConfig.checkoutAccount, keyGenerator: userKey });

// Owner: M2 — atomic Redis-backed token buckets shared by every API instance.
import { createHash } from 'node:crypto';
import redis from '../config/redisClient.js';
import { rateLimitConfig, rateLimitMaxActiveKeys } from '../config/rateLimitConfig.js';
import { HttpError } from './errorHandler.js';

const METRICS_KEY = 'commerceforge:rate-limit:metrics';
const BUCKET_NAME_PATTERN = /^[a-z][a-z0-9-]{0,47}$/;

// The sorted-set registry is an exact, expiring cap on active identity buckets.
// Once a limiter reaches its configured key budget, new identities share one
// bounded overflow bucket until expired identities leave the registry.
const CONSUME_TOKEN_SCRIPT = `
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local ttl_ms = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local max_keys = tonumber(ARGV[5])
local identity = ARGV[6]
local name = ARGV[7]
local time_parts = redis.call('TIME')
local now_ms = (tonumber(time_parts[1]) * 1000) + math.floor(tonumber(time_parts[2]) / 1000)

redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', now_ms)
local active = redis.call('ZCARD', KEYS[2])
local tracked = redis.call('ZSCORE', KEYS[2], identity)
local bucket_key = KEYS[1]
local overflow = 0

if not tracked then
  if active >= max_keys then
    bucket_key = KEYS[3]
    overflow = 1
  else
    redis.call('ZADD', KEYS[2], now_ms + ttl_ms, identity)
    active = active + 1
  end
else
  redis.call('ZADD', KEYS[2], now_ms + ttl_ms, identity)
end
redis.call('PEXPIRE', KEYS[2], ttl_ms * 2)

local tokens = tonumber(redis.call('HGET', bucket_key, 'tokens'))
local updated_at = tonumber(redis.call('HGET', bucket_key, 'updatedAt'))
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

redis.call('HSET', bucket_key, 'tokens', tokens, 'updatedAt', now_ms)
redis.call('PEXPIRE', bucket_key, ttl_ms)
redis.call('HSET', KEYS[4], 'active:' .. name, active)
redis.call('HINCRBY', KEYS[4], 'requests:' .. name, 1)
if allowed == 1 then
  redis.call('HINCRBY', KEYS[4], 'allowed:' .. name, 1)
else
  redis.call('HINCRBY', KEYS[4], 'rejected:' .. name, 1)
end
if overflow == 1 then
  redis.call('HINCRBY', KEYS[4], 'overflow:' .. name, 1)
end
return { allowed, tokens, retry_after_ms, active, overflow }
`;

function hashIdentity(identity) {
  return createHash('sha256').update(String(identity)).digest('hex');
}

function redisKeys(name, identity) {
  const hashedIdentity = hashIdentity(identity);
  return [
    `commerceforge:rate-limit:${name}:${hashedIdentity}`,
    `commerceforge:rate-limit:active:${name}`,
    `commerceforge:rate-limit:${name}:overflow`,
    METRICS_KEY,
  ];
}

export function getRateLimitRedisKeyNames(name, identity) {
  if (!BUCKET_NAME_PATTERN.test(name || '') || identity === undefined || identity === null || String(identity).length === 0) {
    throw new TypeError('A safe limiter name and a non-empty identity are required');
  }
  return redisKeys(name, identity);
}

function validateBucket({ name, config, identity, cost, maxActiveKeys }) {
  if (!BUCKET_NAME_PATTERN.test(name || '') || !config || !(config.capacity > 0) || !(config.refillRate > 0)) {
    throw new TypeError('A token bucket needs a safe name, positive capacity and positive refill rate');
  }
  if (identity === undefined || identity === null || String(identity).length === 0) {
    throw new HttpError(400, 'rate_limit_key_missing', 'Could not determine rate-limit scope');
  }
  if (String(identity).length > 1024) {
    throw new HttpError(400, 'rate_limit_key_invalid', 'Rate-limit identity is too long');
  }
  if (!Number.isFinite(cost) || cost <= 0 || cost > config.capacity) {
    throw new HttpError(400, 'rate_limit_cost_invalid', 'Rate-limit request cost is invalid');
  }
  if (!Number.isSafeInteger(maxActiveKeys) || maxActiveKeys < 1 || maxActiveKeys > 100000) {
    throw new TypeError('maxActiveKeys must be an integer between 1 and 100000');
  }
}

export async function consumeRateLimit({ name, config, identity, cost = 1, maxActiveKeys = config?.maxActiveKeys || rateLimitMaxActiveKeys, redisClient = redis }) {
  validateBucket({ name, config, identity, cost, maxActiveKeys });
  const ttlMs = Math.max(1000, Math.ceil((config.capacity / config.refillRate) * 2000));
  const result = await redisClient.eval(
    CONSUME_TOKEN_SCRIPT,
    4,
    ...redisKeys(name, identity),
    config.capacity,
    config.refillRate,
    ttlMs,
    cost,
    maxActiveKeys,
    hashIdentity(identity),
    name,
  );
  return {
    allowed: Number(result[0]) === 1,
    remaining: Math.max(0, Number(result[1])),
    retryAfterMs: Math.max(0, Number(result[2])),
    activeIdentities: Number(result[3]),
    overflowed: Number(result[4]) === 1,
    capacity: config.capacity,
    refillRate: config.refillRate,
  };
}

export function createTokenBucketLimiter({ name, config, keyGenerator, costGenerator = () => 1, maxActiveKeys = config?.maxActiveKeys || rateLimitMaxActiveKeys, redisClient = redis }) {
  validateBucket({ name, config, identity: 'configuration-check', cost: 1, maxActiveKeys });
  if (config.capacity < 1) throw new TypeError('Token bucket capacity must be at least one');

  return async function tokenBucketMiddleware(req, res, next) {
    try {
      const identity = keyGenerator(req);
      const cost = costGenerator(req);
      const result = await consumeRateLimit({ name, config, identity, cost, maxActiveKeys, redisClient });
      const tokensLeft = Math.max(0, Math.floor(result.remaining));
      res.set('RateLimit-Limit', String(result.capacity));
      res.set('RateLimit-Remaining', String(tokensLeft));
      res.set('RateLimit-Reset', String(Math.ceil((result.capacity - result.remaining) / result.refillRate)));
      if (result.overflowed) res.set('RateLimit-Keyspace', 'saturated');

      if (!result.allowed) {
        const retryAfter = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({ error: { code: 'rate_limit_exceeded', message: 'Too many requests. Try again later.' } });
      }
      return next();
    } catch (error) {
      if (error instanceof HttpError) return next(error);
      return next(new HttpError(503, 'rate_limit_unavailable', 'Request protection is temporarily unavailable'));
    }
  };
}

function ipKey(req) {
  return req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
}

function normalizedEmailKey(req) {
  const email = String(req.body?.email || '').trim().toLowerCase() || 'missing-email';
  // Scope account throttling to the source IP as well, so a hostile source cannot
  // exhaust a victim's account bucket for every other network.
  return `${email}\u0000${ipKey(req)}`;
}

function trustedTenantKey(req) {
  // Member 5's resolver must set one of these server-side fields. Never use the
  // client-selected x-tenant-id / req.tenantId value as a quota identity.
  const tenant = req.tenant;
  const resolvedId = tenant?.id || tenant?._id || req.rateLimitTenantId;
  return resolvedId ? String(resolvedId) : 'unresolved-tenant-context';
}

const userKey = (req) => req.user?.id || req.user?._id || ipKey(req);

export const globalRateLimit = createTokenBucketLimiter({ name: 'global-ip', config: rateLimitConfig.global, keyGenerator: ipKey });
export const tenantRateLimit = createTokenBucketLimiter({ name: 'tenant', config: rateLimitConfig.tenant, keyGenerator: trustedTenantKey });
export const loginIpRateLimit = createTokenBucketLimiter({ name: 'login-ip', config: rateLimitConfig.loginIp, keyGenerator: ipKey });
export const loginAccountRateLimit = createTokenBucketLimiter({ name: 'login-account', config: rateLimitConfig.loginAccount, keyGenerator: normalizedEmailKey });
export const registerRateLimit = createTokenBucketLimiter({ name: 'register-ip', config: rateLimitConfig.registerIp, keyGenerator: ipKey });
export const checkoutIpRateLimit = createTokenBucketLimiter({ name: 'checkout-ip', config: rateLimitConfig.checkoutIp, keyGenerator: ipKey });
export const checkoutAccountRateLimit = createTokenBucketLimiter({ name: 'checkout-user', config: rateLimitConfig.checkoutAccount, keyGenerator: userKey });
export const webhookIpRateLimit = createTokenBucketLimiter({ name: 'webhook-ip', config: rateLimitConfig.webhookIp, keyGenerator: ipKey });
export const attackDemoRateLimit = createTokenBucketLimiter({ name: 'attack-demo-ip', config: rateLimitConfig.checkoutIp, keyGenerator: ipKey });

export const RATE_LIMIT_BUCKETS = Object.freeze([
  'global-ip', 'tenant', 'login-ip', 'login-account', 'register-ip',
  'checkout-ip', 'checkout-user', 'webhook-ip', 'attack-demo-ip', 'ai-ip', 'ai-user', 'ai-tenant',
]);

export async function getRateLimitMetrics(redisClient = redis) {
  const [counters, ...activeCounts] = await Promise.all([
    redisClient.hgetall(METRICS_KEY),
    ...RATE_LIMIT_BUCKETS.map((name) => redisClient.zcard(`commerceforge:rate-limit:active:${name}`)),
  ]);
  const buckets = {};
  RATE_LIMIT_BUCKETS.forEach((name, index) => {
    const prefix = name.replaceAll('-', '_');
    buckets[name] = {
      activeIdentities: Number(activeCounts[index] || 0),
      maxActiveIdentities: rateLimitMaxActiveKeys,
      requests: Number(counters[`requests:${name}`] || 0),
      allowed: Number(counters[`allowed:${name}`] || 0),
      rejected: Number(counters[`rejected:${name}`] || 0),
      overflowed: Number(counters[`overflow:${name}`] || 0),
      metricKey: prefix,
    };
  });
  return { buckets };
}

export const rateLimitRedisKeys = Object.freeze({ metrics: METRICS_KEY, bucketPrefix: 'commerceforge:rate-limit:' });

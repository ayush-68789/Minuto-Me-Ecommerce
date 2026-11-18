import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import test, { before, after } from 'node:test';
import { createTokenBucketLimiter, getRateLimitRedisKeyNames, rateLimitRedisKeys } from '../src/middleware/tokenBucketRateLimit.js';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const name = `m2-integration-${randomUUID().replaceAll('-', '').slice(0, 20)}`;
const identity = 'shared-client';
let redisA;
let redisB;
let redisUnavailable = '';

function responseStub() {
  return {
    statusCode: 200,
    headers: {},
    set(key, value) { this.headers[key] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function invoke(middleware) {
  const res = responseStub();
  let error;
  let passed = false;
  await middleware({ ip: '127.0.0.1' }, res, (value) => { error = value; passed = !value; });
  if (error) throw error;
  return res;
}

before(async () => {
  redisA = new Redis(redisUrl, { lazyConnect: true, connectTimeout: 400, maxRetriesPerRequest: 1, retryStrategy: () => null });
  redisB = new Redis(redisUrl, { lazyConnect: true, connectTimeout: 400, maxRetriesPerRequest: 1, retryStrategy: () => null });
  redisA.on('error', () => {});
  redisB.on('error', () => {});
  try {
    await Promise.all([redisA.connect(), redisB.connect()]);
    await redisA.ping();
  } catch (error) {
    redisUnavailable = `Redis integration tests skipped: ${error.message}`;
    redisA.disconnect();
    redisB.disconnect();
  }
});

after(async () => {
  if (!redisUnavailable && redisA?.status === 'ready') {
    const keys = getRateLimitRedisKeyNames(name, identity);
    await redisA.del(keys[0], keys[1], keys[2]);
    await redisA.hdel(rateLimitRedisKeys.metrics, ...['active', 'requests', 'allowed', 'rejected', 'overflow'].map((field) => `${field}:${name}`));
  }
  redisA?.disconnect();
  redisB?.disconnect();
});

test('200 concurrent requests across two Redis clients share one bounded bucket', { skip: () => redisUnavailable || false }, async () => {
  const config = { capacity: 60, refillRate: 0.000001, maxActiveKeys: 10 };
  const firstInstance = createTokenBucketLimiter({ name, config, keyGenerator: () => identity, redisClient: redisA });
  const secondInstance = createTokenBucketLimiter({ name, config, keyGenerator: () => identity, redisClient: redisB });
  const results = await Promise.all(Array.from({ length: 200 }, (_, index) => invoke(index % 2 ? firstInstance : secondInstance)));
  assert.equal(results.filter((res) => res.statusCode === 200).length, 60);
  assert.equal(results.filter((res) => res.statusCode === 429).length, 140);
  assert.equal(await redisA.zcard(getRateLimitRedisKeyNames(name, identity)[1]), 1);
});

import assert from 'node:assert/strict';
import express from 'express';
import proxyaddr from 'proxy-addr';
import test from 'node:test';
import { configureTrustedProxy } from '../src/config/trustedProxy.js';
import { createTokenBucketLimiter } from '../src/middleware/tokenBucketRateLimit.js';
import { createAiQuotaMiddleware } from '../src/middleware/aiQuota.js';
import { createAiProviderGovernor } from '../src/services/aiProviderGovernor.js';
import { MAX_UPLOAD_BYTES, validateUploadedFile, validateUploadedFiles } from '../src/middleware/uploadLimits.js';
import { HttpError } from '../src/middleware/errorHandler.js';

function responseStub() {
  const headers = {};
  return {
    headers, statusCode: 200, body: undefined,
    set(name, value) { headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function runMiddleware(middleware, req) {
  const res = responseStub();
  let nextError;
  let nextCalled = false;
  await middleware(req, res, (error) => { nextError = error; nextCalled = true; });
  return { res, nextError, nextCalled };
}

test('token bucket middleware reports an allow and enforces 429 with Retry-After', async () => {
  const calls = [];
  const redisClient = { async eval(...args) { calls.push(args); return [1, 3, 0, 1, 0]; } };
  const limiter = createTokenBucketLimiter({ name: 'unit-scope', config: { capacity: 4, refillRate: 1, maxActiveKeys: 10 }, keyGenerator: (req) => req.identity, redisClient });
  const allowed = await runMiddleware(limiter, { identity: 'person@example.test', ip: '127.0.0.1' });
  assert.equal(allowed.nextCalled, true);
  assert.equal(allowed.res.headers['RateLimit-Remaining'], '3');
  assert.equal(calls[0][1], 4, 'Lua script receives four fixed Redis keys');
  assert.ok(calls[0][2].startsWith('commerceforge:rate-limit:unit-scope:'));
  assert.doesNotMatch(calls[0][2], /person@example\.test/, 'identity values are not stored in Redis key names');

  const limited = createTokenBucketLimiter({ name: 'unit-full', config: { capacity: 1, refillRate: 0.1 }, keyGenerator: () => 'same', redisClient: { async eval() { return [0, 0, 5000, 1, 0]; } } });
  const rejected = await runMiddleware(limited, {});
  assert.equal(rejected.res.statusCode, 429);
  assert.equal(rejected.res.headers['Retry-After'], '5');
  assert.equal(rejected.res.body.error.code, 'rate_limit_exceeded');
});

test('Redis failure fails closed and the same limiter recovers when Redis responds', async () => {
  let unavailable = true;
  const limiter = createTokenBucketLimiter({
    name: 'recovery-unit', config: { capacity: 5, refillRate: 1 }, keyGenerator: () => 'user',
    redisClient: { async eval() { if (unavailable) throw new Error('offline'); return [1, 4, 0, 1, 0]; } },
  });
  const outage = await runMiddleware(limiter, {});
  assert.equal(outage.nextError.status, 503);
  assert.equal(outage.nextError.code, 'rate_limit_unavailable');
  unavailable = false;
  const recovered = await runMiddleware(limiter, {});
  assert.equal(recovered.nextCalled, true);
  assert.equal(recovered.nextError, undefined);
});

test('proxy trust uses configured addresses and ignores spoofed forwarded headers from direct clients', () => {
  const app = express();
  assert.equal(configureTrustedProxy(app, ''), false);
  assert.equal(app.get('trust proxy'), false);

  const trusted = express();
  configureTrustedProxy(trusted, '192.0.2.10, 2001:db8:1::/48');
  const trust = trusted.get('trust proxy fn');
  const directRequest = {
    connection: { remoteAddress: '203.0.113.44' },
    headers: { 'x-forwarded-for': '198.51.100.99' },
  };
  assert.equal(proxyaddr(directRequest, trust), '203.0.113.44');
  const proxiedRequest = {
    connection: { remoteAddress: '192.0.2.10' },
    headers: { 'x-forwarded-for': '203.0.113.44' },
  };
  assert.equal(proxyaddr(proxiedRequest, trust), '203.0.113.44');
});

test('trusted tenant identity ignores caller-selected tenantId', async () => {
  const usedIdentities = [];
  const redisClient = { async eval(...args) { usedIdentities.push(args[11]); return [1, 119, 0, 1, 0]; } };
  const limiter = createTokenBucketLimiter({ name: 'tenant-unit', config: { capacity: 120, refillRate: 2 }, keyGenerator: (req) => req.tenant?._id || req.rateLimitTenantId || 'unresolved-tenant-context', redisClient });
  await runMiddleware(limiter, { tenantId: 'attacker-choice' });
  await runMiddleware(limiter, { tenant: { _id: 'server-tenant' }, tenantId: 'attacker-choice' });
  assert.notEqual(usedIdentities[0], usedIdentities[1]);
});

test('AI quota is weighted by server-estimated request tokens and requires trusted user and tenant context', async () => {
  const costs = [];
  const redisClient = { async eval(...args) { costs.push(args[9]); return [1, 10000 - Number(args[9]), 0, 1, 0]; } };
  const quota = createAiQuotaMiddleware({ redisClient, config: { maxInputTokens: 100, maxOutputTokens: 20 } });
  const request = { ip: '192.0.2.1', user: { id: 'user-1' }, tenant: { _id: 'tenant-1' }, body: { prompt: 'A'.repeat(30) } };
  const accepted = await runMiddleware(quota, request);
  assert.equal(accepted.nextCalled, true);
  assert.ok(request.aiQuota.inputTokens > 0 && request.aiQuota.inputTokens <= 100);
  assert.equal(costs.length, 3, 'IP, user, and tenant quota buckets all consume the input cost');
  assert.ok(costs.every((cost) => Number(cost) === request.aiQuota.inputTokens));

  const denied = await runMiddleware(quota, { ...request, tenant: undefined, rateLimitTenantId: undefined });
  assert.equal(denied.nextError.code, 'trusted_tenant_required');
  assert.equal(denied.nextError.status, 503);
});

test('AI provider governor bounds concurrency, timeout, output tokens, and accounts usage', async () => {
  const counters = {};
  const redisClient = {
    async eval(script) { return script.includes('ZREMRANGEBYSCORE') ? [1, 0] : [1]; },
    async hincrby(_key, field, value) { counters[field] = (counters[field] || 0) + Number(value); return counters[field]; },
    async hgetall() { return counters; },
    async zcard() { return 0; },
  };
  const config = { maxInputTokens: 100, maxOutputTokens: 12, timeoutMs: 100, maxConcurrency: 2, inputCostMicrousdPer1k: 1000, outputCostMicrousdPer1k: 2000 };
  const run = createAiProviderGovernor({ redisClient, config });
  const quota = { identities: { ip: '192.0.2.1', user: 'u-1', tenant: 't-1' } };
  const result = await run({ input: 'hello', quota, providerCall: async ({ maxOutputTokens }) => ({ text: 'done', usage: { input_tokens: 3, output_tokens: 2, maxOutputTokens } }) });
  assert.deepEqual(result.usage, { inputTokens: 3, outputTokens: 2, costMicrousd: 7 });
  assert.equal(counters.requests, 1);
  assert.equal(counters.input_tokens, 3);

  const timeoutConfig = { ...config, timeoutMs: 5 };
  const runTimed = createAiProviderGovernor({ redisClient, config: timeoutConfig });
  await assert.rejects(runTimed({ input: 'hello', quota, providerCall: () => new Promise(() => {}) }), (error) => error.code === 'ai_provider_timeout');
  await assert.rejects(run({ input: 'hello', quota, providerCall: async () => ({ text: 'too many', usage: { output_tokens: 13 } }) }), (error) => error.code === 'ai_output_too_large');
});

test('upload policy rejects oversize files, disallowed MIME and mismatched magic bytes', () => {
  assert.throws(() => validateUploadedFile({ size: MAX_UPLOAD_BYTES + 1, mimetype: 'image/png', buffer: Buffer.alloc(8) }), (error) => error.code === 'upload_too_large');
  assert.throws(() => validateUploadedFile({ size: 4, mimetype: 'application/pdf', buffer: Buffer.from('%PDF') }), (error) => error.code === 'upload_type_not_allowed');
  assert.throws(() => validateUploadedFile({ size: 4, mimetype: 'image/png', buffer: Buffer.from('text') }), (error) => error.code === 'upload_type_not_allowed');
  const validPng = { size: 8, mimetype: 'image/png', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) };
  assert.equal(validateUploadedFile(validPng), validPng);
  assert.ok(validateUploadedFiles);
  assert.ok(HttpError);
});

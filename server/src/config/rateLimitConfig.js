// Owner: M2 — demo token-bucket capacities and refill rates (tokens per second).
const positiveInteger = (value, fallback, max = 1000000) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= max ? parsed : fallback;
};

const activeIdentityLimit = positiveInteger(process.env.RATE_LIMIT_MAX_IDENTITIES, 10000, 100000);
const aiMaxInputTokens = positiveInteger(process.env.AI_MAX_INPUT_TOKENS, 4000, 100000);
const aiMaxOutputTokens = positiveInteger(process.env.AI_MAX_OUTPUT_TOKENS, 1000, 32000);
const rateLimitPlan = String(process.env.RATE_LIMIT_PLAN || 'basic').toLowerCase();
const planMultipliers = Object.freeze({ free: 0.5, basic: 1, plus: 2, pro: 4 });
const rateMultiplier = planMultipliers[rateLimitPlan] || planMultipliers.basic;
const forPlan = (capacity, refillRate, extra = {}) => Object.freeze({
  capacity: Math.max(1, Math.round(capacity * rateMultiplier)),
  refillRate: Math.max(1 / 60, refillRate * rateMultiplier),
  ...extra,
});

export const rateLimitConfig = Object.freeze({
  global: forPlan(120, 2, { maxActiveKeys: activeIdentityLimit }),
  tenant: forPlan(600, 10, { maxActiveKeys: activeIdentityLimit }),
  loginIp: Object.freeze({ capacity: 10, refillRate: 1 / 30 }),
  // Account attempts are scoped to account + source IP. The IP bucket remains
  // independently enforced, while one hostile source cannot lock out a victim globally.
  loginAccount: Object.freeze({ capacity: 10, refillRate: 1 / 30 }),
  registerIp: Object.freeze({ capacity: 20, refillRate: 1 / 15 }),
  checkoutIp: forPlan(10, 1 / 15),
  checkoutAccount: forPlan(8, 1 / 30),
  webhookIp: forPlan(60, 1),
  aiIp: Object.freeze({ capacity: 10000, refillRate: 10000 / 3600, maxActiveKeys: activeIdentityLimit }),
  aiUser: Object.freeze({ capacity: 30000, refillRate: 30000 / 3600, maxActiveKeys: activeIdentityLimit }),
  aiTenant: Object.freeze({ capacity: 300000, refillRate: 300000 / 3600, maxActiveKeys: activeIdentityLimit }),
});

export const aiRequestConfig = Object.freeze({
  maxInputTokens: aiMaxInputTokens,
  maxOutputTokens: aiMaxOutputTokens,
  timeoutMs: positiveInteger(process.env.AI_PROVIDER_TIMEOUT_MS, 15000, 120000),
  maxConcurrency: positiveInteger(process.env.AI_PROVIDER_MAX_CONCURRENCY, 8, 256),
  inputCostMicrousdPer1k: Math.max(0, Number(process.env.AI_INPUT_COST_MICROUSD_PER_1K) || 0),
  outputCostMicrousdPer1k: Math.max(0, Number(process.env.AI_OUTPUT_COST_MICROUSD_PER_1K) || 0),
});

export const rateLimitMaxActiveKeys = activeIdentityLimit;

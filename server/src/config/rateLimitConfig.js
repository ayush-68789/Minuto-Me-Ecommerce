// Owner: M2 — demo token-bucket capacities and refill rates (tokens per second).
export const rateLimitConfig = Object.freeze({
  global: Object.freeze({ capacity: 120, refillRate: 2 }),
  tenant: Object.freeze({ capacity: 600, refillRate: 10 }),
  loginIp: Object.freeze({ capacity: 10, refillRate: 1 / 30 }),
  loginAccount: Object.freeze({ capacity: 10, refillRate: 1 / 30 }),
  registerIp: Object.freeze({ capacity: 20, refillRate: 1 / 15 }),
  checkoutIp: Object.freeze({ capacity: 10, refillRate: 1 / 15 }),
  checkoutAccount: Object.freeze({ capacity: 8, refillRate: 1 / 30 }),
});

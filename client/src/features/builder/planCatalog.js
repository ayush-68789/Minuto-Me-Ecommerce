export const plans = [
  {
    name: 'Free', price: '₹0', cadence: 'forever', line: 'Start with a protected request allowance for a small store.',
    description: 'For trying an idea and learning the workflow.',
    features: { adminReports: false, inventory: false, attackDemo: false, checkout: false, rateLimiting: true },
    summary: ['Responsive storefront', 'Product CRUD API', 'Customer accounts and orders', 'Health checks and Free plan rate limits'],
  },
  {
    name: 'Basic', price: '₹499', cadence: '/ month', line: 'Get more request capacity and clearer store activity.',
    description: 'For a small shop that wants a clearer view of activity.',
    features: { adminReports: true, inventory: false, attackDemo: false, checkout: false, rateLimiting: true },
    summary: ['Everything in Free', 'Admin user and order reports', 'Higher API request allowance'],
  },
  {
    name: 'Plus', price: '₹1,499', cadence: '/ month', line: 'More request capacity with concurrency-safe stock.',
    description: 'For growing catalogs where overselling is a concern.',
    features: { adminReports: true, inventory: true, attackDemo: false, checkout: false, rateLimiting: true },
    summary: ['Everything in Basic', 'Atomic stock reservations', 'Reservation expiry and recovery', 'Higher API request allowance'],
    featured: true,
  },
  {
    name: 'Pro', price: '₹3,999', cadence: '/ month', line: 'The highest request allowance and replay-safe checkout.',
    description: 'For teams evaluating the complete implemented demo.',
    features: { adminReports: true, inventory: true, attackDemo: true, checkout: true, rateLimiting: true },
    summary: ['Everything in Plus', 'Idempotent checkout', 'Verified payment webhooks', 'Highest API request allowance', 'Concurrency attack demo'],
  },
];

export const planFeatureRows = [
  { label: 'Responsive storefront and ZIP export', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Product create, read, update and delete API', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Authentication, roles and protected orders', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Plan-based Redis token-bucket request protection', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Admin user and order reports', availability: { Free: false, Basic: true, Plus: true, Pro: true } },
  { label: 'Atomic inventory reservations and expiry', availability: { Free: false, Basic: false, Plus: true, Pro: true } },
  { label: 'Idempotent checkout and verified payment webhooks', availability: { Free: false, Basic: false, Plus: false, Pro: true } },
  { label: 'Naive vs hardened concurrency demo', availability: { Free: false, Basic: false, Plus: false, Pro: true } },
  { label: 'Full tenant data isolation', availability: { Free: false, Basic: false, Plus: false, Pro: false, unavailable: true } },
];

export function getPlan(name) {
  return plans.find((plan) => plan.name === name) || plans[0];
}

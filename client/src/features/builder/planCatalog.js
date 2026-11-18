export const plans = [
  {
    name: 'Free', price: '₹0', cadence: 'forever', line: 'Build a starter store with the core commerce tools.',
    description: 'For trying an idea and learning the workflow.',
    features: { adminReports: false, inventory: false, attackDemo: false, checkout: false, rateLimiting: false },
    summary: ['Responsive storefront', 'Product CRUD API', 'Customer accounts and orders', 'Health checks'],
  },
  {
    name: 'Basic', price: '₹499', cadence: '/ month', line: 'Add visibility into users and order activity.',
    description: 'For a small shop that wants a clearer view of activity.',
    features: { adminReports: true, inventory: false, attackDemo: false, checkout: false, rateLimiting: false },
    summary: ['Everything in Free', 'Admin user and order reports'],
  },
  {
    name: 'Plus', price: '₹1,499', cadence: '/ month', line: 'Protect stock from overselling with atomic reservations.',
    description: 'For growing catalogs where overselling is a concern.',
    features: { adminReports: true, inventory: true, attackDemo: false, checkout: false, rateLimiting: false },
    summary: ['Everything in Basic', 'Atomic stock reservations', 'Reservation expiry and recovery'],
    featured: true,
  },
  {
    name: 'Pro', price: '₹3,999', cadence: '/ month', line: 'Add API rate protection, checkout and verified webhooks.',
    description: 'For teams evaluating the complete implemented demo.',
    features: { adminReports: true, inventory: true, attackDemo: true, checkout: true, rateLimiting: true },
    summary: ['Everything in Plus', 'Redis-backed API rate limiting', 'Idempotent checkout', 'Signed demo payment events', 'Concurrency attack demo'],
  },
];

export const planFeatureRows = [
  { label: 'Responsive storefront and ZIP export', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Product create, read, update and delete API', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Authentication, roles and protected orders', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Redis-backed token-bucket rate limiting', availability: { Free: false, Basic: false, Plus: false, Pro: true } },
  { label: 'Admin user and order reports', availability: { Free: false, Basic: true, Plus: true, Pro: true } },
  { label: 'Atomic inventory reservations and expiry', availability: { Free: false, Basic: false, Plus: true, Pro: true } },
  { label: 'Idempotent checkout and signed demo payment events', availability: { Free: false, Basic: false, Plus: false, Pro: true } },
  { label: 'Naive vs hardened concurrency demo', availability: { Free: false, Basic: false, Plus: false, Pro: true } },
  { label: 'Full tenant data isolation', availability: { Free: false, Basic: false, Plus: false, Pro: false, unavailable: true } },
];

export function getPlan(name) {
  return plans.find((plan) => plan.name === name) || plans[0];
}

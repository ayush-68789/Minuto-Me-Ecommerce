export const plans = [
  { name: 'Free', price: 'Free', line: 'Store setup and product CRUD', features: { adminReports: false, inventory: false, attackDemo: false, checkout: false } },
  { name: 'Basic', price: 'Demo tier', line: 'Free plus admin reports', features: { adminReports: true, inventory: false, attackDemo: false, checkout: false } },
  { name: 'Plus', price: 'Demo tier', line: 'Basic plus concurrency-safe inventory', features: { adminReports: true, inventory: true, attackDemo: false, checkout: false }, featured: true },
  { name: 'Pro', price: 'Demo tier', line: 'Plus plus idempotent payment checkout and attack demo', features: { adminReports: true, inventory: true, attackDemo: true, checkout: true } },
];

export const planFeatureRows = [
  { label: 'Responsive storefront and ZIP export', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Admin-protected product CRUD', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Authentication, roles and protected orders', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Health checks and Redis rate limiting', availability: { Free: true, Basic: true, Plus: true, Pro: true } },
  { label: 'Admin user/order reports', availability: { Free: false, Basic: true, Plus: true, Pro: true } },
  { label: 'Atomic inventory reservations and expiry', availability: { Free: false, Basic: false, Plus: true, Pro: true } },
  { label: 'Naive vs hardened concurrency demo', availability: { Free: false, Basic: false, Plus: false, Pro: true } },
  { label: 'Idempotent checkout and verified payment webhooks', availability: { Free: false, Basic: false, Plus: false, Pro: true } },
  { label: 'Full tenant data isolation', availability: { Free: false, Basic: false, Plus: false, Pro: false, unavailable: true } },
];

export function getPlan(name) {
  return plans.find((plan) => plan.name === name) || plans[0];
}

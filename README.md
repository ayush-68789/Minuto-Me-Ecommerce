# Minuto Mein Ecommerce

React and Express ecommerce website builder and demo backend. See [OWNERSHIP.md](OWNERSHIP.md) for each member’s features and exact file paths, and [docs/architecture.md](docs/architecture.md) for the server architecture.

## Team

| Member | Role |
|---|---|
| M1 | Backend foundation, authentication and authorization |
| M2 | Redis-backed rate limiting and abuse control |
| M3 | Dynamic storefront and catalog browsing |
| M4 | Admin dashboard and product management |
| M5 | Cart, checkout, orders and payments |

## Six-week demo plan

1. Foundation, API contracts, health API and app shell.
2. Identity/access, Redis rate limits and tenant scoping integration.
3. Storefront/catalog.
4. Admin/products.
5. Cart, checkout, orders and payment demo.
6. Integration, documentation and rehearsal.

## Implemented API

- Health: `GET /api/health`, `GET /api/health/live`, and `GET /api/health/ready` (process-only readiness placeholder).
- Auth and authorization (M1): register, login, refresh, logout and current user under `/api/auth`; owner-only order reads under `/api/orders`; admin-only routes under `/api/admin`. Short-lived access JWTs remain in app memory; rotating refresh JWTs use an HttpOnly cookie, with hashed refresh identifiers persisted in MongoDB for revocation.
- Store Studio itself does not use Redis rate limiting. Rate limiting is part of each exported store backend, enabled with a plan-specific token-bucket allowance and backed by Redis.
- Product CRUD: admin-protected MongoDB endpoints under `/api/admin/products`.
- Concurrency-safe inventory: MongoDB replica-set transactions reserve stock for a limited time and release expired or failed reservations.
- Checkout and payments: idempotent checkout under `/api/checkout`, Razorpay-compatible webhook handling under `/api/webhooks/razorpay`, plus the M5 demo cart, orders, and payment APIs.
- Store Studio: configure a storefront, choose a plan, preview it, and export the generated app and selected backend modules as a ZIP.

Plan flags in exported backends gate optional admin reports, inventory concurrency, checkout, and attack demos. Billing is not implemented. Tenant IDs are validated and used to scope selected commerce models, but full tenant provisioning and isolation across every legacy in-memory API is still incomplete. See [docs/api/README.md](docs/api/README.md) for API details.

## Run locally

```sh
npm install
npm run dev
npm test
```

Copy `server/.env.example` to `server/.env`, replace both JWT secret placeholders with different random values of at least 32 characters, and set `ADMIN_EMAIL`/`ADMIN_PASSWORD` to get an admin account. The local MongoDB URI is `mongodb://127.0.0.1:27017/commerceforge`; use the same string in MongoDB Compass. The Store Studio platform runs with `RATE_LIMITING_ENABLED=false`, so Redis is not needed for its own routes. Exported store backends enable Redis rate limiting and include Docker Compose configuration for Redis and MongoDB. Inventory transaction endpoints require MongoDB to run as a replica set.

The npm workspace starts the React app on port `5173` and the API on port `5000`; Vite proxies `/api` requests to the backend.

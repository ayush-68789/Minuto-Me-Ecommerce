# Minuto Me — six-week MVC demo scaffold

Initial React and Express workspace. See [OWNERSHIP.md](OWNERSHIP.md) for each member’s features and exact file paths, and [docs/architecture.md](docs/architecture.md) for the MVC layout.

## Team

| Member | Role |
|---|---|
| M1 | Backend foundation, authentication and authorization |
| M2 | Store customization and onboarding |
| M3 | Dynamic storefront and catalog browsing |
| M4 | Admin dashboard and product management |
| M5 | Cart, checkout, orders and payments |

## Six-week demo plan

1. Foundation, API contracts, health API and app shell.
2. Identity/access and store setup.
3. Storefront/catalog.
4. Admin/products.
5. Cart, checkout, orders and payment demo.
6. Integration, documentation and rehearsal.

## Implemented API

Only three health endpoints are implemented: `GET /api/health`, `GET /api/health/live`, and `GET /api/health/ready` (process-only readiness placeholder). All listed feature paths are planned until implemented by their owners.

## Run locally

```sh
npm install
npm run dev
```

The npm workspace starts the React app on port `5173` and the API on port `5000`; Vite proxies `/api` requests to the backend.

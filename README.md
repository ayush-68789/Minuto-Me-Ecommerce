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

- Health: `GET /api/health`, `GET /api/health/live`, and `GET /api/health/ready` (process-only readiness placeholder).
- Auth and authorization (M1): register, login, logout and current user under `/api/auth`; owner-only order reads under `/api/orders`; admin-only routes under `/api/admin`. Data is in memory and resets on restart.

See [docs/api/README.md](docs/api/README.md) for the contract and the access-control demo. All other listed feature paths are planned until implemented by their owners.

## Run locally

```sh
npm install
npm run dev
npm test
```

Copy `server/.env.example` to `server/.env` and set `ADMIN_EMAIL`/`ADMIN_PASSWORD` to get an admin account.

The npm workspace starts the React app on port `5173` and the API on port `5000`; Vite proxies `/api` requests to the backend.

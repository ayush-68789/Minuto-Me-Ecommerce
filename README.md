# CommerceForge Store Studio

CommerceForge is a guided store setup prototype. A user chooses a business category, adds product details, picks a visual style and demo tier, previews a responsive storefront, then downloads a ZIP containing that storefront and the backend modules currently implemented in this repository.

The client is a feature-based React + Tailwind application, not MVC. The backend is Express MVC and is included as source in the export.

## Run locally

From the repository root in PowerShell:

```powershell
npm install
Copy-Item server/.env.example server/.env
# Optional: set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env for admin route checks.
docker compose up -d redis
npm run dev
```

If Docker is unavailable, start Redis at `127.0.0.1:6379` using a Windows-compatible Redis distribution. The Store Studio and ZIP export endpoint work without Redis; protected commerce endpoints in the exported backend require it.

Open `http://localhost:5173`. The API is at `http://localhost:5000`. The export route is `POST /api/store-builder/export` and is mounted before customer commerce rate limiting.

## Backend modules included today

- Health, liveness and readiness endpoints.
- Registration, login, logout, sessions and role checks.
- Owner-scoped order create and read APIs.
- Admin-only user and order read APIs.
- Redis-backed token-bucket rate limiting.

The generated catalog is storefront configuration, not a product CRUD API. Inventory concurrency, payment processing, idempotent checkout and full tenant data isolation are not implemented in this checkout and are not represented as included features.

The current backend stores users, sessions and orders in memory. Records reset when the server restarts. Tenant header validation does not yet isolate tenant data. Plan names are saved in generated configuration only; billing, quotas and plan-based feature gating are not implemented.

See [the API contract](docs/api/README.md), [architecture notes](docs/architecture.md), and [member file ownership](OWNERSHIP.md).

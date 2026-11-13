# Architecture — MVC API and React client

**Owners:** Shared. M1 coordinates API conventions; each member implements their assigned feature in the same MVC layers.

## Backend

```text
server/src/
├── app.js                  # M1: Express composition
├── routes/                 # HTTP path/method to controller mapping
├── controllers/            # Request handling and JSON responses
├── models/                 # Application data and persistence
└── middleware/             # M1: shared auth, validation and error handling
```

This is a JSON API, so controllers return JSON directly; server-side HTML views are not used. There is no service layer. The health API already follows this structure. M1 owns identity/auth; M2 owns Redis rate limiting; M3 owns storefront/catalog reads; M4 owns admin/product management and the Product schema with M3 input; M5 owns cart, checkout, orders, payments and tenant-scoped commerce behavior.

## Client

```text
client/src/
├── main.jsx                # M2: React entry
├── models/                 # Client data and API calls
├── controllers/             # React hooks and user actions
└── views/                   # React pages and visual components
```

Client views remain because React needs presentation components. Ownership: M1 auth, M2 rate-limit feedback/API handling, M3 storefront, M4 admin, M5 cart/orders. M2 coordinates the shared app shell.

See [OWNERSHIP.md](../OWNERSHIP.md) for the complete member-by-member list of features and exact filenames/paths, including which files already exist and which each member should create.

## Implemented endpoints

- `GET /api/health` — overall process health
- `GET /api/health/live` — liveness
- `GET /api/health/ready` — process-only readiness placeholder
- `/api/auth` — register, login, logout, current user (M1)
- `/api/orders` — minimal create/list/detail with owner-only access (M1 access rules; M5 owns checkout)
- `/api/admin` — minimal admin-only lists (M1 access rules; M4 owns the dashboard)
- `/api/cart`, `/api/payments` — authenticated cart and demo payment endpoints (M5)
- Redis token bucket middleware on non-health API routes (M2)

Users, sessions and orders are held in memory until shared persistence is chosen. All other listed product features are planned.

## Six-week sequence

1. MVC foundation, contracts, health API and app shell.
2. Identity/access, rate limiting and tenant-scoped commerce integration.
3. Storefront/catalog.
4. Admin/products.
5. Cart, checkout, orders and payment demo.
6. Integration, documentation and rehearsal.

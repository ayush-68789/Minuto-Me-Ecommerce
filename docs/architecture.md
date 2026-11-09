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

This is a JSON API, so controllers return JSON directly; server-side HTML views are not used. There is no service layer. The health API already follows this structure. M1 owns identity/auth; M2 owns store setup (M1 collaborates on tenant persistence); M3 owns storefront/catalog reads; M4 owns admin/product management and the Product schema with M3 input; M5 owns cart, checkout, orders and payments.

## Client

```text
client/src/
├── main.jsx                # M2: React entry
├── models/                 # Client data and API calls
├── controllers/             # React hooks and user actions
└── views/                   # React pages and visual components
```

Client views remain because React needs presentation components. Ownership: M1 auth, M2 onboarding, M3 storefront, M4 admin, M5 cart/orders. M2 coordinates the shared app shell.

See [OWNERSHIP.md](../OWNERSHIP.md) for the complete member-by-member list of features and exact filenames/paths, including which files already exist and which each member should create.

## Implemented endpoints

- `GET /api/health` — overall process health
- `GET /api/health/live` — liveness
- `GET /api/health/ready` — process-only readiness placeholder

All other listed product features are planned.

## Six-week sequence

1. MVC foundation, contracts, health API and app shell.
2. Identity/access and store setup.
3. Storefront/catalog.
4. Admin/products.
5. Cart, checkout, orders and payment demo.
6. Integration, documentation and rehearsal.

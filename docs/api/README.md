# API contract

**Owners:** Shared; M1 maintains conventions, endpoint owners document their own APIs.

Document each endpoint's method, path, authentication, tenant scope, request/response shape, errors, and owning member before integration.

## Conventions (M1)

- **Authentication:** `POST /api/auth/login` returns a `token`. Send it as `Authorization: Bearer <token>`. Tokens expire after 8 hours and are revoked by logout.
- **Roles:** `customer` (every sign-up) and `admin` (seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `server/.env`). A `role` sent to register is ignored.
- **Errors:** every error is `{ "error": { "code", "message", "details"? } }`.

| Status | Meaning |
|---|---|
| 400 | Invalid JSON or failed validation (`details` lists the problems) |
| 401 | Missing, invalid or expired token; wrong email or password |
| 403 | Signed in, but the role is not allowed (customer on an admin route) |
| 404 | Unknown route, or a record that is missing **or belongs to another user** |
| 409 | Email already registered |

Data is held in memory until shared persistence is chosen, so users, sessions and orders reset when the server restarts.

## Guarding your own routes

```js
import { authenticate } from '../middleware/authMiddleware.js';
import { canAccessOwned, requireAdmin } from '../middleware/roleMiddleware.js';

router.use(authenticate);               // sets req.user = { id, name, email, role, createdAt }
router.use(authenticate, requireAdmin); // admin-only router

// Owned records: answer 404, not 403, so IDs cannot be probed.
if (!record || !canAccessOwned(req.user, record.customerId)) {
  throw new HttpError(404, 'not_found', 'Not found');
}
```

Take the owner from `req.user.id`, never from the request body. Wrap async controllers in `asyncHandler` from `middleware/errorHandler.js`.

## Health (M1) — public

- `GET /api/health`, `GET /api/health/live`, `GET /api/health/ready`

## Auth (M1)

| Method and path | Auth | Request body | Success |
|---|---|---|---|
| `POST /api/auth/register` | Public | `{ name, email, password }` (password 8–128 characters) | `201 { user, token }` |
| `POST /api/auth/login` | Public | `{ email, password }` | `200 { user, token }` |
| `POST /api/auth/logout` | Signed in | — | `204` |
| `GET /api/auth/me` | Signed in | — | `200 { user }` |

## Orders (M5; minimal version by M1 for the access rules)

| Method and path | Auth | Notes | Success |
|---|---|---|---|
| `POST /api/orders` | Signed in | `{ items: [{ productId, quantity }] }`; the customer is always the caller | `201 { order }` |
| `GET /api/orders` | Signed in | The caller's own orders only | `200 { orders }` |
| `GET /api/orders/:orderId` | Owner or admin | Anyone else gets `404` | `200 { order }` |

## Admin (M4; minimal version by M1 for the access rules)

| Method and path | Auth | Success |
|---|---|---|
| `GET /api/admin/users` | Admin | `200 { users }` |
| `GET /api/admin/orders` | Admin | `200 { orders }` |

Every path under `/api/admin` answers `401` without a token and `403` for a customer.

## Store export (platform demo)

| Method and path | Auth | Request | Success |
|---|---|---|---|
| `POST /api/store-builder/export` | Local demo endpoint; no user auth | Store Studio configuration JSON | `200` downloadable ZIP |

This route is mounted before customer commerce rate limiting because it is a platform-side builder/export endpoint, not a generated store's commerce API. It packages a configured React storefront and a fixed whitelist of backend source files present in this checkout. It rejects invalid store slugs and does not package `.env` secrets. The ZIP is a demo starter; it does not provision a tenant, deploy a site, implement missing member modules, or enforce the selected plan. Keep this endpoint behind platform authentication and abuse controls before exposing it publicly.

Generated backend current limits: in-memory records, no product CRUD/inventory protection, no payment or idempotency, and no tenant data isolation. A validated tenant selector is not equivalent to tenant isolation.

## Demo: the two attacks

Start the API with `ADMIN_EMAIL` and `ADMIN_PASSWORD` set in `server/.env`, then:

```sh
API=http://localhost:5000/api
register() { curl -s -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d "{\"name\":\"$1\",\"email\":\"$1@example.com\",\"password\":\"demo-password\"}" | node -pe 'JSON.parse(require("fs").readFileSync(0)).token'; }
ALICE=$(register alice); EVE=$(register eve)

# Alice places order 1.
curl -s -X POST $API/orders -H "Authorization: Bearer $ALICE" -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"sku-1","quantity":1}]}'

# Attack 1 — Eve swaps in Alice's order ID: 404.
curl -i $API/orders/1 -H "Authorization: Bearer $EVE"

# Attack 2 — Eve, a customer, calls an admin route: 403.
curl -i $API/admin/orders -H "Authorization: Bearer $EVE"
```

`npm test` runs the same attacks automatically (`server/test/auth.test.js`).

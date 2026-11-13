# API contract — Member 1 coordinates; endpoint owner is listed by module

All API responses use JSON. Shared errors have shape `{ "error": { "code": "...", "message": "...", "details": []? } }`. Authenticated routes use `Authorization: Bearer <token>`. Protected records derive the user ID from the authenticated session, never from query/body fields.

## Health (M1, public)

- `GET /api/health`
- `GET /api/health/live`
- `GET /api/health/ready`

## Identity (M1)

- `POST /api/auth/register` — public; `{ name, email, password }`; returns `{ user, token }`.
- `POST /api/auth/login` — public; `{ email, password }`; returns `{ user, token }`.
- `POST /api/auth/logout` — authenticated; revokes current token.
- `GET /api/auth/me` — authenticated; returns current public user.

## Cart (M5; authenticated)

Every cart key is derived from the authenticated user and tenant. Send `x-tenant-id` to select the store (defaults to `default` in this demo); do not send a client-controlled session ID.

- `GET /api/cart`
- `POST /api/cart/items` — `{ item: { productId, title, price, quantity, image } }`
- `PATCH /api/cart/items/:productId` — `{ quantity }`
- `DELETE /api/cart/items/:productId`
- `DELETE /api/cart`

**Integration limitation:** the Product persistence/catalog API is not merged yet. Cart item prices are still demo inputs until M4's server Product model is connected. Do not treat checkout pricing as production-safe until then.

## Orders and checkout (M5; authenticated)

All requests are tenant-scoped by `x-tenant-id`. Customers only see their own orders. Admin status changes require the admin role.

- `POST /api/orders/checkout` — `{ customer: { phone? }, shippingAddress: { street, city, ... }, paymentMethod, fromCart: true }`; buyer identity comes from the auth session.
- `POST /api/orders` — direct line-item compatibility for the M1 auth demo; `{ items: [{ productId, quantity }] }`.
- `GET /api/orders` — caller's orders. Admins may set `all=true` to list that tenant's orders.
- `GET /api/orders/:orderId` — owner/admin within the selected tenant; other/missing IDs both return 404.
- `PATCH /api/orders/:orderId/status` — admin only.

## Demo payments (M5)

- `POST /api/payments` — authenticated order owner; `{ orderId, method }`. Amount is read from the server-side order.
- `POST /api/payments/:id/process` — authenticated order owner; optional `{ simulateSuccess }` for the demo.
- `GET /api/payments/:id` — authenticated order owner.
- `POST /api/payments/webhook` — HMAC verified using raw request bytes and `x-payment-signature`; configure `PAYMENT_WEBHOOK_SECRET`.

This is a local payment simulation, not a live payment provider integration. Payment model persistence and event replay records remain demo-only.

## Rate limiting (M2)

The API uses an atomic Redis Lua token bucket shared across Express instances. `GET /api/health*` remains exempt so health probes work during a Redis outage; other API paths fail closed with `503 rate_limit_unavailable` if Redis cannot enforce the limit.

| Bucket | Scope | Capacity | Refill |
|---|---|---:|---:|
| Global | Client IP | 120 | 2 tokens/sec |
| Tenant | `x-tenant-id` | 600 | 10 tokens/sec |
| Login | Client IP and normalized account hash, independently | 10 | 1 token/30 sec |
| Registration | Client IP | 20 | 1 token/15 sec |
| Checkout | Client IP and authenticated user, independently | 10 / 8 | 1 token/15 sec / 1 token/30 sec |

When a bucket is empty, the API returns HTTP `429` with `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`. The global IP key uses Express `req.ip`; configure `TRUST_PROXY_HOPS` only for the exact trusted reverse-proxy hop count. The tenant selector currently uses a validated `x-tenant-id` header because a server-side Store resolver is not implemented yet; M2's limiter scopes quota by this selector, and M5/M1 must replace it with server-resolved tenant identity when the Store model is available.

## Run Redis locally

```sh
docker compose up -d redis
```

Set `REDIS_URL` in `server/.env` if Redis is elsewhere. See `server/.env.example` for local settings.

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

The API uses atomic Redis Lua token buckets shared across Express instances. `GET /api/health*` remains exempt so health probes work during a Redis outage; other API paths fail closed with `503 rate_limit_unavailable` if Redis cannot enforce the limit. Global and trusted-tenant checks run before JSON/urlencoded body parsing. Raw payment webhooks also have their own IP bucket, and the intentionally naive attack-demo handlers have explicit route-level IP buckets.

| Bucket | Scope | Capacity | Refill |
|---|---|---:|---:|
| Global | Client IP | 120 | 2 tokens/sec |
| Tenant | server-resolved `req.tenant._id` or `req.rateLimitTenantId` | 600 | 10 tokens/sec |
| Login | Client IP and normalized account + source IP, independently | 10 | 1 token/30 sec |
| Registration | Client IP | 20 | 1 token/15 sec |
| Checkout | Client IP and authenticated user, independently | 10 / 8 | 1 token/15 sec / 1 token/30 sec |
| Payment webhook | Client IP | 60 | 1 token/sec |
| Naive attack demos | Client IP, per demo bucket | 10 | 1 token/15 sec |

When a bucket is empty, the API returns HTTP `429` with `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`. Identity values are SHA-256 hashed before becoming Redis keys. Each limiter has an expiring exact identity registry capped by `RATE_LIMIT_MAX_IDENTITIES` (default 10,000); new identities share one overflow bucket after the cap is reached. `GET /api/admin/rate-limit-metrics` returns active identity counts, allow/reject totals, overflow counts and aggregate AI usage to authenticated admins.

The tenant limiter never uses the caller's `x-tenant-id` header. Member 5's trusted resolver should set `req.tenant._id` (or the agreed `req.rateLimitTenantId` contract). Until that exists, requests share one conservative unresolved-tenant bucket. Product/order tenant behavior remains owned by the tenant workstream.

Express proxy trust is disabled by default. Set `TRUST_PROXY_CIDRS` to a comma-separated allowlist of the exact reverse proxy IPs/CIDRs. Do not trust an arbitrary hop count or accept forwarded headers from direct clients; `req.ip` is only trusted behind configured proxies.

Request bodies default to 256 KB JSON and 32 KB URL-encoded. The raw Razorpay webhook body is capped at 100 KB. Future file routes should use `validateUploadedFiles` after an in-memory multipart parser: maximum five files, 5 MB each, JPEG/PNG/WebP MIME and magic-byte checks.

AI routes are not implemented yet. Future authenticated AI handlers must mount `aiQuota` after auth and the server-resolved tenant middleware, then call `createAiProviderGovernor` with the provider adapter. Defaults cap input/output tokens, apply per-IP/user/tenant hourly token buckets, bound distributed provider concurrency, abort timed-out requests, and aggregate token/cost usage. Configure provider cost per 1,000 tokens with the `AI_*_COST_MICROUSD_PER_1K` environment values; zero means cost is not estimated. No AI provider is called by this demo today.

## Run Redis locally

```sh
docker compose up -d redis
```

Set `REDIS_URL` in `server/.env` if Redis is elsewhere. See `server/.env.example` for local settings.

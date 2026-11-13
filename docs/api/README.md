# API contract

**Owners:** Shared; M1 maintains conventions, endpoint owners document their own APIs.

Document each endpoint's method, path, authentication, tenant scope, request/response shape, errors, and owning member before integration.

## Implemented APIs

### Health (M1)
- `GET /api/health` — Overall service status
- `GET /api/health/live` — Liveness status
- `GET /api/health/ready` — Readiness status

---

### M5 — Cart (`/api/cart`)
Tenant scope: `x-tenant-id` header or `tenantId` query/body param (default: `'default'`).  
Session scope: `x-session-id` header or `sessionId` query/body param (default: `'anonymous'`).

- `GET /api/cart`
  - **Returns:** `{ cart: { tenantId, sessionId, items, pricing: { subtotal, shipping, tax, total, currency }, itemCount } }`
- `POST /api/cart/items`
  - **Body:** `{ item: { productId, title, price, quantity, image } }`
  - **Returns:** `{ cart, message }`
- `PATCH /api/cart/items/:productId`
  - **Body:** `{ quantity: number }`
  - **Returns:** `{ cart, message }`
- `DELETE /api/cart/items/:productId`
  - **Returns:** `{ cart, message }`
- `DELETE /api/cart`
  - **Returns:** `{ cart, message }`

---

### M5 — Orders & Checkout (`/api/orders`)
- `POST /api/orders/checkout` or `POST /api/orders`
  - **Body:** `{ customer: { name, email, phone }, shippingAddress: { street, city, state, postalCode, country }, paymentMethod, fromCart: true }`
  - **Returns:** `201 Created` `{ order, payment, message }`
- `GET /api/orders`
  - **Query:** `tenantId`, `email`, `customerId`, `limit`
  - **Returns:** `{ orders: [...] }`
- `GET /api/orders/:id`
  - **Returns:** `{ order, payments: [...] }`
- `PATCH /api/orders/:id/status`
  - **Body:** `{ status: "pending" | "processing" | "paid" | "shipped" | "delivered" | "cancelled" }`
  - **Returns:** `{ order, message }`

---

### M5 — Payments (`/api/payments`)
- `POST /api/payments`
  - **Body:** `{ orderId, amount, currency, method }`
  - **Returns:** `201 Created` `{ payment }`
- `POST /api/payments/:id/process`
  - **Body:** `{ simulateSuccess: boolean, providerDetails: object }`
  - **Returns:** `{ payment, message }`
- `GET /api/payments/:id`
  - **Returns:** `{ payment }`
- `POST /api/payments/webhook`
  - **Body:** `{ paymentId, event, payload }`
  - **Returns:** `{ message, payment }`


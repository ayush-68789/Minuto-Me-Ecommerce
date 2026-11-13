# Member responsibilities and current file paths

The team assignments below follow the CommerceForge handoff. “Implemented here” means the code is present in the current checkout. Planned features are not packaged as completed features.

| Member | Assignment |
|---|---|
| Member 1 | Inventory concurrency and oversell protection |
| Member 2 | Rate limiting and abuse control |
| Member 3 | Idempotent checkout and payments |
| Member 4 | Authentication and authorization |
| Member 5 | Tenant isolation and input trust |

## Implemented in this checkout

| Capability | Relevant paths | Current scope |
|---|---|---|
| Health checks | `server/src/routes/healthRoutes.js`, `server/src/controllers/healthController.js` | Health, liveness and readiness endpoints |
| Authentication and roles | `server/src/models/User.js`, `Session.js`, `server/src/controllers/authController.js`, `server/src/routes/authRoutes.js`, `server/src/middleware/authMiddleware.js`, `roleMiddleware.js` | Register/login/logout, sessions, customer/admin roles |
| Protected order basics | `server/src/models/Order.js`, `server/src/controllers/orderController.js`, `server/src/routes/orderRoutes.js` | In-memory create/list/get with owner checks; no product pricing or stock enforcement |
| Admin read APIs | `server/src/controllers/adminController.js`, `server/src/routes/adminRoutes.js` | Admin-only user and order lists; no product CRUD UI/API |
| Redis rate limiting | `server/src/config/redisClient.js`, `rateLimitConfig.js`, `server/src/middleware/tokenBucketRateLimit.js` | Shared token bucket, global/tenant/login/register/checkout scopes |
| Store Studio | `client/src/app/App.jsx`, `client/src/features/builder/BuilderWorkspace.jsx`, `client/src/features/builder/components/PreviewPane.jsx`, `client/src/shared/context/BuilderContext.jsx` | Option-based configuration, product entry, plan metadata, storefront preview |
| ZIP export | `server/src/routes/storeExportRoutes.js`, `server/src/controllers/storeExportController.js`, `server/src/utils/zipArchive.js`, `client/src/shared/api/storeExport.js` | Exports configured React storefront plus current backend source snapshot |

## Not implemented in this checkout

| Assignment | Status and planned files |
|---|---|
| Member 1 — inventory | No Product/Inventory model, atomic stock reservation, or oversell protection. Planned: `server/src/models/Product.js`, `server/src/controllers/inventoryController.js`, `server/src/routes/inventoryRoutes.js`. |
| Member 3 — payment/idempotency | No payment gateway or checkout idempotency. Planned: `server/src/models/Payment.js`, `server/src/controllers/paymentController.js`, `server/src/routes/paymentRoutes.js`. |
| Member 5 — tenant isolation | `server/src/middleware/tenantContext.js` validates a tenant selector, but does not resolve a tenant or scope database records. Cross-tenant isolation is not complete. |
| Product management | No product CRUD backend or admin product editor exists. The builder's product data is only generated storefront configuration. |

## Export boundaries

The export whitelist lives in `server/src/controllers/storeExportController.js`. Add a module to the ZIP only after it is implemented and integrated. Never include `.env`, credentials, `node_modules`, or other local secrets in the archive. The selected tier is saved as metadata; billing and quota enforcement are not implemented.

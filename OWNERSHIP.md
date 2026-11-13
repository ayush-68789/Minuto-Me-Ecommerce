# Member feature and file ownership

This is the six-week implementation map. The scaffold, health endpoints, M1 authentication, M2 token-bucket middleware, and the M5 cart/order/payment branch are present. Listed feature files marked `Create` are planned and must be added by the assigned member. API MVC: routes dispatch to controllers, controllers return JSON, models own application data. React uses models, controllers (hooks/actions), and views.

## Team

| Member | Role |
|---|---|
| M1 | Backend foundation, authentication and authorization |
| M2 | Redis-backed rate limiting and abuse control |
| M3 | Dynamic storefront and public catalog |
| M4 | Admin dashboard and product management |
| M5 | Cart, checkout, orders and payments |

## Shared scaffold

| Path | Owner | Feature/status |
|---|---|---|
| `package.json` | M1 + M2 | Existing workspace scripts |
| `client/index.html`, `client/vite.config.js`, `client/src/main.jsx` | M2 | Existing React/Vite shell (shared scaffold) |
| `client/src/views/App.jsx`, `client/src/views/global.css` | All; M2 coordinates | Existing shared navigation, placeholder routes and styles |
| `server/server.js`, `server/src/app.js` | M1 | Existing Express bootstrap |
| `server/package.json`, `server/.env.example` | M1 | Existing API config |
| `docs/architecture.md`, `docs/api/README.md`, `docs/contributing.md` | All; M1 coordinates | Existing project/API docs |

## M1 — Backend, authentication, authorization

| Path | Status | Feature |
|---|---|---|
| `server/src/routes/healthRoutes.js` | Existing | Three health endpoint routes |
| `server/src/controllers/healthController.js` | Existing | Health request handlers |
| `server/src/models/healthModel.js` | Existing | Health data |
| `server/src/models/User.js` | Existing | User, password hash and roles |
| `server/src/controllers/authController.js` | Existing | Register, login, logout/session actions |
| `server/src/routes/authRoutes.js` | Existing | Authentication endpoints |
| `server/src/middleware/authMiddleware.js` | Existing | Verify session/token and set user |
| `server/src/middleware/roleMiddleware.js` | Existing | Admin/owner authorization |
| `server/src/middleware/errorHandler.js` | Existing | Consistent API error responses |
| `server/src/middleware/validateRequest.js` | Existing | Shared request validation adapter |
| `server/src/models/Session.js` | Existing | Login sessions (bearer tokens) |
| `server/test/auth.test.js` | Existing | Auth and access-control tests |
| `client/src/models/authModel.js` | Create | Client auth state and API calls |
| `client/src/models/authSessionModel.js` | Existing | Shared bearer token storage/API headers for M1/M5 |
| `client/src/controllers/useAuthController.js` | Create | Sign-in/sign-up behavior |
| `client/src/views/auth/LoginPage.jsx` | Create | Login form/page |
| `client/src/views/auth/RegisterPage.jsx` | Create | Registration page |
| `client/src/views/auth/ProtectedRoute.jsx` | Create | Auth/admin route guard |

## M2 — Rate limiting and abuse control (you)

| Path | Status | Feature |
|---|---|---|
| `server/src/config/redisClient.js` | Existing | Shared lazy Redis connection; fail closed when unavailable |
| `server/src/config/rateLimitConfig.js` | Existing | Token bucket capacities/refill rates |
| `server/src/middleware/tokenBucketRateLimit.js` | Existing | Atomic Redis Lua token bucket; 429/Retry-After and rate headers |
| `server/src/middleware/tenantContext.js` | Existing, shared with M5 | Validate tenant selector from header for per-tenant scope |
| `server/src/app.js` | Existing, M1 integration | Mount tenant context and global/tenant buckets on API; health excluded |
| `server/src/routes/authRoutes.js` | Existing, M1/M2 integration | Apply IP/account buckets before login validation; registration IP bucket |
| `server/src/routes/orderRoutes.js` | Existing, M2/M5 integration | Apply IP/user buckets to checkout routes |
| `server/.env.example` | Existing | Redis URL and trusted proxy hop configuration |
| `compose.yaml` | Existing | Local Redis service for development/demo |
| `docs/api/README.md` | Existing, M2 maintains limit policy | API paths, bucket scopes, fail-closed behavior and Retry-After |

## M3 — Storefront and public catalog

| Path | Status | Feature |
|---|---|---|
| `server/src/controllers/catalogController.js` | Create | Tenant-scoped product reads |
| `server/src/routes/catalogRoutes.js` | Create | Product list/detail/search routes; align Product with M4 |
| `server/src/models/Product.js` | Shared; M4 owns schema, M3 defines browse needs | Product/catalog and tenant fields |
| `client/src/models/catalogModel.js` | Create | Catalog data and API calls |
| `client/src/controllers/useCatalogController.js` | Create | Product loading, search, filtering, sorting |
| `client/src/views/storefront/StoreHomePage.jsx` | Create | Tenant-themed store home |
| `client/src/views/storefront/ProductListPage.jsx` | Create | Browse/search/filter page |
| `client/src/views/storefront/ProductDetailPage.jsx` | Create | Product details |
| `client/src/views/storefront/StoreHeader.jsx` | Create | Store navigation and branding |
| `client/src/views/storefront/ProductCard.jsx` | Create | Product card |

## M4 — Admin and product management

| Path | Status | Feature |
|---|---|---|
| `server/src/controllers/adminController.js` | Minimal version by M1 for access rules; extend | Dashboard summaries |
| `server/src/routes/adminRoutes.js` | Minimal version by M1 for access rules; extend | Protected admin endpoints; use M1 role middleware |
| `server/src/controllers/productController.js` | Create | Product create/read/update/archive |
| `server/src/routes/productRoutes.js` | Create | Protected product-management routes |
| `server/src/models/Product.js` | Create/own; align with M3 | Product, price, stock, image and tenant fields |
| `client/src/models/adminProductModel.js` | Create | Admin product state/API calls |
| `client/src/controllers/useAdminController.js` | Create | Dashboard and product actions |
| `client/src/views/admin/DashboardPage.jsx` | Create | Admin overview |
| `client/src/views/admin/ProductListPage.jsx` | Create | Product list/table |
| `client/src/views/admin/ProductEditorPage.jsx` | Create | Add/edit product form |
| `client/src/views/admin/InventoryPanel.jsx` | Create | Stock display/update UI |
| `client/src/views/admin/StoreSettingsPage.jsx` | Create | Edit branding/config |

## M5 — Cart, checkout, orders and payments

| Path | Status | Feature |
|---|---|---|
| `server/src/models/Cart.js` | Existing | Cart is keyed by authenticated user and tenant |
| `server/src/models/Order.js` | Existing | Order lines, totals, state and tenant/customer IDs |
| `server/src/models/Payment.js` | Existing | Demo payment attempt/provider state |
| `server/src/controllers/cartController.js` | Existing | Authenticated cart handlers |
| `server/src/routes/cartRoutes.js` | Existing | Protected cart endpoints |
| `server/src/controllers/orderController.js` | Existing | Authenticated checkout, owner-scoped history/detail |
| `server/src/routes/orderRoutes.js` | Existing | Protected checkout/order endpoints, checkout limits |
| `server/src/controllers/paymentController.js` | Existing | Order-owner payment handlers and webhook update |
| `server/src/routes/paymentRoutes.js` | Existing | Protected payment routes and signed webhook |
| `client/src/models/cartModel.js` | Existing | Cart state/API calls with bearer token header |
| `client/src/models/orderModel.js` | Existing | Order data/API calls with bearer token header |
| `client/src/controllers/useCartController.js` | Existing | Cart interactions |
| `client/src/controllers/useCheckoutController.js` | Existing | Checkout/payment submission |
| `client/src/views/cart/CartPage.jsx` | Existing | Cart items and totals |
| `client/src/views/cart/CheckoutPage.jsx` | Existing | Address and checkout flow |
| `client/src/views/orders/OrderHistoryPage.jsx` | Existing | Customer order list |
| `client/src/views/orders/OrderDetailPage.jsx` | Existing | Order status/details |

## Six-week sequence

1. Foundation, shared API contracts, health checks, MVC shell.
2. M1 auth and M2 Redis rate limiting; M5 tenant-scoped cart/order integration.
3. M3 storefront/catalog; M4 finalizes Product contract.
4. M4 admin/products; M1 authorization integration.
5. M5 cart, checkout, orders and payment demo.
6. Integrate modules, demo data, documentation and rehearsal.

Coordinate shared models before coding: tenant/store resolution (M2/M5), Product (M3/M4), inventory/order behavior (M4/M5). Server-side prices, stock, tenant scoping and permissions remain authoritative. The current cart branch still has a demo-price integration gap until M4's Product model is connected. Planned paths do not mean those features are already implemented.

# Member feature and file ownership

This is the six-week implementation map. Only the scaffold and three health endpoints exist today. Listed feature files marked `Create` are planned and must be added by the assigned member. API MVC: routes dispatch to controllers, controllers return JSON, models own application data. React uses models, controllers (hooks/actions), and views.

## Team

| Member | Role |
|---|---|
| M1 | Backend foundation, authentication and authorization |
| M2 (you) | Store customization and onboarding |
| M3 | Dynamic storefront and public catalog |
| M4 | Admin dashboard and product management |
| M5 | Cart, checkout, orders and payments |

## Shared scaffold

| Path | Owner | Feature/status |
|---|---|---|
| `package.json` | M1 + M2 | Existing workspace scripts |
| `client/index.html`, `client/vite.config.js`, `client/src/main.jsx` | M2 | Existing React/Vite shell |
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
| `server/src/models/User.js` | Create | User, password hash and roles |
| `server/src/controllers/authController.js` | Create | Register, login, logout/session actions |
| `server/src/routes/authRoutes.js` | Create | Authentication endpoints |
| `server/src/middleware/authMiddleware.js` | Create | Verify session/token and set user |
| `server/src/middleware/roleMiddleware.js` | Create | Admin/owner authorization |
| `server/src/middleware/errorHandler.js` | Create | Consistent API error responses |
| `server/src/middleware/validateRequest.js` | Create | Shared request validation adapter |
| `client/src/models/authModel.js` | Create | Client auth state and API calls |
| `client/src/controllers/useAuthController.js` | Create | Sign-in/sign-up behavior |
| `client/src/views/auth/LoginPage.jsx` | Create | Login form/page |
| `client/src/views/auth/RegisterPage.jsx` | Create | Registration page |
| `client/src/views/auth/ProtectedRoute.jsx` | Create | Auth/admin route guard |

## M2 — Store customization and onboarding (you)

| Path | Status | Feature |
|---|---|---|
| `server/src/models/Store.js` | Shared; M1 creates persistence base, M2 supplies configuration fields | Tenant, slug, brand, category, theme, selected options |
| `server/src/controllers/storeController.js` | Create | Create/read/update store configuration |
| `server/src/routes/storeRoutes.js` | Create | Store endpoints; coordinate auth/tenant checks with M1 |
| `client/src/models/storeModel.js` | Create | Store data shape and API calls |
| `client/src/controllers/useStoreSetupController.js` | Create | Multi-step state, validation and submit |
| `client/src/views/onboarding/StoreSetupPage.jsx` | Create | Wizard shell |
| `client/src/views/onboarding/BrandStep.jsx` | Create | Store name, logo, favicon, colors |
| `client/src/views/onboarding/CategoryStep.jsx` | Create | Category selection |
| `client/src/views/onboarding/ProductsStep.jsx` | Create | Initial product entry |
| `client/src/views/onboarding/DesignStep.jsx` | Create | Theme/layout selections; no free-text design prompt |
| `client/src/views/onboarding/FeaturesStep.jsx` | Create | Store capability selection |
| `client/src/views/onboarding/PlanStep.jsx` | Create | Demo plan selection |
| `client/src/views/onboarding/SetupReview.jsx` | Create | Review and submit config |

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
| `server/src/controllers/adminController.js` | Create | Dashboard summaries |
| `server/src/routes/adminRoutes.js` | Create | Protected admin endpoints; use M1 role middleware |
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
| `server/src/models/Cart.js` | Create | Cart per user/session and tenant |
| `server/src/models/Order.js` | Create | Order lines, totals, state and tenant/customer IDs |
| `server/src/models/Payment.js` | Create if separately persisted | Payment attempt/provider status |
| `server/src/controllers/cartController.js` | Create | Cart read/add/update/remove |
| `server/src/routes/cartRoutes.js` | Create | Cart endpoints |
| `server/src/controllers/orderController.js` | Create | Checkout, history and detail |
| `server/src/routes/orderRoutes.js` | Create | Checkout and order endpoints |
| `server/src/controllers/paymentController.js` | Create | Demo payment and verified callback handling |
| `server/src/routes/paymentRoutes.js` | Create | Payment/webhook endpoints |
| `client/src/models/cartModel.js` | Create | Cart state/API calls |
| `client/src/models/orderModel.js` | Create | Order data/API calls |
| `client/src/controllers/useCartController.js` | Create | Cart interactions |
| `client/src/controllers/useCheckoutController.js` | Create | Checkout/payment submission |
| `client/src/views/cart/CartPage.jsx` | Create | Cart items and totals |
| `client/src/views/cart/CheckoutPage.jsx` | Create | Address and checkout flow |
| `client/src/views/orders/OrderHistoryPage.jsx` | Create | Customer order list |
| `client/src/views/orders/OrderDetailPage.jsx` | Create | Order status/details |

## Six-week sequence

1. Foundation, shared API contracts, health checks, MVC shell.
2. M1 auth and M2 store setup.
3. M3 storefront/catalog; M4 finalizes Product contract.
4. M4 admin/products; M1 authorization integration.
5. M5 cart, checkout, orders and payment demo.
6. Integrate modules, demo data, documentation and rehearsal.

Coordinate shared models before coding: Store (M1/M2), Product (M3/M4), inventory/order behavior (M4/M5). Server-side prices, stock, tenant scoping and permissions remain authoritative. Planned paths do not mean those features are already implemented.

# Architecture

## Product flow

The React Store Studio collects structured store details, product content, a theme, selected storefront entry points, and a demo plan. It keeps a local draft, renders a live storefront preview, and requests a ZIP from `POST /api/store-builder/export`.

The ZIP contains the configured React storefront plus a source snapshot of the currently implemented Express modules. It does not create a production tenant or deploy a store. Its backend currently uses in-memory data. The export endpoint is a local demo tool mounted before the customer commerce rate-limiting middleware.

## Server

The Express app in `server/src/app.js` uses MVC: routes validate and dispatch, controllers handle request logic, models own persistence, and middleware provides authentication, tenant context, rate limiting and common errors. ES modules are used throughout.

Current exported modules include health, auth and roles, protected order basics, admin read routes, and Redis token-bucket rate limiting. Product CRUD/inventory concurrency, payment/idempotency, persistent database storage and tenant data isolation are not implemented in this checkout.

## Client

The frontend is a feature-based React application, not MVC. `src/app` composes the shell, `src/features/builder` contains the onboarding and preview workflow, and `src/shared` contains builder state and ZIP API access. The entry point is `src/main.jsx`; the builder is lazy-loaded.

## Plans and feature availability

Every exported backend currently contains the same implemented security foundation. The selected Free/Basic/Plus/Pro tier is configuration metadata only. Billing, quotas and backend feature gating should be connected only after those services exist.

# Models — Member 1 coordinates shared persistence conventions

MVC models own application data and persistence rules. Planned domain models:

- `User` — M1: identity, credentials, and roles.
- `Store` — M1/M2: tenant and configured store data.
- `Product` — M4, with M3: catalog and inventory data.
- `Order` — M5: checkout and order state.
- `healthModel.js` — M1: implemented process health state.

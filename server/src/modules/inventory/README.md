# Inventory module — stopping overselling

Everything for "100 people want the last item" lives in this folder.

## 1. What is overselling?

You have **1** phone in stock. Two customers click *Buy* in the same moment. Both get "success".
You now owe two phones but own one. That is overselling.

## 2. Why does it happen? (race condition)

The usual code does three steps:

```
1. read the product        -> stock = 1
2. check  stock >= 1 ?     -> yes
3. write  stock = 1 - 1    -> 0
```

With many requests at once, every request finishes step 1 **before** anyone reaches step 3.
All of them see `stock = 1`, all pass the check, all "succeed". Between *read* and *write* there is a gap,
and the requests squeeze through it. This is a **race condition**.

`naive/naiveController.js` is exactly this bug, on purpose.

## 3. How an atomic conditional update fixes it

Instead of reading first, we send MongoDB one command (see `reserveStock` in `inventoryService.js`):

```js
Product.findOneAndUpdate(
  { _id: productId, stock: { $gte: quantity } },   // only if enough stock
  { $inc: { stock: -quantity } }                    // MongoDB subtracts by itself
)
```

MongoDB runs this on one document as a single indivisible step. The check and the subtraction cannot be
separated, so only one request can take the last unit. Everyone else matches nothing and gets `null`,
which we turn into `409 INSUFFICIENT_STOCK`. Stock can never go below 0.

## 4. Reservations

Checkout takes time (payment page, OTP...). So when a customer starts checkout we **hold** the stock:

1. validate the request
2. atomically deduct stock (section 3)
3. create a `Reservation` (`status: reserved`, `expiresAt` = now + 10 minutes)

Steps 2 and 3 run in **one MongoDB transaction**: if creating the reservation fails, the stock deduction is
undone automatically. Statuses: `reserved` -> `confirmed` (paid) or `reserved` -> `expired` (time ran out).

**Confirm** (`confirmReservation`) flips `reserved -> confirmed` with one conditional update that also checks
"not expired" and "belongs to this customer/tenant". It never touches stock (already deducted).
An expired, already-confirmed, or someone else's reservation is refused.

## 5. Expiry and the sweeper

`reservationSweeper.js` runs on a schedule (default every minute, set `SWEEPER_CRON`). It finds reservations
that are still `reserved` but past `expiresAt`, and for each one, **in one transaction**:

1. flip `reserved -> expired` (conditional update — only one worker can win this)
2. add the quantity back to the product's stock

Only the worker that wins step 1 reaches step 2, so stock is restored **exactly once**, even if two sweepers
run at the same time or the job runs twice. Confirm and expire both need `status = reserved`, so for one
reservation only one of them can ever succeed. Errors inside a sweep are logged, never thrown, so the server
keeps running.

## 6. MongoDB replica set requirement (important)

Transactions **do not work on a standalone MongoDB**. You need a replica set. A single-node one is enough.
If MongoDB is standalone, the server prints a warning at startup and reserve returns `503 TRANSACTIONS_UNAVAILABLE`
(nothing is deducted).

**Option A — MongoDB Atlas:** works out of the box (it is always a replica set). Use its connection string.

**Option B — local mongod:**
```bash
mkdir -p ~/mongo-rs-data
mongod --replSet rs0 --dbpath ~/mongo-rs-data --port 27017
# in a second terminal, once:
mongosh --eval "rs.initiate({_id:'rs0', members:[{_id:0, host:'127.0.0.1:27017'}]})"
```
On Windows, run `mongod` the same way with a `--dbpath` folder that exists. If `mongod` is installed as a
service, add `replication: replSetName: rs0` to `mongod.cfg`, restart the service, then run `rs.initiate(...)`.

**Option C — Docker:**
```bash
docker run -d --name mongo-rs -p 27017:27017 mongo:7 --replSet rs0 --bind_ip_all
docker exec mongo-rs mongosh --eval "rs.initiate({_id:'rs0', members:[{_id:0, host:'localhost:27017'}]})"
```

## 7. Setup

From the project root:
```bash
npm install                      # installs mongoose, node-cron, axios (workspace install)
cp server/.env.example server/.env
# edit server/.env: set MONGODB_URI (must point to a replica set)
npm run dev:server
```
Environment variables (all in `server/.env.example`): `MONGODB_URI`, `RESERVATION_TTL_MINUTES`,
`SWEEPER_CRON`, `SWEEPER_ENABLED`, `NAIVE_DELAY_MS`.

New dependencies: `mongoose`, `node-cron` (runtime), `axios` (dev, attack script only).

## 8. API

Success: `{ "success": true, "data": {...} }`  Error: `{ "success": false, "code": "...", "message": "..." }`

| Method & path | Purpose | Success | Errors |
|---|---|---|---|
| `GET /api/inventory/:productId` | current stock | 200 | 400, 404 |
| `POST /api/inventory/:productId/reserve` body `{"quantity":1}` | hold stock | 201 | 400 bad id/quantity, 404, 409 `INSUFFICIENT_STOCK`, 503 |
| `POST /api/inventory/reservations/:id/confirm` | confirm after payment | 200 | 400, 404, 409 `ALREADY_CONFIRMED` / `RESERVATION_EXPIRED` |
| `POST /api/naive/purchase/:productId` body `{"quantity":1}` | **intentionally unsafe demo** | 200 | 400, 404, 409 |

```bash
curl -X POST http://localhost:5000/api/inventory/<productId>/reserve \
  -H "Content-Type: application/json" -H "x-customer-id: <24-hex-id>" -d '{"quantity":1}'
```
Example response:
```json
{"success":true,"data":{"reservationId":"...","productId":"...","quantity":1,
 "status":"reserved","expiresAt":"2026-11-13T09:52:41.416Z","remainingStock":0}}
```

**The naive endpoint is not mounted when `NODE_ENV=production`** (and refuses with 403 even if it were).

## 9. Tests and the attack script

```bash
cd server
npm test        # 21 tests, needs a replica set (default mongodb://127.0.0.1:27017/commerceforge_test?replicaSet=rs0)
```
Set `TEST_MONGODB_URI` to use another URL. The database name **must end with `_test`** because the tests
drop the database.

```bash
# terminal 1: server running (npm run dev:server)
# terminal 2:
cd server && npm run attack
```
The attack script creates two products with stock 1, sends 100 parallel requests to each endpoint
(`axios` + `Promise.allSettled`), then reads the final stock from MongoDB and deletes its test data.

Expected output for the hardened endpoint (this is what I got in 4 of 4 runs):
```
Successful purchases: 1
Failed purchases:     99 (out of stock: 99, other errors: 0)
Final stock (from MongoDB): 0
Reservations in MongoDB:    1
RESULT: PASS - no overselling.
```
The naive endpoint is timing-dependent. In my runs it sold the single unit 98, 62, 2 and 63 times (final stock
showed 0 every time — it hides the problem). The exact number differs each run; if it ever shows 1, run again
or set `NAIVE_DELAY_MS=20` on the server.

## 10. Integration notes for teammates

- **Product model:** `server/src/models/Product.js` is a *placeholder*. Keep Member 4's real schema, as long
  as it has `stock` (Number, whole units) and `tenantId` (ObjectId). Nothing else is used.
- **Customer / tenant id:** `getRequestContext()` in `inventoryController.js` reads `req.user.id` and
  `req.tenantId`. Outside production it also accepts `x-customer-id` / `x-tenant-id` headers for testing;
  in production it returns 401 when `req.user` is missing. Change only that one function if the convention differs.
- **Payments (Member 3/5):** after a verified payment call `confirmReservation({ reservationId, customerId, tenantId })`
  from `inventoryService.js`. Calling it twice is safe (second call -> 409).
- **Error format:** this module returns `{ success:false, code, message }`. If the shared `errorHandler.js` uses
  another shape, adapt `sendError()` in the controller.
- **Order creation:** this module does not create orders; the order code should use the reservation.

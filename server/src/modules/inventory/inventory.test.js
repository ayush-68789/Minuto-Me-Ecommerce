// Tests for the inventory module. They use a REAL MongoDB replica set (no mocks for the
// database), because the whole point is to prove atomic updates and transactions work.
//
// Run:  npm run test --workspace=server        (from the project root)
//   or: cd server && npm test
//
// Needs a replica set. Default URL below; override with TEST_MONGODB_URI.
// SAFETY: the database name must end with "_test" because this file DROPS the database.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Reservation from '../../models/Reservation.js';
import app from '../../app.js';
import {
  getStock,
  reserveStock,
  confirmReservation,
  expireReservation,
  expireDueReservations,
} from './inventoryService.js';
import { runSweeperOnce } from './reservationSweeper.js';

const TEST_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/commerceforge_test?replicaSet=rs0';

// ---- helpers ---------------------------------------------------------------
const newId = () => String(new mongoose.Types.ObjectId());
const makeProduct = (stock, extra = {}) => Product.create({ name: 'Test product', price: 100, stock, ...extra });
const stockOf = async (product) => (await Product.findById(product._id).lean()).stock;
const minutesFromNow = (m) => new Date(Date.now() + m * 60 * 1000);

let server;
let baseUrl;

before(async () => {
  const dbName = new URL(TEST_URI).pathname.replace('/', '');
  assert.ok(dbName.endsWith('_test'), `Refusing to run: database name "${dbName}" must end with _test`);

  await mongoose.connect(TEST_URI);
  const info = await mongoose.connection.db.admin().command({ hello: 1 });
  assert.ok(info.setName, 'MongoDB must run as a replica set (transactions). See README.md.');

  await mongoose.connection.dropDatabase();
  // Build collections + indexes up front so transactions never race with index creation.
  await Product.init();
  await Reservation.init();

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

// ---- Feature 1: atomic conditional update ----------------------------------
describe('reserveStock - basic rules', () => {
  test('1. buying 1 item when stock is 5 succeeds and stock becomes 4', async () => {
    const product = await makeProduct(5);
    const { reservation, remainingStock } = await reserveStock({ productId: String(product._id), quantity: 1 });

    assert.equal(remainingStock, 4);
    assert.equal(await stockOf(product), 4);
    assert.equal(reservation.status, 'reserved');
    assert.equal(reservation.quantity, 1);
  });

  test('2. buying more than available is rejected and stock is unchanged', async () => {
    const product = await makeProduct(3);
    await assert.rejects(reserveStock({ productId: String(product._id), quantity: 4 }), {
      statusCode: 409,
      code: 'INSUFFICIENT_STOCK',
    });
    assert.equal(await stockOf(product), 3);
    assert.equal(await Reservation.countDocuments({ productId: product._id }), 0);
  });

  test('3. buying when stock is 0 is rejected', async () => {
    const product = await makeProduct(0);
    await assert.rejects(reserveStock({ productId: String(product._id), quantity: 1 }), {
      code: 'INSUFFICIENT_STOCK',
    });
    assert.equal(await stockOf(product), 0);
  });

  test('4. zero, negative, decimal and text quantities are rejected', async () => {
    const product = await makeProduct(5);
    for (const badQuantity of [-1, 0, 1.5, '1', NaN, Infinity]) {
      await assert.rejects(
        reserveStock({ productId: String(product._id), quantity: badQuantity }),
        { statusCode: 400, code: 'INVALID_QUANTITY' },
        `quantity ${String(badQuantity)} should be rejected`
      );
    }
    assert.equal(await stockOf(product), 5);
  });

  test('5. missing quantity is rejected', async () => {
    const product = await makeProduct(5);
    await assert.rejects(reserveStock({ productId: String(product._id) }), {
      statusCode: 400,
      code: 'INVALID_QUANTITY',
    });
    assert.equal(await stockOf(product), 5);
  });

  test('invalid product id is rejected, unknown product gives 404', async () => {
    await assert.rejects(reserveStock({ productId: 'not-an-id', quantity: 1 }), { statusCode: 400, code: 'INVALID_ID' });
    await assert.rejects(reserveStock({ productId: newId(), quantity: 1 }), { statusCode: 404, code: 'PRODUCT_NOT_FOUND' });
  });

  test('tenant scoping: a product of another tenant cannot be reserved', async () => {
    const tenantA = newId();
    const product = await makeProduct(5, { tenantId: tenantA });
    await assert.rejects(reserveStock({ productId: String(product._id), quantity: 1, tenantId: newId() }), {
      code: 'PRODUCT_NOT_FOUND',
    });
    await reserveStock({ productId: String(product._id), quantity: 1, tenantId: tenantA });
    assert.equal(await stockOf(product), 4);
  });

  test('getStock returns the current stock', async () => {
    const product = await makeProduct(7);
    const result = await getStock({ productId: String(product._id) });
    assert.equal(result.stock, 7);
  });
});

// ---- The main concurrency proof (service level) -----------------------------
describe('concurrency', () => {
  test('6. 100 buyers for 1 unit: exactly 1 succeeds, 99 rejected, stock is 0', async () => {
    const product = await makeProduct(1);
    const results = await Promise.allSettled(
      Array.from({ length: 100 }, () => reserveStock({ productId: String(product._id), quantity: 1, customerId: newId() }))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.equal(succeeded.length, 1);
    assert.equal(rejected.length, 99);
    // every rejection must be the "not enough stock" kind, not some random crash
    assert.ok(rejected.every((r) => r.reason.code === 'INSUFFICIENT_STOCK'));

    // verify the DATABASE, not just the counts
    assert.equal(await stockOf(product), 0);
    assert.equal(await Reservation.countDocuments({ productId: product._id, status: 'reserved' }), 1);
  });

  test('20 buyers x 1 unit each for stock 10: exactly 10 succeed', async () => {
    const product = await makeProduct(10);
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => reserveStock({ productId: String(product._id), quantity: 1 }))
    );
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 10);
    assert.equal(await stockOf(product), 0);
  });
});

// ---- Transaction rollback ---------------------------------------------------
describe('transactions', () => {
  test('10. if creating the reservation fails, the stock deduction is rolled back', async () => {
    const product = await makeProduct(5);

    // Force the 2nd step (create reservation) to fail, AFTER the stock was already deducted.
    const originalCreate = Reservation.create;
    Reservation.create = async () => {
      throw new Error('simulated failure while creating reservation');
    };
    try {
      await assert.rejects(reserveStock({ productId: String(product._id), quantity: 2 }), /simulated failure/);
    } finally {
      Reservation.create = originalCreate; // always put the real function back
    }

    assert.equal(await stockOf(product), 5, 'stock must be back to 5');
    assert.equal(await Reservation.countDocuments({ productId: product._id }), 0);
  });
});

// ---- Expiry, confirm, sweeper ----------------------------------------------
describe('reservation life cycle', () => {
  test('7. an expired reservation gives its stock back', async () => {
    const product = await makeProduct(5);
    const { reservation } = await reserveStock({ productId: String(product._id), quantity: 2 });
    assert.equal(await stockOf(product), 3);

    // Not due yet -> nothing happens.
    assert.equal((await expireReservation(String(reservation._id))).expired, false);
    assert.equal(await stockOf(product), 3);

    // Move the clock past expiresAt.
    const result = await expireReservation(String(reservation._id), minutesFromNow(11));
    assert.equal(result.expired, true);
    assert.equal(await stockOf(product), 5);
    assert.equal((await Reservation.findById(reservation._id)).status, 'expired');
  });

  test('8. a confirmed reservation keeps the stock deducted (even if the sweeper runs later)', async () => {
    const product = await makeProduct(5);
    const customerId = newId();
    const { reservation } = await reserveStock({ productId: String(product._id), quantity: 2, customerId });

    const confirmed = await confirmReservation({ reservationId: String(reservation._id), customerId });
    assert.equal(confirmed.status, 'confirmed');
    assert.equal(await stockOf(product), 3, 'confirm must not restore stock');

    // A sweeper pass far in the future must ignore confirmed reservations.
    // (It may expire OTHER tests' leftover reservations, so we only check OUR reservation.)
    await expireDueReservations({ now: minutesFromNow(60) });
    assert.equal((await Reservation.findById(reservation._id)).status, 'confirmed');
    assert.equal(await stockOf(product), 3);
  });

  test('9. running the sweeper twice (or at the same time) restores stock only once', async () => {
    const product = await makeProduct(5);
    await reserveStock({ productId: String(product._id), quantity: 2 });
    await reserveStock({ productId: String(product._id), quantity: 1 });
    assert.equal(await stockOf(product), 2);

    const later = minutesFromNow(11);
    // two sweepers at the same instant...
    const [a, b] = await Promise.all([expireDueReservations({ now: later }), expireDueReservations({ now: later })]);
    // ...and a third one afterwards
    const c = await expireDueReservations({ now: later });

    assert.equal(a.expired + b.expired + c.expired, 2, 'each reservation expires exactly once');
    assert.equal(a.failed + b.failed + c.failed, 0);
    assert.equal(await stockOf(product), 5, 'stock restored once, not twice');
  });

  test('sweeper job: runSweeperOnce expires reservations whose time has really passed', async () => {
    const product = await makeProduct(4);
    const { reservation } = await reserveStock({ productId: String(product._id), quantity: 3 });
    // make it overdue by editing the stored time (simulates 10 minutes passing)
    await Reservation.updateOne({ _id: reservation._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    const first = await runSweeperOnce();
    const second = await runSweeperOnce();
    assert.equal(first.expired, 1);
    assert.equal(second.expired, 0);
    assert.equal(await stockOf(product), 4);
  });

  test('11. confirm and expire racing on the same reservation: exactly one wins', async () => {
    for (let round = 1; round <= 25; round += 1) {
      const product = await makeProduct(5);
      const customerId = newId();
      const { reservation } = await reserveStock({ productId: String(product._id), quantity: 2, customerId });
      const reservationId = String(reservation._id);

      // Both operations are allowed to run: confirm sees a not-yet-expired reservation,
      // expire uses a clock that is 11 minutes ahead. Only the status check can decide.
      const [confirmResult, expireResult] = await Promise.allSettled([
        confirmReservation({ reservationId, customerId }),
        expireReservation(reservationId, minutesFromNow(11)),
      ]);

      const confirmWon = confirmResult.status === 'fulfilled';
      const expireWon = expireResult.status === 'fulfilled' && expireResult.value.expired === true;
      assert.equal(confirmWon !== expireWon, true, `round ${round}: exactly one must win`);

      const finalReservation = await Reservation.findById(reservationId);
      if (confirmWon) {
        assert.equal(finalReservation.status, 'confirmed');
        assert.equal(await stockOf(product), 3, 'confirmed -> stock stays deducted');
      } else {
        assert.equal(finalReservation.status, 'expired');
        assert.equal(await stockOf(product), 5, 'expired -> stock restored once');
      }
    }
  });
});

describe('confirmReservation - rules', () => {
  test('wrong customer or wrong tenant cannot confirm (404)', async () => {
    const customerId = newId();
    const tenantId = newId();
    const product = await makeProduct(5, { tenantId });
    const { reservation } = await reserveStock({ productId: String(product._id), quantity: 1, customerId, tenantId });
    const reservationId = String(reservation._id);

    await assert.rejects(confirmReservation({ reservationId, customerId: newId(), tenantId }), { statusCode: 404 });
    await assert.rejects(confirmReservation({ reservationId, customerId, tenantId: newId() }), { statusCode: 404 });
    assert.equal((await confirmReservation({ reservationId, customerId, tenantId })).status, 'confirmed');
  });

  test('cannot confirm twice, cannot confirm an expired reservation, unknown id is 404', async () => {
    const product = await makeProduct(5);
    const first = await reserveStock({ productId: String(product._id), quantity: 1 });
    const second = await reserveStock({ productId: String(product._id), quantity: 1 });

    await confirmReservation({ reservationId: String(first.reservation._id) });
    await assert.rejects(confirmReservation({ reservationId: String(first.reservation._id) }), {
      statusCode: 409,
      code: 'ALREADY_CONFIRMED',
    });

    await Reservation.updateOne({ _id: second.reservation._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    // still "reserved" in the database, but the time has passed -> must be refused
    await assert.rejects(confirmReservation({ reservationId: String(second.reservation._id) }), {
      statusCode: 409,
      code: 'RESERVATION_EXPIRED',
    });

    await assert.rejects(confirmReservation({ reservationId: newId() }), { statusCode: 404 });
    await assert.rejects(confirmReservation({ reservationId: 'bad' }), { statusCode: 400 });
  });
});

// ---- HTTP layer -------------------------------------------------------------
describe('HTTP API', () => {
  const post = (path, body, headers = {}) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  test('GET stock, POST reserve (201), POST confirm (200)', async () => {
    const product = await makeProduct(3);
    const customer = { 'x-customer-id': newId() };

    const stockRes = await fetch(`${baseUrl}/api/inventory/${product._id}`);
    assert.equal(stockRes.status, 200);
    assert.equal((await stockRes.json()).data.stock, 3);

    const reserveRes = await post(`/api/inventory/${product._id}/reserve`, { quantity: 1 }, customer);
    assert.equal(reserveRes.status, 201);
    const reserved = (await reserveRes.json()).data;
    assert.equal(reserved.remainingStock, 2);
    assert.equal(reserved.status, 'reserved');

    const confirmRes = await post(`/api/inventory/reservations/${reserved.reservationId}/confirm`, undefined, customer);
    assert.equal(confirmRes.status, 200);
    assert.equal((await confirmRes.json()).data.status, 'confirmed');
  });

  test('bad input gives 400 and out of stock gives 409, with clean JSON errors', async () => {
    const product = await makeProduct(1);
    const missing = await post(`/api/inventory/${product._id}/reserve`, {});
    assert.equal(missing.status, 400);
    assert.deepEqual(Object.keys(await missing.json()).sort(), ['code', 'message', 'success']);

    const negative = await post(`/api/inventory/${product._id}/reserve`, { quantity: -3 });
    assert.equal(negative.status, 400);

    const tooMany = await post(`/api/inventory/${product._id}/reserve`, { quantity: 5 });
    assert.equal(tooMany.status, 409);

    const badId = await post('/api/inventory/xyz/reserve', { quantity: 1 });
    assert.equal(badId.status, 400);
  });

  test('naive endpoint works (it is a demo) and is clearly labelled', async () => {
    const product = await makeProduct(2);
    const res = await post(`/api/naive/purchase/${product._id}`, { quantity: 1 });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-intentionally-vulnerable'), 'true');
    assert.equal(await stockOf(product), 1);
  });
});

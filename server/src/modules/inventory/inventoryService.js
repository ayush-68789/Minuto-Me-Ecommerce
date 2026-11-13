// Inventory business logic: reserve stock, confirm a reservation, expire a reservation.
//
// THE BIG IDEA (read this first)
// ------------------------------
// "Overselling" happens when two buyers both read "1 left" and both buy it.
// We never read-then-write the stock. Instead we send MongoDB ONE command:
//
//     "If stock is at least N, subtract N. Otherwise do nothing."
//
// MongoDB runs that single command on one document as one indivisible step, so
// two buyers can never both pass the check for the same last unit.
import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Reservation, { RESERVATION_STATUS } from '../../models/Reservation.js';
import { InventoryError } from './inventoryErrors.js';
import { validateObjectId, validateQuantity } from './inventoryValidation.js';

// How long a customer can hold stock while checking out (default 10 minutes).
function getReservationTtlMs() {
  const minutes = Number(process.env.RESERVATION_TTL_MINUTES) || 10;
  return minutes * 60 * 1000;
}

// Runs `work(session)` inside a REAL MongoDB transaction.
// If `work` throws, everything it wrote is rolled back.
// Requires a replica set (or Atlas). See README.md.
async function runInTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    // withTransaction retries automatically on temporary conflicts (e.g. two
    // requests touching the same product at the same moment).
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

// Builds the "which product?" filter. If a tenant is known, the product MUST belong to it.
function productFilter(productId, tenantId) {
  const filter = { _id: productId };
  if (tenantId) filter.tenantId = tenantId;
  return filter;
}

function validateTenantId(tenantId) {
  if (tenantId && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(String(tenantId))) {
    throw new InventoryError(400, 'INVALID_ID', 'tenantId is not valid.');
  }
  return tenantId;
}

// ---------------------------------------------------------------------------
// Read stock (plain read, only for display - never used to decide a purchase)
// ---------------------------------------------------------------------------
export async function getStock({ productId, tenantId }) {
  validateObjectId(productId, 'productId');
  validateTenantId(tenantId);

  const product = await Product.findOne(productFilter(productId, tenantId)).select('name stock').lean();
  if (!product) {
    throw new InventoryError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  }
  return { productId: String(product._id), name: product.name, stock: product.stock };
}

// ---------------------------------------------------------------------------
// Feature 1 + 2: atomic stock deduction + reservation, in ONE transaction
// ---------------------------------------------------------------------------
export async function reserveStock({ productId, quantity, customerId, tenantId }) {
  // 1. Validate everything before touching the database.
  validateObjectId(productId, 'productId');
  validateQuantity(quantity);
  validateTenantId(tenantId);

  const expiresAt = new Date(Date.now() + getReservationTtlMs());

  return runInTransaction(async (session) => {
    // 2. THE ATOMIC STEP.
    //    Filter  : this product AND stock >= quantity
    //    Update  : $inc by -quantity (MongoDB does the subtraction itself)
    //    If the filter does not match (not enough stock) nothing changes and we get null.
    //    So stock can never go below zero, and the last unit can only be won once.
    const filter = { ...productFilter(productId, tenantId), stock: { $gte: quantity } };
    const updatedProduct = await Product.findOneAndUpdate(
      filter,
      { $inc: { stock: -quantity } },
      { new: true, session } // new:true -> give back the product AFTER the update
    );

    if (!updatedProduct) {
      // Nothing was deducted. Look up the product ONLY to choose a helpful error message.
      const product = await Product.findOne(productFilter(productId, tenantId)).session(session).lean();
      if (!product) {
        throw new InventoryError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
      }
      throw new InventoryError(409, 'INSUFFICIENT_STOCK', 'Not enough stock available.');
    }

    // 3. Create the reservation in the SAME transaction.
    //    If this line throws, MongoDB also undoes the stock deduction above.
    const [reservation] = await Reservation.create(
      [
        {
          productId,
          customerId,
          tenantId,
          quantity,
          status: RESERVATION_STATUS.RESERVED,
          expiresAt,
        },
      ],
      { session }
    );

    return { reservation, remainingStock: updatedProduct.stock };
  });
}

// ---------------------------------------------------------------------------
// Feature 3: confirm a reservation (call this after checkout/payment succeeds)
// ---------------------------------------------------------------------------
// INTERFACE FOR MEMBER 3 (payments): after a payment is verified, call
//     confirmReservation({ reservationId, customerId, tenantId })
// It is safe to call twice - the second call is rejected with 409 and does nothing.
export async function confirmReservation({ reservationId, customerId, tenantId }) {
  validateObjectId(reservationId, 'reservationId');
  validateTenantId(tenantId);

  const now = new Date();

  // ONE atomic command: "if it is still reserved AND not expired AND it is mine,
  // mark it confirmed". The sweeper uses the opposite condition, and both need
  // status = 'reserved', so only one of them can ever win.
  // NOTE: we do NOT touch stock here. It was already deducted at reserve time.
  const filter = {
    _id: reservationId,
    status: RESERVATION_STATUS.RESERVED,
    expiresAt: { $gt: now },
  };
  if (customerId) filter.customerId = customerId;
  if (tenantId) filter.tenantId = tenantId;

  const confirmed = await Reservation.findOneAndUpdate(
    filter,
    { $set: { status: RESERVATION_STATUS.CONFIRMED, confirmedAt: now } },
    { new: true }
  );
  if (confirmed) {
    return confirmed;
  }

  // It did not match. Work out WHY so the client gets a useful answer.
  const ownerFilter = { _id: reservationId };
  if (customerId) ownerFilter.customerId = customerId;
  if (tenantId) ownerFilter.tenantId = tenantId;
  const existing = await Reservation.findOne(ownerFilter).lean();

  // "Not yours" and "does not exist" look the same on purpose (do not leak ids).
  if (!existing) {
    throw new InventoryError(404, 'RESERVATION_NOT_FOUND', 'Reservation not found.');
  }
  if (existing.status === RESERVATION_STATUS.CONFIRMED) {
    throw new InventoryError(409, 'ALREADY_CONFIRMED', 'Reservation is already confirmed.');
  }
  // status expired, OR still "reserved" but the time has passed (sweeper has not run yet)
  throw new InventoryError(409, 'RESERVATION_EXPIRED', 'Reservation has expired.');
}

// Confirm every stock hold for one checkout atomically. Payment capture must not
// confirm only part of a multi-product order.
export async function confirmReservations({ reservationIds, customerId, tenantId }) {
  const ids = [...new Set(reservationIds || [])];
  if (!ids.length) return [];
  for (const id of ids) validateObjectId(id, 'reservationId');
  validateTenantId(tenantId);
  const now = new Date();
  return runInTransaction(async (session) => {
    const confirmed = [];
    for (const reservationId of ids) {
      const filter = { _id: reservationId, status: RESERVATION_STATUS.RESERVED, expiresAt: { $gt: now } };
      if (customerId) filter.customerId = customerId;
      if (tenantId) filter.tenantId = tenantId;
      const reservation = await Reservation.findOneAndUpdate(
        filter,
        { $set: { status: RESERVATION_STATUS.CONFIRMED, confirmedAt: now } },
        { new: true, session },
      );
      if (!reservation) throw new InventoryError(409, 'RESERVATION_UNAVAILABLE', 'One or more stock reservations have expired or changed state.');
      confirmed.push(reservation);
    }
    return confirmed;
  });
}

// Release a set of holds after a failed payment. The conditional state change
// and stock restoration share one transaction so duplicate events cannot restock twice.
export async function releaseReservations({ reservationIds, customerId, tenantId }) {
  const ids = [...new Set(reservationIds || [])];
  if (!ids.length) return [];
  for (const id of ids) validateObjectId(id, 'reservationId');
  validateTenantId(tenantId);
  const now = new Date();
  return runInTransaction(async (session) => {
    const released = [];
    for (const reservationId of ids) {
      const filter = { _id: reservationId, status: RESERVATION_STATUS.RESERVED };
      if (customerId) filter.customerId = customerId;
      if (tenantId) filter.tenantId = tenantId;
      const reservation = await Reservation.findOneAndUpdate(
        filter,
        { $set: { status: RESERVATION_STATUS.EXPIRED, expiredAt: now } },
        { new: true, session },
      );
      if (!reservation) {
        const existing = await Reservation.findById(reservationId).session(session).lean();
        if (existing?.status === RESERVATION_STATUS.EXPIRED) continue;
        throw new InventoryError(409, 'RESERVATION_UNAVAILABLE', 'A confirmed or unavailable reservation cannot be released.');
      }
      const restored = await Product.updateOne(
        productFilter(reservation.productId, tenantId),
        { $inc: { stock: reservation.quantity } },
        { session },
      );
      if (restored.matchedCount !== 1) throw new Error(`Could not restore stock for reservation ${reservationId}`);
      released.push(reservation);
    }
    return released;
  });
}

// ---------------------------------------------------------------------------
// Feature 4 (helper): expire ONE reservation and give its stock back - exactly once
// ---------------------------------------------------------------------------
// `now` is a parameter so tests can "move the clock forward".
export async function expireReservation(reservationId, now = new Date()) {
  validateObjectId(reservationId, 'reservationId');

  return runInTransaction(async (session) => {
    // Step 1: claim the reservation with a conditional status change.
    // Only a reservation that is STILL 'reserved' and already past expiresAt matches.
    // If another sweeper (or a confirm) got there first, this returns null.
    const claimed = await Reservation.findOneAndUpdate(
      {
        _id: reservationId,
        status: RESERVATION_STATUS.RESERVED,
        expiresAt: { $lte: now },
      },
      { $set: { status: RESERVATION_STATUS.EXPIRED, expiredAt: now } },
      { new: true, session }
    );

    if (!claimed) {
      return { expired: false };
    }

    // Step 2: give the stock back. Same transaction as step 1, so either BOTH
    // happen or NEITHER does. Only the winner of step 1 ever reaches this line,
    // which is why stock is restored exactly once.
    // Restore stock only for the same tenant (when tenant scoping is enabled).
    const productRestoreFilter = { _id: claimed.productId };
    if (claimed.tenantId) productRestoreFilter.tenantId = claimed.tenantId;

    const restoreResult = await Product.updateOne(
      productRestoreFilter,
      { $inc: { stock: claimed.quantity } },
      { session }
    );

    // If the product is missing (or belongs to another tenant), throw so the
    // transaction rolls back the reservation status change as well.
    if (restoreResult.matchedCount !== 1) {
      throw new Error(`Could not restore stock for reservation ${reservationId}: product not found`);
    }

    return { expired: true, reservation: claimed };
  });
}

// Expires every reservation that is due. Returns counts so the sweeper can log them.
export async function expireDueReservations({ now = new Date(), batchSize = 100 } = {}) {
  // Plain read just to find candidates. The REAL safety is the conditional
  // update inside expireReservation(), so a stale list here is harmless.
  const due = await Reservation.find({
    status: RESERVATION_STATUS.RESERVED,
    expiresAt: { $lte: now },
  })
    .select('_id')
    .limit(batchSize)
    .lean();

  let expired = 0;
  let failed = 0;
  for (const { _id } of due) {
    try {
      const result = await expireReservation(String(_id), now);
      if (result.expired) expired += 1;
    } catch (error) {
      // One bad reservation must not stop the others. Log it and move on.
      failed += 1;
      console.error(`[sweeper] could not expire reservation ${_id}:`, error);
    }
  }
  return { found: due.length, expired, failed };
}

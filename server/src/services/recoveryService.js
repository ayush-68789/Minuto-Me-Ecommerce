import Product from '../models/Product.js';
import Order from '../models/Order.js';
import InventoryReservation from '../models/InventoryReservation.js';
import Idempotency from '../models/Idempotency.js';

/**
 * Safely compensates an individual reservation per-line.
 * Guarantees that only lines that were actually deducted and not yet restocked
 * will have their inventory restored, preventing double-restocking.
 */
export async function compensateReservation(reservation) {
  let allRestocked = true;
  let hasDeductions = false;

  for (let i = 0; i < reservation.lines.length; i++) {
    const line = reservation.lines[i];

    if (line.isDeducted && !line.isRestocked) {
      hasDeductions = true;
      try {
        const product = await Product.findOne({ _id: line.product, store: reservation.store });

        if (!product) {
          // Product was permanently removed from database; mark line restocked to avoid infinite loop
          await InventoryReservation.updateOne(
            { _id: reservation._id, 'lines.product': line.product },
            { $set: { 'lines.$.isRestocked': true, 'lines.$.restockedQuantity': 0 } }
          );
          continue;
        }

        const updateRes = await Product.updateOne(
          { _id: line.product, store: reservation.store },
          { $inc: { stock: line.deductedQuantity } }
        );

        if (updateRes.modifiedCount === 1) {
          await InventoryReservation.updateOne(
            { _id: reservation._id, 'lines.product': line.product },
            {
              $set: {
                'lines.$.isRestocked': true,
                'lines.$.restockedQuantity': line.deductedQuantity,
              },
            }
          );
        } else {
          allRestocked = false;
        }
      } catch (err) {
        allRestocked = false;
        console.error(`[CompensateLine] Error restocking product ${line.product}:`, err.message);
      }
    }
  }

  const finalStatus = allRestocked ? 'compensated' : 'failed_compensation';
  await InventoryReservation.updateOne(
    { _id: reservation._id },
    {
      $set: {
        status: finalStatus,
        failureReason: allRestocked ? '' : 'Some items could not be restocked during compensation',
        lockedUntil: new Date(),
      },
    }
  );

  return { status: finalStatus, hasDeductions, allRestocked };
}

/**
 * Background recovery worker for reservations that were abandoned, crashed,
 * or failed compensation.
 */
export async function recoverStaleReservations(staleThresholdMs = 60 * 1000) {
  const cutoff = new Date(Date.now() - staleThresholdMs);

  const staleReservations = await InventoryReservation.find({
    status: { $in: ['pending', 'reserved', 'compensating', 'failed_compensation'] },
    lockedUntil: { $lte: new Date() },
    updatedAt: { $lt: cutoff },
  }).limit(50);

  let recoveredCount = 0;

  for (const rawRes of staleReservations) {
    // Atomically claim the lease on this reservation
    const reservation = await InventoryReservation.findOneAndUpdate(
      {
        _id: rawRes._id,
        lockedUntil: { $lte: new Date() },
      },
      {
        $set: { lockedUntil: new Date(Date.now() + 60000) },
        $inc: { retryCount: 1 },
      },
      { new: true }
    );

    if (!reservation) continue; // Claimed by another worker

    try {
      const activeCheckout = reservation.idempotencyKey && await Idempotency.findOne({
        store: reservation.store,
        key: reservation.idempotencyKey,
        status: 'in_progress',
        lockedUntil: { $gt: new Date() },
      });
      if (activeCheckout) {
        await InventoryReservation.updateOne(
          { _id: reservation._id, lockedUntil: reservation.lockedUntil },
          { $set: { lockedUntil: new Date(Date.now() + 60000) } }
        );
        continue;
      }

      // Check if an order was actually created for this reservation
      const order = await Order.findOne({
        store: reservation.store,
        $or: [
          ...(reservation.order ? [{ _id: reservation.order }] : []),
          { 'metadata.reservationId': reservation._id },
          ...(reservation.idempotencyKey ? [{ 'metadata.idempotencyKey': reservation.idempotencyKey }] : []),
        ],
      });

      if (order && order.status !== 'cancelled') {
        // Order exists and is active! Complete reservation without restocking
        await InventoryReservation.updateOne(
          { _id: reservation._id },
          { $set: { status: 'completed', order: order._id, lockedUntil: new Date() } }
        );
        recoveredCount++;
      } else {
        // No active order exists; compensate deducted stock safely
        await InventoryReservation.updateOne(
          { _id: reservation._id },
          { $set: { status: 'compensating' } }
        );
        const result = await compensateReservation(reservation);
        if (result.allRestocked) recoveredCount++;
      }
    } catch (err) {
      console.error(`[RecoveryWorker] Error recovering reservation ${reservation._id}:`, err.message);
      await InventoryReservation.updateOne(
        { _id: reservation._id },
        { $set: { lockedUntil: new Date(), failureReason: err.message } }
      );
    }
  }

  return { inspected: staleReservations.length, recovered: recoveredCount };
}

/**
 * Background recovery worker for orders whose cancellation/restock was interrupted.
 */
export async function recoverStaleCancellations(staleThresholdMs = 60 * 1000) {
  const cutoff = new Date(Date.now() - staleThresholdMs);

  const pendingOrders = await Order.find({
    cancellationState: { $in: ['in_progress', 'failed'] },
    updatedAt: { $lt: cutoff },
  }).limit(50);

  let recoveredCount = 0;

  for (const pendingOrder of pendingOrders) {
    const order = await Order.findOneAndUpdate(
      {
        _id: pendingOrder._id,
        cancellationState: { $in: ['in_progress', 'failed'] },
        updatedAt: { $lt: cutoff },
      },
      { $set: { cancellationState: 'in_progress' } },
      { new: true }
    );
    if (!order) continue;

    let allRestocked = true;

    for (const item of order.items) {
      if (!item.restocked) {
        try {
          const product = await Product.findOne({ _id: item.product, store: order.store });
          if (!product) {
            await Order.updateOne(
              { _id: order._id, 'items.product': item.product },
              { $set: { 'items.$.restocked': true } }
            );
            continue;
          }

          const res = await Product.updateOne(
            { _id: item.product, store: order.store },
            { $inc: { stock: item.quantity } }
          );

          if (res.modifiedCount === 1) {
            await Order.updateOne(
              { _id: order._id, 'items.product': item.product },
              { $set: { 'items.$.restocked': true } }
            );
          } else {
            allRestocked = false;
          }
        } catch {
          allRestocked = false;
        }
      }
    }

    if (allRestocked) {
      await Order.updateOne(
        { _id: order._id },
        { $set: { status: 'cancelled', cancellationState: 'completed' } }
      );
      recoveredCount++;
    } else {
      await Order.updateOne(
        { _id: order._id },
        { $set: { cancellationState: 'failed' } }
      );
    }
  }

  return { inspected: pendingOrders.length, recovered: recoveredCount };
}

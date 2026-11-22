// Owner: M5
import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Idempotency from '../models/Idempotency.js';
import InventoryReservation from '../models/InventoryReservation.js';
import { priceCart, findActiveStore, storeSummary, httpError } from './cartController.js';
import { createOrderSchema, updateStatusSchema, parse } from '../validators/orderValidator.js';
import { resolveMyStore } from './storeController.js';
import { compensateReservation } from '../services/recoveryService.js';
import { logAudit } from '../utils/auditLogger.js';

// Allowed status changes for store owners
const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const ownerStore = async (req) => {
  const store = await resolveMyStore(req);
  if (!store) throw httpError(404, 'You do not have a store yet');
  return store;
};

// Compute SHA-256 hash for price quote verification
function computeQuoteHash(storeId, lines, total) {
  const quoteData = JSON.stringify({
    storeId: storeId.toString(),
    items: lines.map((l) => ({ p: l.product.toString(), price: l.price, qty: l.quantity })),
    total,
  });
  return crypto.createHash('sha256').update(quoteData).digest('hex').slice(0, 32);
}

// Compute hash of request payload for idempotency mismatch detection
function computeRequestHash(input) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        storeSlug: input.storeSlug,
        items: input.items,
        customerInfo: input.customerInfo,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
      })
    )
    .digest('hex');
}

// POST /api/orders  (guest or logged-in customer)
const createOrder = async (req, res, next) => {
  let idempotencyRecord = null;
  let reservation = null;

  try {
    if (req.user?.role !== 'customer') throw httpError(403, 'Customer account required to place an order');
    const input = parse(createOrderSchema, req.body);
    const store = await findActiveStore(input.storeSlug);
    if (String(req.user.customerStore) !== String(store._id)) throw httpError(403, 'This customer account belongs to a different store');

    // 1. Backend Idempotency Check
    const idempotencyKey =
      (req.headers['idempotency-key'] ? String(req.headers['idempotency-key']).trim() : null) ||
      input.idempotencyKey;

    if (!idempotencyKey) {
      throw httpError(400, 'Idempotency key is required for checkout');
    }

    const requestHash = computeRequestHash(input);

    const existingIdem = await Idempotency.findOne({ store: store._id, key: idempotencyKey });
    if (existingIdem) {
      if (existingIdem.requestHash !== requestHash) {
        throw httpError(409, 'Idempotency key reused with different checkout parameters');
      }
      if (existingIdem.status === 'completed') {
        const response = structuredClone(existingIdem.response || {});
        delete response.trackingToken;
        if (response.order) {
          delete response.order.trackingToken;
          delete response.order.trackingTokenHash;
          delete response.order.trackingTokenEncrypted;
        }
        await Idempotency.updateOne({ _id: existingIdem._id }, { $unset: { 'response.trackingToken': 1 } });
        return res.status(200).json(response);
      }

      if (existingIdem.status === 'in_progress') {
        // Check if an order was already created for this key
        const existingOrder = await Order.findOne({
          store: store._id,
          'metadata.idempotencyKey': idempotencyKey,
        });

        if (existingOrder) {
          const completedResponse = {
            order: existingOrder,
            store: storeSummary(store),
          };
          await Idempotency.updateOne(
            { _id: existingIdem._id },
            { $set: { status: 'completed', orderId: existingOrder._id, response: completedResponse } }
          );
          return res.status(200).json(completedResponse);
        }

        // Check if lock lease is still active
        const now = new Date();
        if (existingIdem.lockedUntil && existingIdem.lockedUntil > now) {
          throw httpError(409, 'Checkout request currently in progress. Please wait.');
        }

        // Lease expired; atomically acquire lock
        const claimed = await Idempotency.findOneAndUpdate(
          {
            _id: existingIdem._id,
            status: 'in_progress',
            lockedUntil: { $lte: now },
          },
          {
            $set: { lockedUntil: new Date(Date.now() + 30000), requestHash },
            $inc: { attempt: 1 },
          },
          { new: true }
        );

        if (!claimed) {
          throw httpError(409, 'Concurrent checkout request in progress. Please wait.');
        }
        idempotencyRecord = claimed;
      } else if (existingIdem.status === 'failed') {
        // Retry failed request
        const reclaimed = await Idempotency.findOneAndUpdate(
          { _id: existingIdem._id, status: 'failed' },
          {
            $set: { status: 'in_progress', lockedUntil: new Date(Date.now() + 30000), requestHash },
            $inc: { attempt: 1 },
          },
          { new: true }
        );
        idempotencyRecord = reclaimed;
      }
    } else {
      try {
        idempotencyRecord = await Idempotency.create({
          key: idempotencyKey,
          store: store._id,
          requestHash,
          status: 'in_progress',
          lockedUntil: new Date(Date.now() + 30000),
        });
      } catch (err) {
        if (err.code === 11000) {
          throw httpError(409, 'Concurrent checkout request with this key in progress. Please wait.');
        }
        throw err;
      }
    }

    // 2. Authoritative Price Cart from Database
    const { lines, issues, subtotal, shippingFee, total } = await priceCart(store, input.items);
    if (issues.length) {
      if (idempotencyRecord) {
        await Idempotency.updateOne({ _id: idempotencyRecord._id }, { $set: { status: 'failed' } });
      }
      return res.status(409).json({ message: 'Some items in your cart need attention', issues });
    }

    // 3. Mandatory Price-Change Confirmation
    const currentQuoteHash = computeQuoteHash(store._id, lines, total);
    if (input.quoteHash !== currentQuoteHash) {
      if (idempotencyRecord) {
        await Idempotency.updateOne({ _id: idempotencyRecord._id }, { $set: { status: 'failed' } });
      }
      return res.status(409).json({
        code: 'QUOTE_CHANGED',
        message: 'Prices, stock, or totals have changed since you viewed checkout. Please confirm the updated total.',
        updatedQuote: { items: lines, subtotal, shippingFee, total, quoteHash: currentQuoteHash },
      });
    }

    // 4. Durable Inventory Reservation
    reservation = await InventoryReservation.create({
      store: store._id,
      idempotencyKey,
      lines: lines.map((l) => ({
        product: l.product,
        name: l.name,
        requestedQuantity: l.quantity,
        deductedQuantity: 0,
        restockedQuantity: 0,
        isDeducted: false,
        isRestocked: false,
      })),
      status: 'pending',
      lockedUntil: new Date(Date.now() + 60000),
    });

    // Deduct stock line by line, atomically recording each successful deduction
    for (const line of lines) {
      const updateResult = await Product.updateOne(
        { _id: line.product, store: store._id, isActive: true, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } }
      );

      if (updateResult.modifiedCount !== 1) {
        // Insufficient stock or inactive product: compensate previously deducted lines
        await compensateReservation(reservation);
        if (idempotencyRecord) {
          await Idempotency.updateOne({ _id: idempotencyRecord._id }, { $set: { status: 'failed' } });
        }
        throw httpError(409, `"${line.name}" just went out of stock. Please review your cart.`);
      }

      // Mark line as deducted in the reservation record
      await InventoryReservation.updateOne(
        { _id: reservation._id, 'lines.product': line.product },
        { $set: { 'lines.$.isDeducted': true, 'lines.$.deductedQuantity': line.quantity } }
      );
    }

    // All lines successfully deducted
    await InventoryReservation.updateOne(
      { _id: reservation._id },
      { $set: { status: 'reserved' } }
    );

    // 6. Create Order
    let order;
    try {
      order = await Order.create({
        store: store._id,
        customer: req.user ? req.user._id : null,
        customerInfo: input.customerInfo,
        shippingAddress: input.shippingAddress,
        items: lines.map((l) => ({
          product: l.product,
          name: l.name,
          image: l.image,
          price: l.price,
          quantity: l.quantity,
          restocked: false,
        })),
        subtotal,
        shippingFee,
        total,
        paymentMethod: input.paymentMethod,
        status: 'confirmed',
        cancellationState: 'none',
        metadata: {
          idempotencyKey,
          reservationId: reservation._id,
          quoteHash: currentQuoteHash,
        },
      });

    } catch (err) {
      // Order creation crashed or failed: compensate stock safely
      await compensateReservation(reservation);
      if (idempotencyRecord) {
        await Idempotency.updateOne({ _id: idempotencyRecord._id }, { $set: { status: 'failed' } });
      }
      throw err;
    }

    // Once an order exists, failed reservation bookkeeping must be recovered
    // by the worker; compensating here would restore stock for a real order.
    const reservationUpdate = await InventoryReservation.updateOne(
      { _id: reservation._id, status: 'reserved' },
      { $set: { status: 'completed', order: order._id, lockedUntil: new Date() } }
    );
    if (reservationUpdate.modifiedCount !== 1) {
      throw httpError(503, 'Order was created and is being finalized. Retry with the same idempotency key.');
    }
    const responsePayload = {
      order,
      store: storeSummary(store),
    };

    // Complete idempotency record
    if (idempotencyRecord) {
      await Idempotency.updateOne(
        { _id: idempotencyRecord._id },
        {
          $set: {
            status: 'completed',
            orderId: order._id,
            response: responsePayload,
            lockedUntil: new Date(),
          },
        }
      );
    }

    res.status(201).json(responsePayload);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/track/:id (public status only; never returns customer details)
const trackOrder = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Order not found');

    const order = await Order.findById(req.params.id)
      .select('store status createdAt items subtotal shippingFee total')
      .populate('store', 'businessName slug currency');

    if (!order) throw httpError(404, 'Order not found');

    res.json({
      order,
      store: storeSummary(order.store),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/my?storeSlug=  (logged-in customer)
const getMyOrders = async (req, res, next) => {
  try {
    if (req.user.role !== 'customer') throw httpError(403, 'Customer account required');
    const filter = { customer: req.user._id };
    if (req.query.storeSlug) {
      const store = await findActiveStore(String(req.query.storeSlug));
      if (String(req.user.customerStore) !== String(store._id)) throw httpError(403, 'This customer account belongs to a different store');
      filter.store = store._id;
    }
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('store', 'businessName slug currency');
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/store?status=&page=&limit=  (store owner)
const getStoreOrders = async (req, res, next) => {
  try {
    const store = await ownerStore(req);
    const rawPage = parseInt(req.query.page, 10);
    const rawLimit = parseInt(req.query.limit, 10);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.min(rawPage, 1000) : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

    const filter = { store: store._id };
    if (transitions[req.query.status]) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status  (store owner)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = parse(updateStatusSchema, req.body);
    const store = await ownerStore(req);
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Order not found');

    const order = await Order.findOne({ _id: req.params.id, store: store._id });
    if (!order) throw httpError(404, 'Order not found');

    // Idempotent: if order is already cancelled, return existing order without restocking twice
    if (order.status === 'cancelled' && status === 'cancelled') {
      return res.json({ order });
    }

    if (!transitions[order.status].includes(status)) {
      throw httpError(400, `Cannot change an order from ${order.status} to ${status}`);
    }

    if (status === 'cancelled') {
      // Atomically claim cancellation state
      const claimedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          store: store._id,
          status: { $in: ['pending', 'confirmed'] },
          cancellationState: { $in: ['none', 'failed'] },
        },
        { $set: { cancellationState: 'in_progress' } },
        { new: true }
      );

      if (!claimedOrder) {
        throw httpError(409, 'Order is currently being updated or already cancelled. Please refresh.');
      }

      let allRestocked = true;
      for (const item of claimedOrder.items) {
        if (!item.restocked) {
          try {
            const product = await Product.findOne({ _id: item.product, store: store._id });
            if (!product) {
              await Order.updateOne(
                { _id: claimedOrder._id, 'items.product': item.product },
                { $set: { 'items.$.restocked': true } }
              );
              continue;
            }

            const restockRes = await Product.updateOne(
              { _id: item.product, store: store._id },
              { $inc: { stock: item.quantity } }
            );

            if (restockRes.modifiedCount === 1) {
              await Order.updateOne(
                { _id: claimedOrder._id, 'items.product': item.product },
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

      const finalCancellationState = allRestocked ? 'completed' : 'failed';
      const updated = await Order.findOneAndUpdate(
        { _id: claimedOrder._id },
        { $set: { status: 'cancelled', cancellationState: finalCancellationState } },
        { new: true }
      );

      await logAudit({
        req,
        storeId: store._id,
        action: 'ORDER_CANCELLED',
        resourceType: 'Order',
        resourceId: updated._id,
        details: { previousStatus: order.status, allRestocked },
      });

      return res.json({ order: updated });
    }

    // Standard non-cancellation transition
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, store: store._id, status: order.status },
      { $set: { status } },
      { new: true }
    );
    if (!updated) throw httpError(409, 'Order was updated by someone else. Please refresh.');

    await logAudit({
      req,
      storeId: store._id,
      action: 'ORDER_STATUS_UPDATE',
      resourceType: 'Order',
      resourceId: updated._id,
      details: { previousStatus: order.status, newStatus: status },
    });

    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const store = await ownerStore(req);
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Order not found');
    const result = await Order.deleteOne({
      _id: req.params.id,
      store: store._id,
      $or: [
        { status: 'delivered' },
        { status: 'cancelled', cancellationState: 'completed' },
      ],
    });
    if (result.deletedCount !== 1) {
      throw httpError(409, 'Only delivered or fully cancelled orders can be removed from history');
    }
    await logAudit({
      req,
      storeId: store._id,
      action: 'ORDER_HISTORY_DELETE',
      resourceType: 'Order',
      resourceId: req.params.id,
    });
    res.json({ success: true, deletedId: req.params.id });
  } catch (err) { next(err); }
};

export { createOrder, trackOrder, getMyOrders, getStoreOrders, updateOrderStatus, deleteOrder };

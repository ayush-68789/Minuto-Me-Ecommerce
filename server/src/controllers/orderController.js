// Owner: M5
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { priceCart, findActiveStore, storeSummary, httpError } from './cartController.js';
import { createOrderSchema, updateStatusSchema, parse } from '../validators/orderValidator.js';
import { resolveMyStore } from './storeController.js';

// Allowed status changes for store owners
const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Atomically takes stock for every line; puts back what was taken if any line fails.
async function reserveStock(storeId, lines) {
  const reserved = [];
  for (const line of lines) {
    const { modifiedCount } = await Product.updateOne(
      { _id: line.product, store: storeId, isActive: true, stock: { $gte: line.quantity } },
      { $inc: { stock: -line.quantity } }
    );
    if (!modifiedCount) {
      await restock(storeId, reserved);
      throw httpError(409, `"${line.name}" just went out of stock. Please review your cart.`);
    }
    reserved.push(line);
  }
}

function restock(storeId, lines) {
  return Promise.all(
    lines.map((line) =>
      Product.updateOne({ _id: line.product, store: storeId }, { $inc: { stock: line.quantity } })
    )
  );
}

const ownerStore = async (req) => {
  const store = await resolveMyStore(req);
  if (!store) throw httpError(404, 'You do not have a store yet');
  return store;
};

// POST /api/orders  (guest or logged-in customer)
const createOrder = async (req, res, next) => {
  try {
    const input = parse(createOrderSchema, req.body);
    const store = await findActiveStore(input.storeSlug);

    if (input.paymentMethod === 'online' && !store.features.payments) {
      throw httpError(400, 'This store does not accept online payments');
    }

    const { lines, issues, subtotal, shippingFee, total } = await priceCart(store, input.items);
    if (issues.length) {
      return res.status(409).json({ message: 'Some items in your cart need attention', issues });
    }

    await reserveStock(store._id, lines);
    let order;
    try {
      order = await Order.create({
        store: store._id,
        customer: req.user ? req.user._id : null,
        customerInfo: input.customerInfo,
        shippingAddress: input.shippingAddress,
        items: lines,
        subtotal,
        shippingFee,
        total,
        payment: { method: input.paymentMethod },
      });
    } catch (err) {
      await restock(store._id, lines);
      throw err;
    }

    res.status(201).json({ order, store: storeSummary(store) });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/track/:id?email=  (lets guests check their order)
const trackOrder = async (req, res, next) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!mongoose.isValidObjectId(req.params.id) || !email) throw httpError(404, 'Order not found');

    const order = await Order.findOne({ _id: req.params.id, 'customerInfo.email': email }).populate(
      'store',
      'businessName slug currency features'
    );
    if (!order) throw httpError(404, 'Order not found');

    res.json({ order, store: storeSummary(order.store) });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/my?storeSlug=  (logged-in customer)
const getMyOrders = async (req, res, next) => {
  try {
    const filter = { customer: req.user._id };
    if (req.query.storeSlug) {
      const store = await findActiveStore(String(req.query.storeSlug));
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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const filter = { store: store._id };
    if (transitions[req.query.status]) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
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
    if (!transitions[order.status].includes(status)) {
      throw httpError(400, `Cannot change an order from ${order.status} to ${status}`);
    }

    // Conditional update so two concurrent changes can't both apply (e.g. double restock)
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, store: store._id, status: order.status },
      { $set: { status } },
      { new: true }
    );
    if (!updated) throw httpError(409, 'Order was updated by someone else. Please refresh.');

    if (status === 'cancelled') await restock(store._id, order.items);

    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
};

export { createOrder, trackOrder, getMyOrders, getStoreOrders, updateOrderStatus };

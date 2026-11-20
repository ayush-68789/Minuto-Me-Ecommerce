import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { priceCart, findActiveStore, storeSummary, httpError } from './cartController.js';
import { createOrderSchema, updateStatusSchema, parse } from '../validators/orderValidator.js';

const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function productModel() {
  if (!mongoose.models.Product) throw httpError(503, 'Product service is not available yet');
  return mongoose.model('Product');
}

async function restock(storeId, lines) {
  const Product = productModel();
  const outcomes = await Promise.allSettled(
    lines.map((line) =>
      Product.updateOne({ _id: line.product, store: storeId }, { $inc: { stock: line.quantity } })
    )
  );
  const failed = outcomes.find((result) => result.status === 'rejected');
  if (failed) throw failed.reason;
}

async function reserveStock(storeId, lines) {
  const Product = productModel();
  const reserved = [];
  try {
    for (const line of lines) {
      const result = await Product.updateOne(
        { _id: line.product, store: storeId, isActive: true, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } }
      );
      if (result.modifiedCount !== 1) {
        throw httpError(409, `"${line.name}" just went out of stock. Please review your cart.`);
      }
      reserved.push(line);
    }
  } catch (error) {
    if (reserved.length) {
      try {
        await restock(storeId, reserved);
      } catch (rollbackError) {
        error.rollbackError = rollbackError;
      }
    }
    throw error;
  }
}

async function ownerStore(req) {
  if (!mongoose.models.Store) throw httpError(503, 'Store service is not available yet');
  const store = await mongoose.model('Store').findOne({ owner: req.user._id });
  if (!store) throw httpError(404, 'You do not have a store yet');
  return store;
}

const createOrder = async (req, res, next) => {
  try {
    const input = parse(createOrderSchema, req.body);
    const store = await findActiveStore(input.storeSlug);
    const { lines, issues, subtotal, shippingFee, total } = await priceCart(store, input.items);
    if (issues.length) {
      return res.status(409).json({ message: 'Some items in your cart need attention', issues });
    }

    await reserveStock(store._id, lines);
    let order;
    try {
      order = await Order.create({
        store: store._id,
        customer: req.user?._id || null,
        customerInfo: input.customerInfo,
        shippingAddress: input.shippingAddress,
        items: lines,
        subtotal,
        shippingFee,
        total,
        payment: { method: 'cod' },
      });
    } catch (error) {
      try {
        await restock(store._id, lines);
      } catch (rollbackError) {
        error.rollbackError = rollbackError;
      }
      throw error;
    }

    res.status(201).json({ order, store: storeSummary(store) });
  } catch (error) {
    next(error);
  }
};

const trackOrder = async (req, res, next) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!mongoose.isValidObjectId(req.params.id) || !email) throw httpError(404, 'Order not found');
    const order = await Order.findOne({ _id: req.params.id, 'customerInfo.email': email }).populate(
      'store',
      'businessName slug currency features'
    );
    if (!order?.store) throw httpError(404, 'Order not found');
    res.json({ order, store: storeSummary(order.store) });
  } catch (error) {
    next(error);
  }
};

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
  } catch (error) {
    next(error);
  }
};

const getStoreOrders = async (req, res, next) => {
  try {
    const store = await ownerStore(req);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = { store: store._id };
    if (Object.prototype.hasOwnProperty.call(transitions, req.query.status)) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = parse(updateStatusSchema, req.body);
    const store = await ownerStore(req);
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Order not found');

    const order = await Order.findOne({ _id: req.params.id, store: store._id });
    if (!order) throw httpError(404, 'Order not found');
    if (!transitions[order.status]?.includes(status)) {
      throw httpError(400, `Cannot change an order from ${order.status} to ${status}`);
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, store: store._id, status: order.status },
      { $set: { status } },
      { new: true }
    );
    if (!updated) throw httpError(409, 'Order was updated by someone else. Please refresh.');
    if (status === 'cancelled') await restock(store._id, order.items);
    res.json({ order: updated });
  } catch (error) {
    next(error);
  }
};

export { createOrder, trackOrder, getMyOrders, getStoreOrders, updateOrderStatus, reserveStock };

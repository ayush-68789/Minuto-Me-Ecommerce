import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import { createPaymentOrder } from '../utils/razorpay.js';

const bad = (res, status, code, message) => res.status(status).json({ error: { code, message } });

export const checkout = async (req, res, next) => {
  try {
    const { items } = req.body || {};
    const tenantId = String(req.tenant?._id || req.tenantId);

    if (!Array.isArray(items) || items.length === 0 || items.length > 50 ||
        items.some((i) => !mongoose.isValidObjectId(i?.productId) ||
                          !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 100)) {
      return bad(res, 400, 'INVALID_ITEMS', 'Invalid items');
    }

    // Price comes from the database. req.body.total / req.body.price are NEVER read.
    const products = await Product.find({ _id: { $in: items.map((i) => i.productId) }, tenantId });
    const byId = new Map(products.map((p) => [String(p._id), p]));

    let total = 0;
    const lines = [];
    for (const i of items) {
      const p = byId.get(String(i.productId));
      if (!p) return bad(res, 404, 'PRODUCT_NOT_FOUND', 'Unknown product');
      const price = Math.round(p.price * 100); // paise
      total += price * i.qty;
      lines.push({ productId: p._id, qty: i.qty, price });
    }

    // TODO(Member 1): reserve stock atomically here. On failure: return bad(res, 409, 'OUT_OF_STOCK', ...)
    // await inventory.reserve(tenantId, lines);

    const order = await Order.create({
      tenantId, userId: String(req.user._id || req.user.id), items: lines, total,
      status: 'pending', idempotencyKey: req.get('Idempotency-Key'),
    });

    const rp = await createPaymentOrder({ amount: total, receipt: String(order._id) });
    order.razorpayOrderId = rp.id;
    await order.save();

    res.status(201).json({
      orderId: order._id,
      razorpayOrderId: rp.id,
      amount: total,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'mock',
    });
  } catch (e) { next(e); }
};

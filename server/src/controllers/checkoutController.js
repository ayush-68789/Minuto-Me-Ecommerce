import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/orderModel.js';
import { createPaymentOrder } from '../utils/razorpay.js';
import { releaseReservations, reserveStock } from '../modules/inventory/inventoryService.js';

const bad = (res, status, code, message) => res.status(status).json({ error: { code, message } });

export const checkout = async (req, res) => {
  const { items } = req.body || {};
  const tenantId = String(req.tenantId || 'default');
  const userId = String(req.user?.id || req.user?._id || '');

  if (!userId) return bad(res, 401, 'AUTH_REQUIRED', 'Authentication is required');
  if (!Array.isArray(items) || items.length === 0 || items.length > 50 ||
      items.some((item) => !mongoose.isValidObjectId(item?.productId) ||
        !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 100)) {
    return bad(res, 400, 'INVALID_ITEMS', 'Invalid items');
  }

  const products = await Product.find({ _id: { $in: items.map((item) => item.productId) }, tenantId });
  const byId = new Map(products.map((product) => [String(product._id), product]));
  let total = 0;
  const lines = [];
  for (const item of items) {
    const product = byId.get(String(item.productId));
    if (!product) return bad(res, 404, 'PRODUCT_NOT_FOUND', 'Unknown product');
    const price = Math.round(product.price * 100); // rupees to paise; never trust a client-supplied total.
    total += price * item.qty;
    lines.push({ productId: product._id, qty: item.qty, price });
  }

  const reservationIds = [];
  if (process.env.INVENTORY_ENABLED !== 'false') {
    try {
      for (const line of lines) {
        const { reservation } = await reserveStock({
          productId: String(line.productId), quantity: line.qty, customerId: userId, tenantId,
        });
        reservationIds.push(String(reservation._id));
      }
    } catch (error) {
      if (reservationIds.length) {
        await releaseReservations({ reservationIds, customerId: userId, tenantId });
      }
      return bad(res, error.statusCode || 409, error.code || 'INVENTORY_UNAVAILABLE', error.message || 'Inventory is unavailable');
    }
  }

  let order;
  try {
    order = await Order.create({
      tenantId, userId, items: lines, total,
      status: reservationIds.length ? 'reserved' : 'pending',
      idempotencyKey: req.get('Idempotency-Key'),
      reservationIds,
    });
    const paymentOrder = await createPaymentOrder({ amount: total, receipt: String(order._id) });
    order.razorpayOrderId = paymentOrder.id;
    await order.save();
    return res.status(201).json({
      orderId: order._id,
      razorpayOrderId: paymentOrder.id,
      amount: total,
      currency: process.env.PAYMENT_CURRENCY || 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'mock',
      reservationIds,
      paymentMode: process.env.RAZORPAY_KEY_ID ? 'razorpay-test' : 'mock',
    });
  } catch (error) {
    if (reservationIds.length) {
      await releaseReservations({ reservationIds, customerId: userId, tenantId }).catch((releaseError) => {
        console.error('[checkout] reservation release failed:', releaseError.message);
      });
    }
    throw error;
  }
};

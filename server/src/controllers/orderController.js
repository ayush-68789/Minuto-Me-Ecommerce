// Owner: Member 5 — authenticated order controllers aligned with Mongo Order schema and hardened checkout.
import mongoose from 'mongoose';
import { HttpError } from '../middleware/errorHandler.js';
import { canAccessOwned } from '../middleware/roleMiddleware.js';
import MongoOrder from '../models/orderModel.js';
import Product from '../models/Product.js';
import LegacyOrder from '../models/Order.js';
import Payment from '../models/Payment.js';
import Cart from '../models/Cart.js';
import { releaseReservations } from '../modules/inventory/inventoryService.js';

function tenantId(req) {
  return String(req.tenantId || 'default');
}

// Deprecated legacy purchase flow. Use hardened POST /api/checkout instead.
export async function createOrder(req, res) {
  // If invoked via /api/orders/checkout, inform caller to use hardened /api/checkout
  if (req.originalUrl?.includes('/checkout')) {
    throw new HttpError(
      410,
      'deprecated_endpoint',
      'POST /api/orders/checkout is deprecated. Please use hardened POST /api/checkout instead.'
    );
  }

  // Compatibility path for legacy M1 auth demo if needed
  const { customer = {}, shippingAddress = {}, paymentMethod = 'demo_card', items = [] } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'empty_cart', 'Add items before checkout');
  }

  const subtotal = Number(items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity || item.qty) || 1), 0).toFixed(2));
  const shipping = subtotal >= 50 ? 0 : 5;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const pricing = { subtotal, discount: 0, shipping, tax, total: Number((subtotal + shipping + tax).toFixed(2)), currency: 'USD' };

  const payment = Payment.create({ tenantId: tenantId(req), orderId: 'pending_checkout', amount: pricing.total, currency: 'USD', method: paymentMethod });
  const processedPayment = Payment.process(payment.id, { success: true, providerDetails: { method: paymentMethod, timestamp: new Date().toISOString() } });
  const order = LegacyOrder.create({
    tenantId: tenantId(req),
    customerId: req.user.id,
    customer: { name: req.user.name, email: req.user.email, phone: customer.phone || '' },
    shippingAddress,
    items,
    pricing,
    payment: { paymentId: processedPayment.id, method: paymentMethod, status: processedPayment.status },
  });
  processedPayment.orderId = order.id;
  return res.status(201).json({ message: 'Order created and demo payment processed', order, payment: processedPayment });
}

export async function getOrder(req, res) {
  const tId = tenantId(req);
  const isAdmin = req.user?.role === 'admin';
  const orderId = req.params.orderId;
  const userId = String(req.user?.id || req.user?._id || '');

  // 1. Check MongoDB if connected and ID is a valid ObjectId
  if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(orderId)) {
    const o = await MongoOrder.findOne({ _id: orderId, tenantId: tId }).lean();
    if (o) {
      if (!isAdmin && String(o.userId) !== userId) {
        throw new HttpError(404, 'order_not_found', 'Order not found');
      }

      // Populate product names and images
      const productIds = (o.items || []).map((i) => i.productId).filter(Boolean);
      const products = await Product.find({ _id: { $in: productIds } }).lean();
      const pMap = new Map(products.map((p) => [String(p._id), p]));

      const formattedItems = (o.items || []).map((i) => {
        const prod = pMap.get(String(i.productId));
        return {
          productId: String(i.productId),
          title: prod?.name || `Product ${i.productId}`,
          price: (i.price || 0) / 100,
          quantity: i.qty || 1,
          total: ((i.price || 0) * (i.qty || 1)) / 100,
          image: prod?.imageUrl || '📦',
        };
      });

      const order = {
        id: String(o._id),
        _id: String(o._id),
        tenantId: o.tenantId,
        customerId: o.userId,
        userId: o.userId,
        status: o.status,
        items: formattedItems,
        pricing: {
          subtotal: (o.total || 0) / 100,
          discount: 0,
          shipping: 0,
          tax: 0,
          total: (o.total || 0) / 100,
          currency: process.env.PAYMENT_CURRENCY || 'INR',
        },
        payment: {
          paymentId: o.paymentId || o.paymentOrderId || null,
          method: 'demo',
          status: o.status === 'paid' ? 'completed' : o.status,
        },
        shippingAddress: o.shippingAddress || { street: 'Standard Delivery Address', city: 'Metroville' },
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      };

      return res.status(200).json({ order, payments: [] });
    }
  }

  // 2. Fallback to in-memory LegacyOrder
  const order = LegacyOrder.get(orderId);
  if (!order || order.tenantId !== tId || !canAccessOwned(req.user, order.customerId)) {
    throw new HttpError(404, 'order_not_found', 'Order not found');
  }
  return res.status(200).json({ order, payments: Payment.findByOrderId(order.id) });
}

export async function listOrders(req, res) {
  const tId = tenantId(req);
  const isAdmin = req.user?.role === 'admin';
  const userId = String(req.user?.id || req.user?._id || '');

  // 1. Check MongoDB if connected
  if (mongoose.connection.readyState === 1) {
    const filter = { tenantId: tId };
    if (!isAdmin || req.query.all !== 'true') {
      filter.userId = userId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const docs = await MongoOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 50)
      .lean();

    const productIds = docs.flatMap((d) => (d.items || []).map((i) => i.productId)).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const pMap = new Map(products.map((p) => [String(p._id), p]));

    const orders = docs.map((o) => ({
      id: String(o._id),
      _id: String(o._id),
      tenantId: o.tenantId,
      customerId: o.userId,
      userId: o.userId,
      status: o.status,
      items: (o.items || []).map((i) => {
        const prod = pMap.get(String(i.productId));
        return {
          productId: String(i.productId),
          title: prod?.name || `Product ${i.productId}`,
          price: (i.price || 0) / 100,
          quantity: i.qty || 1,
          total: ((i.price || 0) * (i.qty || 1)) / 100,
          image: prod?.imageUrl || '📦',
        };
      }),
      pricing: {
        subtotal: (o.total || 0) / 100,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: (o.total || 0) / 100,
        currency: process.env.PAYMENT_CURRENCY || 'INR',
      },
      payment: {
        paymentId: o.paymentId || o.paymentOrderId || null,
        method: 'demo',
        status: o.status === 'paid' ? 'completed' : o.status,
      },
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return res.status(200).json({ orders });
  }

  // 2. Fallback to in-memory LegacyOrder
  const orders = LegacyOrder.list({
    tenantId: tId,
    customerId: isAdmin && req.query.all === 'true' ? undefined : req.user.id,
    status: req.query.status,
    limit: req.query.limit,
  });
  return res.status(200).json({ orders });
}

export async function cancelOrder(req, res) {
  const tId = tenantId(req);
  const isAdmin = req.user?.role === 'admin';
  const orderId = req.params.orderId;
  const userId = String(req.user?.id || req.user?._id || '');

  // 1. Check MongoDB if connected
  if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(orderId)) {
    const o = await MongoOrder.findOne({ _id: orderId, tenantId: tId });
    if (!o) throw new HttpError(404, 'order_not_found', 'Order not found');
    if (!isAdmin && String(o.userId) !== userId) {
      throw new HttpError(404, 'order_not_found', 'Order not found');
    }

    if (['shipped', 'delivered', 'fulfilled', 'cancelled'].includes(o.status)) {
      throw new HttpError(400, 'cancellation_failed', `Cannot cancel order with status "${o.status}"`);
    }

    // Release stock reservations if any exist
    if (Array.isArray(o.reservationIds) && o.reservationIds.length > 0) {
      try {
        await releaseReservations({
          reservationIds: o.reservationIds.map(String),
          customerId: o.userId,
          tenantId: tId,
        });
      } catch (err) {
        console.warn('[cancelOrder] failed to release reservations:', err.message);
      }
    }

    o.status = 'cancelled';
    await o.save();

    return res.status(200).json({
      message: 'Order cancelled successfully',
      order: {
        id: String(o._id),
        status: o.status,
        cancellation: { reason: req.body?.reason || 'Cancelled by customer', cancelledAt: new Date().toISOString() },
      },
    });
  }

  // 2. Fallback to in-memory LegacyOrder
  const order = LegacyOrder.get(orderId);
  if (!order || order.tenantId !== tId || !canAccessOwned(req.user, order.customerId)) {
    throw new HttpError(404, 'order_not_found', 'Order not found');
  }
  try {
    const cancelled = LegacyOrder.cancel(order.id, {
      reason: req.body?.reason || 'Cancelled by customer',
      cancelledBy: isAdmin ? 'admin' : 'customer',
    });
    return res.status(200).json({ message: 'Order cancelled successfully', order: cancelled });
  } catch (err) {
    throw new HttpError(400, 'cancellation_failed', err.message);
  }
}

export async function updateShipment(req, res) {
  const tId = tenantId(req);
  const orderId = req.params.orderId;

  if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(orderId)) {
    const o = await MongoOrder.findOne({ _id: orderId, tenantId: tId });
    if (!o) throw new HttpError(404, 'order_not_found', 'Order not found');
    o.status = 'fulfilled';
    await o.save();
    return res.status(200).json({
      message: 'Shipment updated',
      order: {
        id: String(o._id),
        status: o.status,
        shipment: {
          trackingNumber: req.body?.trackingNumber || `TRK-${orderId.slice(-6).toUpperCase()}`,
          carrier: req.body?.carrier || 'Standard Express',
        },
      },
    });
  }

  const order = LegacyOrder.get(orderId);
  if (!order || order.tenantId !== tId) throw new HttpError(404, 'order_not_found', 'Order not found');
  const updated = LegacyOrder.updateShipment(order.id, {
    trackingNumber: req.body?.trackingNumber,
    carrier: req.body?.carrier,
    estimatedDelivery: req.body?.estimatedDelivery,
  });
  return res.status(200).json({ message: 'Shipment updated', order: updated });
}

export async function updateOrderStatus(req, res) {
  const tId = tenantId(req);
  const orderId = req.params.orderId;

  if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(orderId)) {
    const o = await MongoOrder.findOne({ _id: orderId, tenantId: tId });
    if (!o) throw new HttpError(404, 'order_not_found', 'Order not found');
    o.status = req.body.status;
    await o.save();
    return res.status(200).json({ order: { id: String(o._id), status: o.status } });
  }

  const order = LegacyOrder.get(orderId);
  if (!order || order.tenantId !== tId) throw new HttpError(404, 'order_not_found', 'Order not found');
  const updated = LegacyOrder.updateStatus(order.id, req.body.status);
  if (!updated) throw new HttpError(404, 'order_not_found', 'Order not found');
  return res.status(200).json({ order: updated });
}

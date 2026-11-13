// Owner: Member 5 — authenticated order and checkout controllers.
import { HttpError } from '../middleware/errorHandler.js';
import { canAccessOwned } from '../middleware/roleMiddleware.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

function tenantId(req) {
  return req.tenantId;
}

export function createOrder(req, res) {
  const { customer = {}, shippingAddress = {}, paymentMethod = 'demo_card' } = req.body;
  const fromCart = req.body.fromCart === undefined ? !Array.isArray(req.body.items) : req.body.fromCart !== false;
  const cart = Cart.get(tenantId(req), req.user.id);
  const items = fromCart ? cart.items : req.body.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'empty_cart', 'Add items before checkout');
  }
  const invalidItems = items.some((item) => !item || !item.productId || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 100);
  if (invalidItems) throw new HttpError(400, 'invalid_items', 'Each order item needs a product ID and quantity from 1 to 100');
  if (fromCart && (!shippingAddress.street || !shippingAddress.city)) {
    throw new HttpError(400, 'invalid_checkout', 'Shipping street and city are required');
  }

  const subtotal = Number(items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0).toFixed(2));
  const shipping = subtotal >= 50 ? 0 : 5;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const pricing = { subtotal, shipping, tax, total: Number((subtotal + shipping + tax).toFixed(2)), currency: 'USD' };
  const payment = Payment.create({ tenantId: tenantId(req), orderId: 'pending_checkout', amount: pricing.total, currency: 'USD', method: paymentMethod });
  const processedPayment = Payment.process(payment.id, { success: true, providerDetails: { method: paymentMethod, timestamp: new Date().toISOString() } });
  const order = Order.create({
    tenantId: tenantId(req),
    customerId: req.user.id,
    customer: { name: req.user.name, email: req.user.email, phone: customer.phone || '' },
    shippingAddress,
    items,
    pricing,
    payment: { paymentId: processedPayment.id, method: paymentMethod, status: processedPayment.status },
  });
  processedPayment.orderId = order.id;
  Cart.clear(tenantId(req), req.user.id);
  res.status(201).json({ message: 'Order created and demo payment processed', order, payment: processedPayment });
}

export function getOrder(req, res) {
  const order = Order.get(req.params.orderId);
  if (!order || order.tenantId !== tenantId(req) || !canAccessOwned(req.user, order.customerId)) {
    throw new HttpError(404, 'order_not_found', 'Order not found');
  }
  res.status(200).json({ order, payments: Payment.findByOrderId(order.id) });
}

export function listOrders(req, res) {
  const isAdmin = req.user.role === 'admin';
  const orders = Order.list({
    tenantId: tenantId(req),
    customerId: isAdmin && req.query.all === 'true' ? undefined : req.user.id,
    limit: req.query.limit,
  });
  res.status(200).json({ orders });
}

export function updateOrderStatus(req, res) {
  const order = Order.get(req.params.orderId);
  if (!order || order.tenantId !== tenantId(req)) throw new HttpError(404, 'order_not_found', 'Order not found');
  const updated = Order.updateStatus(order.id, req.body.status);
  if (!updated) throw new HttpError(404, 'order_not_found', 'Order not found');
  res.status(200).json({ order: updated });
}

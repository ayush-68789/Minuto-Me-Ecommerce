// Owner: Member 5 — payment handlers enforce order ownership and server-calculated amount.
import { HttpError } from '../middleware/errorHandler.js';
import { canAccessOwned } from '../middleware/roleMiddleware.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

function findOwnedPayment(req, id) {
  const payment = Payment.get(id);
  const order = payment && Order.get(payment.orderId);
  if (!payment || !order || order.tenantId !== req.tenantId || !canAccessOwned(req.user, order.customerId)) {
    throw new HttpError(404, 'payment_not_found', 'Payment not found');
  }
  return { payment, order };
}

export function createPayment(req, res) {
  const { orderId, method = 'demo_card' } = req.body || {};
  const order = orderId && Order.get(orderId);
  if (!order || order.tenantId !== req.tenantId || !canAccessOwned(req.user, order.customerId)) {
    throw new HttpError(404, 'order_not_found', 'Order not found');
  }
  const payment = Payment.create({
    orderId: order.id,
    tenantId: order.tenantId,
    amount: order.pricing.total,
    currency: order.pricing.currency,
    method,
  });
  res.status(201).json({ payment });
}

export function processPayment(req, res) {
  const { payment, order } = findOwnedPayment(req, req.params.id);
  const processed = Payment.process(payment.id, {
    success: req.body?.simulateSuccess !== false,
    failureReason: req.body?.failureReason,
    providerDetails: {},
  });
  Order.updatePayment(order.id, { paymentId: processed.id, method: processed.method, status: processed.status });
  res.status(200).json({ message: processed.status === 'completed' ? 'Payment processed' : 'Payment failed', payment: processed });
}

export function getPayment(req, res) {
  const { payment } = findOwnedPayment(req, req.params.id);
  res.status(200).json({ payment });
}

export function handleWebhook(req, res) {
  const { paymentId, event, payload } = req.body || {};
  if (!paymentId) throw new HttpError(400, 'invalid_webhook', 'paymentId is required');
  const result = Payment.handleWebhook({ paymentId, event, payload });
  if (!result.handled) throw new HttpError(404, 'payment_not_found', 'Payment not found');
  if (result.payment.orderId && result.payment.orderId !== 'pending_checkout') {
    Order.updatePayment(result.payment.orderId, { paymentId: result.payment.id, status: result.payment.status });
  }
  res.status(200).json({ message: 'Webhook processed', payment: result.payment });
}

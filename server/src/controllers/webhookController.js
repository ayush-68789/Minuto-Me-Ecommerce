import { createHash } from 'node:crypto';
import Order from '../models/orderModel.js';
import Payment from '../models/paymentModel.js';
import WebhookEvent from '../models/webhookEventModel.js';
import { verifyPaymentSignature } from '../utils/paymentWebhook.js';
import { confirmReservations, releaseReservations } from '../modules/inventory/inventoryService.js';

async function processEvent(event) {
  const payment = event.data;
  if (!payment?.orderId || !payment?.paymentId || !Number.isSafeInteger(payment?.amount)) return;

  if (event.event === 'payment.captured') {
    const order = await Order.findOne({ paymentOrderId: payment.orderId });
    if (!order) throw new Error('Order not found');
    if (payment.amount !== order.total) throw new Error('Amount mismatch');
    if (order.status === 'paid') return;
    await confirmReservations({ reservationIds: order.reservationIds || [], customerId: order.userId, tenantId: order.tenantId });
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: { $in: ['pending', 'reserved'] } },
      { $set: { status: 'paid', paymentId: payment.paymentId, paidAt: new Date() } },
      { new: true },
    );
    if (!updated) return;
    try {
      await Payment.create({ tenantId: order.tenantId, orderId: order._id, providerPaymentId: payment.paymentId, amount: payment.amount });
    } catch (error) { if (error.code !== 11000) throw error; }
  }

  if (event.event === 'payment.failed') {
    const order = await Order.findOne({ paymentOrderId: payment.orderId });
    if (!order || !['pending', 'reserved'].includes(order.status)) return;
    try {
      await releaseReservations({ reservationIds: order.reservationIds || [], customerId: order.userId, tenantId: order.tenantId });
    } catch (error) {
      if (error.code === 'RESERVATION_UNAVAILABLE') return;
      throw error;
    }
    await Order.updateOne({ _id: order._id, status: { $in: ['pending', 'reserved'] } }, { $set: { status: 'cancelled' } });
  }
}

export const handlePaymentWebhook = async (req, res) => {
  const raw = req.body;
  if (!Buffer.isBuffer(raw) || !verifyPaymentSignature(raw, req.get('x-payment-signature'))) {
    return res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Signature verification failed' } });
  }
  let event;
  try { event = JSON.parse(raw.toString('utf8')); }
  catch { return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Invalid JSON' } }); }

  const eventId = req.get('x-payment-event-id') || event.id || createHash('sha256').update(raw).digest('hex');
  const key = { provider: 'demo', eventId };
  try {
    await WebhookEvent.create({ ...key, eventType: event.event, payload: event });
  } catch (error) {
    if (error.code !== 11000) return res.status(500).json({ error: { code: 'INBOX_ERROR' } });
    const claimed = await WebhookEvent.findOneAndUpdate({ ...key, status: 'failed' }, { $set: { status: 'received' } });
    if (!claimed) return res.status(200).json({ received: true, duplicate: true });
  }

  try {
    await processEvent(event);
    await WebhookEvent.updateOne(key, { $set: { status: 'processed' } });
    return res.status(200).json({ received: true });
  } catch (error) {
    await WebhookEvent.updateOne(key, { $set: { status: 'failed', error: error.message } });
    return res.status(500).json({ error: { code: 'PROCESSING_FAILED' } });
  }
};

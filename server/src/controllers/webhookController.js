import crypto from 'crypto';
import Order from '../models/orderModel.js';
import Payment from '../models/paymentModel.js';
import WebhookEvent from '../models/webhookEventModel.js';
import { verifySignature } from '../utils/razorpay.js';

async function processEvent(event) {
  const p = event.payload?.payment?.entity;
  if (!p) return;

  if (event.event === 'payment.captured') {
    // NOTE: webhooks have no tenant header. If Member 5's tenant plugin blocks this
    // query, use its bypass option here.
    const order = await Order.findOne({ razorpayOrderId: p.order_id });
    if (!order) throw new Error('Order not found for ' + p.order_id);
    if (p.amount !== order.total) throw new Error('Amount mismatch');

    // Atomic state transition: only one caller can move pending/reserved -> paid.
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: { $in: ['pending', 'reserved'] } },
      { $set: { status: 'paid', paymentId: p.id, paidAt: new Date() } },
      { new: true }
    );
    if (!updated) return; // already paid, nothing more to do

    try {
      await Payment.create({
        tenantId: order.tenantId, orderId: order._id,
        providerPaymentId: p.id, amount: p.amount,
      });
    } catch (e) { if (e.code !== 11000) throw e; }
  }

  if (event.event === 'payment.failed') {
    await Order.updateOne(
      { razorpayOrderId: p.order_id, status: { $in: ['pending', 'reserved'] } },
      { $set: { status: 'cancelled' } }
    );
    // TODO(Member 1): release the reserved stock here
  }
}

export const handleRazorpay = async (req, res) => {
  const raw = req.body; // Buffer, because this route is mounted with express.raw
  const signature = req.get('x-razorpay-signature');

  if (!Buffer.isBuffer(raw) || !signature || !verifySignature(raw, signature)) {
    return res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Signature verification failed' } });
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); }
  catch { return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Invalid JSON' } }); }

  const eventId = req.get('x-razorpay-event-id') || crypto.createHash('sha256').update(raw).digest('hex');
  const key = { provider: 'razorpay', eventId };

  try {
    await WebhookEvent.create({ ...key, eventType: event.event, payload: event });
  } catch (e) {
    if (e.code !== 11000) return res.status(500).json({ error: { code: 'INBOX_ERROR' } });
    // Already seen. Reprocess only if the earlier attempt failed (atomic claim).
    const claimed = await WebhookEvent.findOneAndUpdate({ ...key, status: 'failed' }, { $set: { status: 'received' } });
    if (!claimed) return res.status(200).json({ received: true, duplicate: true });
  }

  try {
    await processEvent(event);
    await WebhookEvent.updateOne(key, { $set: { status: 'processed' } });
    res.status(200).json({ received: true });
  } catch (err) {
    await WebhookEvent.updateOne(key, { $set: { status: 'failed', error: err.message } });
    res.status(500).json({ error: { code: 'PROCESSING_FAILED' } }); // provider will retry
  }
};

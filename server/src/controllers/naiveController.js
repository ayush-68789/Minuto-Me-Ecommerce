import { NaiveOrder, NaivePayment } from '../models/naiveModels.js';

// NAIVE on purpose: trusts the frontend total, no idempotency, new order every call.
export const checkout = async (req, res) => {
  const order = await NaiveOrder.create({
    items: req.body.items,
    total: req.body.total,
    idempotencyKey: req.get('Idempotency-Key'),
    status: 'pending',
  });
  res.status(201).json({ orderId: order.id });
};

// NAIVE on purpose: no signature check, no event-ID dedup.
export const webhook = async (req, res) => {
  const p = req.body.payload.payment.entity;
  await NaivePayment.create({ paymentId: p.id, orderRef: p.order_id, amount: p.amount });
  await NaiveOrder.updateOne({ razorpayOrderId: p.order_id }, { status: 'paid' });
  res.json({ ok: true });
};

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
  const payment = req.body.data;
  await NaivePayment.create({ paymentId: payment.paymentId, orderRef: payment.orderId, amount: payment.amount });
  await NaiveOrder.updateOne({ paymentOrderId: payment.orderId }, { status: 'paid' });
  res.json({ ok: true });
};

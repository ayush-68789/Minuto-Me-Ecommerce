// Owner: Member 5 — MVC model for payment attempts and demo provider state.
import { randomUUID } from 'node:crypto';

const payments = new Map();

const Payment = {
  create({ orderId, tenantId, amount, currency = 'USD', method = 'demo_card' }) {
    const parsedAmount = Number(amount);
    if (!orderId || !tenantId || !Number.isFinite(parsedAmount) || parsedAmount < 0) {
      throw new Error('A valid order, tenant, and amount are required');
    }
    const now = new Date().toISOString();
    const payment = {
      id: randomUUID(),
      orderId,
      tenantId,
      amount: parsedAmount,
      currency,
      method,
      status: 'pending',
      transactionRef: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    payments.set(payment.id, payment);
    return payment;
  },
  get(id) {
    return payments.get(id) || null;
  },
  findByOrderId(orderId) {
    return [...payments.values()].filter((payment) => payment.orderId === orderId);
  },
  process(id, { success = true, failureReason = null, providerDetails = {} } = {}) {
    const payment = payments.get(id);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'pending') return payment;
    payment.status = success ? 'completed' : 'failed';
    payment.failureReason = failureReason;
    payment.providerDetails = { ...providerDetails, processedAt: new Date().toISOString(), mode: 'demo_simulation' };
    payment.updatedAt = new Date().toISOString();
    return payment;
  },
  handleWebhook({ paymentId, event = 'payment.succeeded', payload = {} }) {
    const payment = payments.get(paymentId);
    if (!payment) return { handled: false, error: 'Payment not found' };
    if (payment.status !== 'pending') return { handled: true, payment };
    if (event === 'payment.succeeded') payment.status = 'completed';
    else if (event === 'payment.failed') {
      payment.status = 'failed';
      payment.failureReason = payload.reason || 'Webhook reported payment failure';
    } else return { handled: false, error: 'Unsupported payment event' };
    payment.updatedAt = new Date().toISOString();
    return { handled: true, payment };
  },
};

export default Payment;

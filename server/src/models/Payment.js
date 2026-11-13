// Owner: Member 5 — Payment model for payment attempt and provider status.
const payments = new Map();

function generatePaymentId() {
  return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

const Payment = {
  create({ orderId, tenantId = 'default', amount, currency = 'USD', method = 'demo_card' }) {
    if (!orderId || amount === undefined) {
      throw new Error('orderId and amount are required to initiate payment');
    }

    const id = generatePaymentId();
    const record = {
      id,
      orderId,
      tenantId,
      amount: Number(amount),
      currency,
      method,
      status: 'pending',
      transactionRef: `tx_${Date.now()}`,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    payments.set(id, record);
    return record;
  },

  get(id) {
    return payments.get(id) || null;
  },

  findByOrderId(orderId) {
    const results = [];
    for (const payment of payments.values()) {
      if (payment.orderId === orderId) {
        results.push(payment);
      }
    }
    return results;
  },

  process(id, { success = true, failureReason = null, providerDetails = {} } = {}) {
    const payment = payments.get(id);
    if (!payment) {
      throw new Error(`Payment with id ${id} not found`);
    }

    payment.status = success ? 'completed' : 'failed';
    payment.failureReason = failureReason;
    payment.providerDetails = {
      ...providerDetails,
      processedAt: new Date().toISOString(),
      mode: 'demo_simulation'
    };
    payment.updatedAt = new Date().toISOString();

    payments.set(id, payment);
    return payment;
  },

  handleWebhook({ paymentId, event = 'payment.succeeded', payload = {} }) {
    const payment = payments.get(paymentId);
    if (!payment) {
      return { handled: false, error: 'Payment not found' };
    }

    if (event === 'payment.succeeded') {
      payment.status = 'completed';
    } else if (event === 'payment.failed') {
      payment.status = 'failed';
      payment.failureReason = payload.reason || 'Webhook reported payment failure';
    }

    payment.updatedAt = new Date().toISOString();
    payments.set(paymentId, payment);
    return { handled: true, payment };
  }
};

export default Payment;


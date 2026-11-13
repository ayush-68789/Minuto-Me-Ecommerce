// Owner: Member 5 — Payment controller for demo payments and webhook callback handling.
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';

export function createPayment(req, res) {
  try {
    const { orderId, tenantId, amount, currency, method } = req.body;
    if (!orderId || amount === undefined) {
      return res.status(400).json({ error: 'orderId and amount are required' });
    }

    const payment = Payment.create({
      orderId,
      tenantId: tenantId || 'default',
      amount,
      currency: currency || 'USD',
      method: method || 'demo_card'
    });

    res.status(201).json({ payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export function processPayment(req, res) {
  try {
    const { id } = req.params;
    const { simulateSuccess = true, failureReason, providerDetails = {} } = req.body;

    const payment = Payment.process(id, {
      success: simulateSuccess !== false,
      failureReason,
      providerDetails
    });

    // If payment is tied to an existing order, update the order
    if (payment.orderId && payment.orderId !== 'pending_checkout') {
      try {
        Order.updatePayment(payment.orderId, {
          paymentId: payment.id,
          method: payment.method,
          status: payment.status
        });
      } catch (err) {
        console.warn(`Could not update order ${payment.orderId}: ${err.message}`);
      }
    }

    res.status(200).json({
      message: payment.status === 'completed' ? 'Payment processed successfully' : 'Payment failed',
      payment
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export function getPayment(req, res) {
  try {
    const { id } = req.params;
    const payment = Payment.get(id);

    if (!payment) {
      return res.status(404).json({ error: `Payment with id ${id} not found` });
    }

    res.status(200).json({ payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function handleWebhook(req, res) {
  try {
    const { paymentId, event, payload } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required in webhook body' });
    }

    const result = Payment.handleWebhook({ paymentId, event, payload });
    if (!result.handled) {
      return res.status(404).json({ error: result.error });
    }

    if (result.payment?.orderId) {
      try {
        Order.updatePayment(result.payment.orderId, {
          paymentId: result.payment.id,
          status: result.payment.status
        });
      } catch (err) {
        console.warn(`Webhook: Could not update order ${result.payment.orderId}: ${err.message}`);
      }
    }

    res.status(200).json({ message: 'Webhook received and processed', payment: result.payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


// Owner: M5
// No payment gateway is wired up yet. Until one is (Razorpay/Stripe, with server-side
// signature verification), online payments can only be simulated outside production.
import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { httpError } from './cartController.js';

// POST /api/payments/:orderId/simulate  { email }
const simulatePayment = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw httpError(501, 'Online payments are not available yet');
    }

    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    if (!mongoose.isValidObjectId(req.params.orderId) || !email) throw httpError(404, 'Order not found');

    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.orderId,
        'customerInfo.email': email,
        status: 'pending',
        'payment.method': 'online',
        'payment.status': { $in: ['unpaid', 'failed'] },
      },
      {
        $set: {
          status: 'confirmed',
          'payment.status': 'paid',
          'payment.transactionId': `SIM-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        },
      },
      { new: true }
    );
    if (!order) throw httpError(400, 'This order cannot be paid online');

    res.json({ order });
  } catch (err) {
    next(err);
  }
};

export { simulatePayment };

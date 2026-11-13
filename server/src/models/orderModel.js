// SHARED MODEL. If a teammate already created an Order model, delete this file and
// change the import of orderModel.js in checkoutController.js and webhookController.js.
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  items: [{ productId: mongoose.Schema.Types.ObjectId, qty: Number, price: Number }],
  total: { type: Number, required: true }, // paise
  status: { type: String, enum: ['pending', 'reserved', 'paid', 'fulfilled', 'cancelled', 'refunded'], default: 'pending' },
  idempotencyKey: String,
  reservationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }],
  razorpayOrderId: { type: String, index: true },
  paymentId: String,
  paidAt: Date,
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', schema);

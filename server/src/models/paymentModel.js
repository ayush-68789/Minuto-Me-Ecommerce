import mongoose from 'mongoose';

// Second line of defence: one provider payment ID can only ever exist once.
const schema = new mongoose.Schema({
  tenantId: String,
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  providerPaymentId: { type: String, required: true, unique: true },
  amount: Number,
  status: { type: String, default: 'captured' },
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model('Payment', schema);

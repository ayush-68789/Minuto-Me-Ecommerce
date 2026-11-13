import mongoose from 'mongoose';

// Webhook inbox: every provider event is stored once, keyed by its event ID.
const schema = new mongoose.Schema({
  provider: { type: String, default: 'razorpay' },
  eventId: { type: String, required: true },
  eventType: String,
  payload: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['received', 'processed', 'failed'], default: 'received' },
  error: String,
}, { timestamps: true });

schema.index({ provider: 1, eventId: 1 }, { unique: true });

export default mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', schema);

import mongoose from 'mongoose';

const idempotencySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    requestHash: { type: String, required: true },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed'],
      default: 'in_progress',
      index: true,
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    response: { type: mongoose.Schema.Types.Mixed },
    lockedUntil: { type: Date, default: () => new Date(Date.now() + 30000), index: true },
    attempt: { type: Number, default: 1 },
    // Do not use a TTL index: it could delete a still-running checkout. Cleanup
    // must follow an explicit state transition.
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

idempotencySchema.index({ store: 1, key: 1 }, { unique: true });

export default mongoose.model('Idempotency', idempotencySchema);

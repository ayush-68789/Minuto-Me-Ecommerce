import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  userId: { type: String, required: true },
  key: { type: String, required: true },
  requestHash: { type: String, required: true },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  responseStatus: Number,
  responseBody: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 }, // auto-delete after 24h
});

// The unique index is the lock: only one of N parallel inserts can win.
schema.index({ tenantId: 1, userId: 1, key: 1 }, { unique: true });

export default mongoose.models.IdempotencyKey || mongoose.model('IdempotencyKey', schema);

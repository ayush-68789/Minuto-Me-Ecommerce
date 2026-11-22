import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: { type: String, default: '' },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: { type: String, required: true },
    resourceId: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ store: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);

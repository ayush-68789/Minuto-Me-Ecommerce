import mongoose from 'mongoose';

const reservationLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    requestedQuantity: { type: Number, required: true, min: 1 },
    deductedQuantity: { type: Number, default: 0, min: 0 },
    restockedQuantity: { type: Number, default: 0, min: 0 },
    isDeducted: { type: Boolean, default: false },
    isRestocked: { type: Boolean, default: false },
  },
  { _id: false }
);

const inventoryReservationSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    idempotencyKey: { type: String, default: null, index: true },
    lines: { type: [reservationLineSchema], required: true },
    status: {
      type: String,
      enum: ['pending', 'reserved', 'compensating', 'completed', 'compensated', 'failed_compensation'],
      default: 'pending',
      index: true,
    },
    lockedUntil: { type: Date, default: () => new Date(Date.now() + 60000), index: true },
    failureReason: { type: String, default: '' },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

inventoryReservationSchema.index({ store: 1, createdAt: -1 });
inventoryReservationSchema.index({ status: 1, lockedUntil: 1 });

export default mongoose.model('InventoryReservation', inventoryReservationSchema);

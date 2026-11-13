// Reservation = "these units are held for this customer until expiresAt".
// Life cycle (only these two moves are allowed):
//   reserved -> confirmed   (checkout/payment succeeded)
//   reserved -> expired     (time ran out; stock is given back)
import mongoose from 'mongoose';

export const RESERVATION_STATUS = {
  RESERVED: 'reserved',
  CONFIRMED: 'confirmed',
  EXPIRED: 'expired',
};

const reservationSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    // customerId / tenantId are optional until auth + tenant middleware are merged.
    customerId: { type: mongoose.Schema.Types.ObjectId, index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, index: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.RESERVED,
      required: true,
    },
    expiresAt: { type: Date, required: true },
    confirmedAt: { type: Date },
    expiredAt: { type: Date },
  },
  { timestamps: true }
);

// The sweeper searches by (status, expiresAt), so index exactly that.
reservationSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);

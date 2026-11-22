// Owner: M5
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    restocked: { type: Boolean, default: false },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    customerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    shippingAddress: {
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },

    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },

    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'confirmed',
    },

    cancellationState: {
      type: String,
      enum: ['none', 'in_progress', 'completed', 'failed'],
      default: 'none',
      index: true,
    },

    metadata: {
      idempotencyKey: { type: String, index: true },
      reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryReservation', index: true },
      quoteHash: { type: String },
    },
  },
  { timestamps: true }
);

orderSchema.index({ store: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);

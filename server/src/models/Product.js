// Owner: M4  (read by M3 storefront and M5 cart/orders)
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // Multi-tenancy: EVERY query must filter by store
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },

    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 }, // optional "original price"
    images: [{ type: String }], // image URLs
    category: { type: String, default: 'General', trim: true },
    stock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true }, // hide from storefront without deleting
  },
  { timestamps: true }
);

productSchema.index({ store: 1, category: 1 });

export default mongoose.model('Product', productSchema);

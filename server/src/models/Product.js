// PLACEHOLDER Product model.
//
// OWNERSHIP.md says Member 4 owns the real Product schema (with input from Member 3).
// This file exists ONLY so the inventory module can run before that schema is merged.
// When Member 4's Product.js arrives, keep THEIR file and just make sure it has:
//   - stock    : Number (whole units, never negative)
//   - tenantId : ObjectId (optional until the tenant convention is final)
// The inventory module touches nothing else on the product.
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '', maxlength: 1000 },
    category: { type: String, default: 'Other', maxlength: 60 },
    imageUrl: { type: String, default: '' },
    // Units available to buy. The inventory module changes this ONLY with atomic $inc.
    stock: { type: Number, required: true, min: 0, default: 0 },
    tenantId: { type: mongoose.Schema.Types.ObjectId, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model('Product', productSchema);

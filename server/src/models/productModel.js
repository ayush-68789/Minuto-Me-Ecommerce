// SHARED MODEL. If a teammate already created a Product model, delete this file and
// change the import of productModel.js in checkoutController.js.
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, required: true }, // rupees
  stock: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', schema);

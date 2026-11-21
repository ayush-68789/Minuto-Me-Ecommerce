// Owner: M2 - Products & Dashboard
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    images: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Keep imageUrl and images array in sync
productSchema.pre('save', function (next) {
  if (this.imageUrl && (!this.images || this.images.length === 0)) {
    this.images = [this.imageUrl];
  } else if (this.images && this.images.length > 0 && !this.imageUrl) {
    this.imageUrl = this.images[0];
  }
  if (typeof next === 'function') next();
});

export default mongoose.models.Product || mongoose.model('Product', productSchema);

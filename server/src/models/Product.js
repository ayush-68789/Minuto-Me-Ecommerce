// Owner: M4 (read by M3 storefront and M5 cart/orders, managed by M3 dashboard)
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // Multi-tenancy: EVERY query must filter by store
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
      max: [100000000, 'Price exceeds maximum allowed limit'],
    },
    comparePrice: {
      type: Number,
      min: [0, 'Compare price must be non-negative'],
      max: [100000000, 'Compare price exceeds maximum allowed limit'],
      default: null,
    },
    images: {
      type: [{ type: String }],
      validate: [
        (val) => Array.isArray(val) && val.length <= 20,
        'Cannot have more than 20 product images',
      ],
      default: [],
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
      max: [1000000, 'Stock cannot exceed 1,000,000 units'],
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer quantity',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for inventory state
productSchema.virtual('isLowStock').get(function () {
  return typeof this.stock === 'number' && this.stock > 0 && this.stock <= 5;
});

productSchema.virtual('isOutOfStock').get(function () {
  return typeof this.stock === 'number' && this.stock === 0;
});

// Indexes for performant filtering and sorting within a store tenant
productSchema.index({ store: 1, category: 1 });
productSchema.index({ store: 1, isActive: 1 });
productSchema.index({ store: 1, stock: 1 });
productSchema.index({ store: 1, createdAt: -1 });

export default mongoose.model('Product', productSchema);

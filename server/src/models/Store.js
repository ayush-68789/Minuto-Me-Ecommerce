// Owner: M2 - Products & Dashboard
import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    logo: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active',
    },
    settings: {
      contactEmail: { type: String, trim: true, default: '' },
      contactPhone: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      theme: { type: String, default: 'modern' },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Store || mongoose.model('Store', storeSchema);

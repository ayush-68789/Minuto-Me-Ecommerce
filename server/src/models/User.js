// Owner: M1
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: { type: String, default: '' },
    shippingAddress: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['client', 'customer', 'admin'],
        default: 'client'
    },
    // First store for legacy clients. Store ownership is tracked by Store.owner.
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        default: null
    },
    // Storefront customers belong to one exported store; this is separate from the owner's store reference above.
    customerStore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Owners remain unique by role, while separate storefront customer accounts may reuse an email.
userSchema.index({ email: 1, role: 1, customerStore: 1 }, { unique: true, name: 'email_role_customerStore_unique' });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);

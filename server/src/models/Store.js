// Owner: M1  (schema agreed with M2, M3, M4 -- change via PR only)
import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Basic info (M2 form)
    businessName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // used in /store/:slug
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 1000 },

    // Branding (applied dynamically by M3's storefront)
    branding: {
      logo: { type: String, default: '' }, // image URL
      primaryColor: { type: String, default: '#111827' },
      secondaryColor: { type: String, default: '#f3f4f6' },
      accentColor: { type: String, default: '#2563eb' },
      banners: [{ type: String }], // image URLs
    },

    // Settings
    currency: { type: String, default: 'INR' }, // ISO code, e.g. INR, USD
    contact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
    },

    // Features the client asked for
    features: {
      reviews: { type: Boolean, default: false },
      wishlist: { type: Boolean, default: false },
      coupons: { type: Boolean, default: false },
    },

    // Storefront design (M2 studio). Values are sanitized in validators/storeValidator.js
    template: { type: String, default: 'modern', maxlength: 30 },
    theme: {
      preset: { type: String, default: 'aurora' },
      mode: { type: String, default: 'light' }, // light | tinted | dark
      font: { type: String, default: 'jakarta' },
      radius: { type: String, default: 'soft' },
      buttonStyle: { type: String, default: 'solid' },
      cardStyle: { type: String, default: 'clean' },
      heroLayout: { type: String, default: 'image' },
      heroHeight: { type: String, default: 'standard' },
      navStyle: { type: String, default: 'left' },
      imageRatio: { type: String, default: 'square' },
      animation: { type: String, default: 'subtle' },
      pattern: { type: String, default: 'none' },
      gridColumns: { type: Number, default: 4, min: 2, max: 5 },
      mobileColumns: { type: Number, default: 2, min: 1, max: 2 },
      showAnnouncement: { type: Boolean, default: false },
      stickyNav: { type: Boolean, default: true },
      sections: [{ _id: false, key: String, on: Boolean }],
      content: {
        heroTitle: String,
        heroSubtitle: String,
        ctaText: String,
        announcement: String,
        marquee: String,
        promoTitle: String,
        promoText: String,
        aboutTitle: String,
        aboutText: String,
        newsletterTitle: String,
        testimonials: [{ _id: false, name: String, text: String, rating: Number }],
      },
    },
    social: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      youtube: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
    // Newsletter sign-ups from the storefront (never sent to the public storefront API)
    subscribers: { type: [{ _id: false, email: String, createdAt: { type: Date, default: Date.now } }], select: false },

    status: { type: String, enum: ['draft', 'active', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Store', storeSchema);

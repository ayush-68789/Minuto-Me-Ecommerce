// Owner: M2 - Products & Dashboard (branding, theme and onboarding fields: Member 5 - Onboarding & Studio)
import mongoose from 'mongoose';

export const STORE_TEMPLATES = ['modern', 'bold', 'minimal', 'luxe', 'playful', 'neon', 'editorial', 'organic'];

const HEX = /^#[\da-f]{6}$/i;
const hexColor = (fallback) => ({
  type: String,
  trim: true,
  default: fallback,
  validate: { validator: (v) => !v || HEX.test(v), message: 'Colors must be 6-digit hex values like #4f46e5' },
});

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // The storefront, cart and orders read businessName; it is kept in sync with name
    businessName: {
      type: String,
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

    // ---- Studio: everything the storefront template renders (see client/src/theme/themeConfig.js) ----
    template: {
      type: String,
      enum: STORE_TEMPLATES,
      default: 'modern',
    },
    branding: {
      logo: { type: String, trim: true, default: '' },
      primaryColor: hexColor('#4f46e5'),
      secondaryColor: hexColor('#eef2ff'),
      accentColor: hexColor('#f97316'),
      banners: {
        type: [String],
        default: [],
        validate: { validator: (v) => v.length <= 6, message: 'A store can have at most 6 banner images' },
      },
    },
    // Free-form design options (mode, font, radius, sections, content...). The client resolves unknown
    // or missing values to defaults, so old stores keep rendering as the studio grows.
    theme: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    contact: {
      email: { type: String, trim: true, lowercase: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
    },
    social: {
      instagram: { type: String, trim: true, default: '' },
      facebook: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
      whatsapp: { type: String, trim: true, default: '' },
    },
    features: {
      wishlist: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
      payments: { type: Boolean, default: false },
    },
    onboarding: {
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null },
    },
    // Newsletter sign-ups from the storefront. Never sent to the public store payload.
    subscribers: {
      type: [
        {
          _id: false,
          email: { type: String, trim: true, lowercase: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false,
    },
  },
  { timestamps: true }
);

// Keep the legacy dashboard fields (name/logo/banner/settings) and the studio fields pointing at the same data
storeSchema.pre('validate', function syncLegacyFields() {
  if (this.isModified('businessName') && this.businessName) this.name = this.businessName;
  else if (this.name) this.businessName = this.name;

  if (this.isModified('branding.logo')) this.logo = this.branding.logo;
  else if (this.logo && !this.branding?.logo) this.branding.logo = this.logo;

  if (this.isModified('branding.banners')) this.banner = this.branding.banners[0] || '';
  else if (this.banner && !this.branding?.banners?.length) this.branding.banners = [this.banner];

  if (this.isModified('contact')) {
    this.settings.contactEmail = this.contact.email;
    this.settings.contactPhone = this.contact.phone;
    this.settings.address = this.contact.address;
  } else if (this.isModified('settings') || this.isNew) {
    this.contact.email = this.settings.contactEmail || this.contact.email;
    this.contact.phone = this.settings.contactPhone || this.contact.phone;
    this.contact.address = this.settings.address || this.contact.address;
  }

  if (this.isModified('template')) this.settings.theme = this.template;
  else if (STORE_TEMPLATES.includes(this.settings?.theme)) this.template = this.settings.theme;
});

export default mongoose.models.Store || mongoose.model('Store', storeSchema);

// Owner: M2 - Products & Dashboard (onboarding + studio: Member 5 - Onboarding & Studio)
import Store, { STORE_TEMPLATES } from '../models/Store.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { deleteByUrl } from '../config/cloudinary.js';

/**
 * Generate a clean URL-friendly slug
 */
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/_/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');

// /store/demo is the built-in demo store; the rest would collide with app routes
const RESERVED_SLUGS = new Set(['demo', 'admin', 'api', 'dashboard', 'studio', 'login', 'signup', 'create-store', 'me', 'new', 'store', 'stores']);

const isSlugTaken = async (slug, exceptId) =>
  RESERVED_SLUGS.has(slug) || Boolean(await Store.exists({ slug, ...(exceptId ? { _id: { $ne: exceptId } } : {}) }));

const uniqueSlug = async (base, exceptId) => {
  const root = base || 'store';
  let candidate = root;
  let counter = 1;
  while (await isSlugTaken(candidate, exceptId)) {
    candidate = `${root}-${counter++}`;
  }
  return candidate;
};

/* ---------------- studio field sanitizing ---------------- */

const HEX = /^#[\da-f]{6}$/i;
const MAX_THEME_BYTES = 64 * 1024;
const str = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
const imageUrl = (v) => {
  const s = str(v, 1000);
  if (s === undefined) return undefined;
  return s === '' || /^https?:\/\//i.test(s) || s.startsWith('/uploads/') ? s : undefined;
};

// Multipart requests send nested objects as JSON strings
const parseJson = (v) => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Drop Mongo operator-looking keys and anything that isn't JSON data
const cleanJson = (value, depth = 0) => {
  if (depth > 6) return undefined;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => cleanJson(v, depth + 1)).filter((v) => v !== undefined);
  if (isPlainObject(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      const cleaned = cleanJson(v, depth + 1);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  if (typeof value === 'string') return value.slice(0, 2000);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return undefined;
};

const pickBranding = (raw, current = {}) => {
  const b = parseJson(raw);
  if (!isPlainObject(b)) return undefined;
  const next = { ...current };
  const logo = imageUrl(b.logo);
  if (logo !== undefined) next.logo = logo;
  for (const key of ['primaryColor', 'secondaryColor', 'accentColor']) {
    if (typeof b[key] === 'string' && HEX.test(b[key].trim())) next[key] = b[key].trim().toLowerCase();
  }
  if (Array.isArray(b.banners)) next.banners = b.banners.map(imageUrl).filter(Boolean).slice(0, 6);
  return next;
};

const pickGroup = (raw, keys, current = {}, max = 300) => {
  const g = parseJson(raw);
  if (!isPlainObject(g)) return undefined;
  const next = { ...current };
  for (const key of keys) {
    const v = str(g[key], max);
    if (v !== undefined) next[key] = v;
  }
  return next;
};

const pickFeatures = (raw, current = {}) => {
  const f = parseJson(raw);
  if (!isPlainObject(f)) return undefined;
  const next = { ...current };
  for (const key of ['wishlist', 'reviews', 'payments']) {
    if (typeof f[key] === 'boolean') next[key] = f[key];
  }
  return next;
};

const pickTheme = (raw) => {
  const t = cleanJson(parseJson(raw));
  if (!isPlainObject(t)) return undefined;
  if (Buffer.byteLength(JSON.stringify(t)) > MAX_THEME_BYTES) {
    const err = new Error('Theme settings are too large');
    err.status = 400;
    throw err;
  }
  return t;
};

const plain = (sub) => (sub?.toObject ? sub.toObject() : sub || {});

/**
 * Apply every studio field present in the body onto a store document.
 */
const applyStudioFields = (store, body) => {
  if (body.businessName !== undefined && str(body.businessName, 100)) store.businessName = str(body.businessName, 100);
  if (STORE_TEMPLATES.includes(body.template)) store.template = body.template;

  const branding = pickBranding(body.branding, plain(store.branding));
  if (branding) store.branding = branding;

  const contact = pickGroup(body.contact, ['email', 'phone', 'address'], plain(store.contact));
  if (contact) store.contact = contact;

  const social = pickGroup(body.social, ['instagram', 'facebook', 'twitter', 'youtube', 'whatsapp'], plain(store.social), 200);
  if (social) store.social = social;

  const features = pickFeatures(body.features, plain(store.features));
  if (features) store.features = features;

  const theme = pickTheme(body.theme);
  if (theme) {
    store.theme = theme;
    store.markModified('theme');
  }
};

// Everything a storefront or studio needs; never owner internals or subscriber emails
const publicStore = (store) => ({
  _id: store._id,
  id: store._id,
  name: store.name,
  businessName: store.businessName || store.name,
  slug: store.slug,
  description: store.description,
  logo: store.logo,
  banner: store.banner,
  category: store.category,
  currency: store.currency,
  status: store.status,
  settings: store.settings,
  template: store.template,
  branding: store.branding,
  theme: store.theme || {},
  contact: store.contact,
  social: store.social,
  features: store.features,
  createdAt: store.createdAt,
});

/**
 * Create a new store for the authenticated merchant
 */
export const createStore = async (req, res, next) => {
  try {
    const {
      name: rawName,
      businessName,
      slug: customSlug,
      description = '',
      category = 'General',
      currency = 'USD',
      logo = '',
      banner = '',
    } = req.body;
    const settings = parseJson(req.body.settings) || {};
    const name = String(businessName || rawName).trim();

    const slug = await uniqueSlug(slugify(customSlug || name));

    const store = new Store({
      name,
      businessName: name,
      slug,
      description: String(description).trim(),
      category: String(category).trim(),
      currency: String(currency).toUpperCase(),
      logo,
      banner,
      owner: req.user._id,
      settings: {
        contactEmail: settings.contactEmail || req.user.email,
        contactPhone: settings.contactPhone || '',
        address: settings.address || '',
        theme: settings.theme || 'modern',
      },
    });

    applyStudioFields(store, req.body);
    if (!store.contact.email) store.contact.email = store.settings.contactEmail;

    // The onboarding wizard creates the store on its last step
    if (req.body.onboardingComplete === true || req.body.onboardingComplete === 'true') {
      store.onboarding = { completed: true, completedAt: new Date() };
    }

    await store.save();

    // Link user to their primary store
    await User.findByIdAndUpdate(req.user._id, { store: store._id });
    req.user.store = store._id;

    return res.status(201).json({
      success: true,
      store,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'A store with this name or slug already exists',
        success: false,
      });
    }
    if (err.name === 'ValidationError' || err.status === 400) {
      return res.status(400).json({ message: err.message, success: false });
    }
    return next(err);
  }
};

/**
 * Check whether a slug is free (used live by the onboarding wizard)
 * GET /api/stores/check-slug?slug=my-shop[&storeId=...]
 */
export const checkSlug = async (req, res, next) => {
  try {
    const slug = slugify(String(req.query.slug || ''));
    if (!slug) {
      return res.status(400).json({ message: 'Enter a store address', success: false });
    }
    if (slug.length > 60) {
      return res.status(400).json({ message: 'Store address must be 60 characters or fewer', success: false });
    }

    const exceptId = /^[a-f\d]{24}$/i.test(String(req.query.storeId || '')) ? req.query.storeId : undefined;
    const taken = await isSlugTaken(slug, exceptId);

    return res.status(200).json({
      success: true,
      slug,
      available: !taken,
      suggestion: taken ? await uniqueSlug(slug, exceptId) : slug,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Upload one store image (logo or banner) and return its URL
 * POST /api/stores/upload  (multipart, field "image")
 */
export const uploadStoreImage = async (req, res) => {
  if (!req.body?.image || typeof req.body.image !== 'string') {
    return res.status(400).json({ message: 'Choose an image to upload', success: false });
  }
  return res.status(201).json({ success: true, url: req.body.image });
};

/**
 * Get the current user's active store
 */
export const getMyStore = async (req, res, next) => {
  try {
    let store = null;

    if (req.user.store) {
      store = await Store.findById(req.user.store);
    }

    if (!store) {
      store = await Store.findOne({ owner: req.user._id });
    }

    if (!store) {
      return res.status(404).json({
        message: 'No store found for this account',
        success: false,
      });
    }

    return res.status(200).json({
      success: true,
      store,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get store by ID
 */
export const getStore = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found', success: false });
    }

    return res.status(200).json({
      success: true,
      store,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get store by public slug
 */
export const getStoreBySlug = async (req, res, next) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug.toLowerCase() });
    if (!store) {
      return res.status(404).json({ message: 'Store not found', success: false });
    }

    return res.status(200).json({
      success: true,
      store: publicStore(store),
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Update store settings and branding
 */
export const updateStore = async (req, res, next) => {
  try {
    const store = req.store || (await Store.findById(req.params.id));
    if (!store) {
      return res.status(404).json({ message: 'Store not found', success: false });
    }

    const {
      name,
      slug,
      description,
      category,
      currency,
      logo,
      banner,
      status,
    } = req.body;
    const settings = parseJson(req.body.settings);
    const previousLogo = store.branding?.logo;

    if (name !== undefined) store.name = name.trim();
    if (description !== undefined) store.description = description.trim();
    if (category !== undefined) store.category = category.trim();
    if (currency !== undefined) store.currency = currency.toUpperCase();
    if (logo !== undefined) store.logo = logo;
    if (banner !== undefined) store.banner = banner;
    if (status !== undefined) store.status = status;

    if (slug !== undefined && slugify(slug) && slugify(slug) !== store.slug) {
      const nextSlug = slugify(slug);
      if (await isSlugTaken(nextSlug, store._id)) {
        return res.status(409).json({ message: 'That store address is already taken', success: false });
      }
      store.slug = nextSlug;
    }

    if (settings && typeof settings === 'object') {
      store.settings = {
        ...store.settings?.toObject(),
        ...settings,
      };
    }

    applyStudioFields(store, req.body);

    await store.save();

    // Clean up a replaced Cloudinary logo (best effort)
    if (previousLogo && previousLogo !== store.branding?.logo) deleteByUrl(previousLogo);

    return res.status(200).json({
      success: true,
      store,
    });
  } catch (err) {
    if (err.name === 'ValidationError' || err.status === 400) {
      return res.status(400).json({ message: err.message, success: false });
    }
    return next(err);
  }
};

/**
 * Delete a store and associated products
 */
export const deleteStore = async (req, res, next) => {
  try {
    const store = req.store || (await Store.findById(req.params.id));
    if (!store) {
      return res.status(404).json({ message: 'Store not found', success: false });
    }

    await Product.deleteMany({ store: store._id });
    await Store.findByIdAndDelete(store._id);
    await User.findByIdAndUpdate(store.owner, { $unset: { store: 1 } });

    return res.status(200).json({
      success: true,
      message: 'Store and related products deleted successfully',
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  createStore,
  checkSlug,
  uploadStoreImage,
  getMyStore,
  getStore,
  getStoreBySlug,
  updateStore,
  deleteStore,
};

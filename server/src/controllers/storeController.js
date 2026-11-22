// Owner: M1
import Store from '../models/Store.js';
import User from '../models/User.js';
import { sanitizeSocial, sanitizeTheme } from '../validators/storeValidator.js';
import { logAudit } from '../utils/auditLogger.js';
import deleteStoreData from '../utils/deleteStoreData.js';

const writableFields = ['businessName', 'category', 'description', 'slug', 'currency', 'template'];
const capTemplate = (u) => { if (typeof u.template === 'string') u.template = u.template.trim().slice(0, 30); return u; };
const nestedFields = {
  branding: ['logo', 'primaryColor', 'secondaryColor', 'accentColor', 'banners'],
  contact: ['email', 'phone', 'address'],
  features: ['reviews', 'wishlist', 'coupons'],
};

function pickStoreFields(input, includeSlug = true) {
  const update = {};
  for (const field of writableFields) {
    if (field !== 'slug' || includeSlug) {
      if (Object.prototype.hasOwnProperty.call(input, field)) update[field] = input[field];
    }
  }
  for (const [group, fields] of Object.entries(nestedFields)) {
    if (!input[group] || typeof input[group] !== 'object' || Array.isArray(input[group])) continue;
    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(input[group], field)) update[`${group}.${field}`] = input[group][field];
    }
  }
  Object.assign(update, designUpdate(input));
  return capTemplate(update);
}

// theme/social as dotted $set paths so a partial update never wipes sibling settings
export function designUpdate(input) {
  const update = {};
  const theme = sanitizeTheme(input.theme);
  if (theme) {
    const { content, ...rest } = theme;
    for (const [k, v] of Object.entries(rest)) update[`theme.${k}`] = v;
    if (content) for (const [k, v] of Object.entries(content)) update[`theme.content.${k}`] = v;
  }
  const social = sanitizeSocial(input.social);
  if (social) for (const [k, v] of Object.entries(social)) update[`social.${k}`] = v;
  return update;
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const createStore = async (req, res, next) => {
  try {
    const input = req.body || {};
    const values = pickStoreFields(input);
    const baseSlug = normalizeSlug(values.slug || values.businessName);
    if (!values.businessName || !values.category || !baseSlug) {
      return res.status(400).json({ message: 'Business name and category are required' });
    }
    if (baseSlug.length > 80) return res.status(400).json({ message: 'Store URL must be 80 characters or fewer' });

    // Keep the requested URL when available, otherwise add a number. The unique
    // index is the final authority, so retry duplicate-key races between owners.
    let store;
    for (let suffix = 1; suffix <= 10000; suffix += 1) {
      const tail = suffix === 1 ? '' : `-${suffix}`;
      const candidate = `${baseSlug.slice(0, 80 - tail.length)}${tail}`;
      try {
        store = await Store.create({ ...values, slug: candidate, owner: req.user._id });
        break;
      } catch (err) {
        const isSlugCollision = err.code === 11000 && (err.keyPattern?.slug || err.keyValue?.slug);
        if (isSlugCollision) continue;
        throw err;
      }
    }
    if (!store) return res.status(409).json({ message: 'Could not find an available store URL. Please try again.' });
    await User.updateOne({ _id: req.user._id, store: null }, { $set: { store: store._id } });
    req.store = store;

    await logAudit({
      req,
      storeId: store._id,
      action: 'STORE_CREATE',
      resourceType: 'Store',
      resourceId: store._id,
      details: { businessName: store.businessName, slug: store.slug },
    });

    return res.status(201).json({ store });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'This store URL is already in use' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return next(err);
  }
};

export const getMyStore = async (req, res, next) => {
  try {
    const store = await resolveMyStore(req);
    if (!store) return res.status(404).json({ message: 'Store not found' });
    return res.json({ store });
  } catch (err) {
    return next(err);
  }
};

export const getMyStores = async (req, res, next) => {
  try {
    const stores = await Store.find({ owner: req.user._id })
      .select('businessName slug category currency status branding createdAt updatedAt')
      .sort({ createdAt: 1 });
    return res.json({ stores });
  } catch (err) {
    return next(err);
  }
};

export async function resolveMyStore(req) {
  const requestedId = req.get('x-store-id');
  if (requestedId) {
    if (!/^[a-f\d]{24}$/i.test(requestedId)) return null;
    return Store.findOne({ _id: requestedId, owner: req.user._id });
  }
  if (req.user.store) {
    const primaryStore = await Store.findOne({ _id: req.user.store, owner: req.user._id });
    if (primaryStore) return primaryStore;
  }
  return Store.findOne({ owner: req.user._id }).sort({ createdAt: 1 });
}

export const updateMyStore = async (req, res, next) => {
  try {
    const update = pickStoreFields(req.body || {}, false);
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'Provide at least one supported store field to update' });
    }
    const current = await resolveMyStore(req);
    const store = current && await Store.findOneAndUpdate(
      { _id: current._id, owner: req.user._id }, { $set: update }, { new: true, runValidators: true }
    );
    if (!store) return res.status(404).json({ message: 'Store not found' });

    await logAudit({
      req,
      storeId: store._id,
      action: 'STORE_UPDATE',
      resourceType: 'Store',
      resourceId: store._id,
      details: update,
    });

    return res.json({ store });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'This store URL is already in use' });
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
    return next(err);
  }
};

export const deleteMyStore = async (req, res, next) => {
  try {
    const store = await resolveMyStore(req);
    if (!store) return res.status(404).json({ message: 'Store not found' });
    const storeId = store._id;
    await deleteStoreData(storeId);
    const nextStore = await Store.findOne({ owner: req.user._id }).sort({ createdAt: 1 });
    await User.updateOne({ _id: req.user._id }, { $set: { store: nextStore?._id || null } });
    return res.json({ success: true, message: 'Store and its data were deleted', nextStore: nextStore || null });
  } catch (err) {
    return next(err);
  }
};

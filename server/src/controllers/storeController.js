// Owner: M2 - Products & Dashboard
import Store from '../models/Store.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

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
    .replace(/--+/g, '-');

/**
 * Create a new store for the authenticated merchant
 */
export const createStore = async (req, res, next) => {
  try {
    const {
      name,
      slug: customSlug,
      description = '',
      category = 'General',
      currency = 'USD',
      logo = '',
      banner = '',
      settings = {},
    } = req.body;

    const baseSlug = customSlug ? slugify(customSlug) : slugify(name);
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await Store.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const store = await Store.create({
      name: name.trim(),
      slug: uniqueSlug,
      description: description.trim(),
      category: category.trim(),
      currency: currency.toUpperCase(),
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
    return next(err);
  }
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
    const store = await Store.findOne({ slug: req.params.slug });
    if (!store) {
      return res.status(404).json({ message: 'Store not found', success: false });
    }

    return res.status(200).json({
      success: true,
      store: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        banner: store.banner,
        category: store.category,
        currency: store.currency,
        settings: store.settings,
      },
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
      description,
      category,
      currency,
      logo,
      banner,
      status,
      settings,
    } = req.body;

    if (name !== undefined) store.name = name.trim();
    if (description !== undefined) store.description = description.trim();
    if (category !== undefined) store.category = category.trim();
    if (currency !== undefined) store.currency = currency.toUpperCase();
    if (logo !== undefined) store.logo = logo;
    if (banner !== undefined) store.banner = banner;
    if (status !== undefined) store.status = status;

    if (settings && typeof settings === 'object') {
      store.settings = {
        ...store.settings?.toObject(),
        ...settings,
      };
    }

    await store.save();

    return res.status(200).json({
      success: true,
      store,
    });
  } catch (err) {
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
  getMyStore,
  getStore,
  getStoreBySlug,
  updateStore,
  deleteStore,
};

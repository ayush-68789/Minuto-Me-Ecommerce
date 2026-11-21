// Owner: M2 - Products & Dashboard
import Store from '../models/Store.js';
import Product from '../models/Product.js';

/**
 * Ensures the authenticated user owns the store.
 * Checks params (:storeId or :id), header ('x-store-id'), body, or req.user.store.
 */
export const requireStoreOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required', success: false });
    }

    const storeId =
      req.params.storeId ||
      req.params.id ||
      req.headers['x-store-id'] ||
      req.body?.store ||
      req.body?.storeId ||
      req.user.store;

    if (!storeId) {
      return res.status(400).json({ message: 'Store identifier is required', success: false });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found', success: false });
    }

    const isOwner = store.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'You do not have permission to manage this store',
        success: false,
      });
    }

    req.store = store;
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Ensures the authenticated user owns the product.
 * Checks params (:productId or :id).
 */
export const requireProductOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required', success: false });
    }

    const productId = req.params.productId || req.params.id;
    if (!productId) {
      return res.status(400).json({ message: 'Product identifier is required', success: false });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found', success: false });
    }

    const isOwner = product.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'You do not have permission to modify this product',
        success: false,
      });
    }

    req.product = product;
    return next();
  } catch (err) {
    return next(err);
  }
};

export default {
  requireStoreOwner,
  requireProductOwner,
};

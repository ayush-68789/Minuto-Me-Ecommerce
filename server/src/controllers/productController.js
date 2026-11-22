// Owner: M4 (Product Management & Dashboard)
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { validateProduct, validateProductUpdate } from '../validators/productValidator.js';
import { resolveMyStore } from './storeController.js';
import { escapeRegex, parsePagination, buildProductFilter, parseSort } from '../utils/queryHelper.js';
import { logAudit } from '../utils/auditLogger.js';

// The logged-in owner's store -- never trust a store id sent by the client
export const resolveStoreId = async (req) => {
  const store = await resolveMyStore(req);
  return store ? store._id.toString() : null;
};

export const SORT_WHITELIST = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  stock_asc: { stock: 1 },
  stock_desc: { stock: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
};

// GET /api/products
// Fetch all products for a store with filtering, search, and bounded pagination
export const getProducts = async (req, res, next) => {
  try {
    const storeId = await resolveStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found or unauthorized' });
    }

    const { search, category, status, stockStatus, sort } = req.query;
    const { page, limit, skip } = parsePagination(req.query, 20, 100);

    const query = buildProductFilter({
      storeId,
      search,
      category,
      status,
      stockStatus,
    });

    const sortOptions = parseSort(sort, SORT_WHITELIST, SORT_WHITELIST.newest);

    const [products, totalCount, categories] = await Promise.all([
      Product.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
      Product.distinct('category', { store: storeId }),
    ]);

    res.json({
      success: true,
      products,
      total: totalCount,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      categories: categories.filter(Boolean),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
// Fetch single product by id for the store
export const getProductById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const storeId = await resolveStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found or unauthorized' });
    }

    const product = await Product.findOne({ _id: req.params.id, store: storeId });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// POST /api/products
// Create a new product in the store
export const createProduct = async (req, res, next) => {
  try {
    const storeId = await resolveStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found or unauthorized to create a product' });
    }

    const validation = validateProduct(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const productData = {
      ...validation.data,
      store: storeId,
    };

    const product = await Product.create(productData);

    await logAudit({
      req,
      storeId,
      action: 'PRODUCT_CREATE',
      resourceType: 'Product',
      resourceId: product._id,
      details: { name: product.name, price: product.price, stock: product.stock },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id
// Update product by id
export const updateProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Product not found or not owned by this store' });
    }

    const storeId = await resolveStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found or unauthorized' });
    }

    const validation = validateProductUpdate(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, store: storeId },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or not owned by this store' });
    }

    await logAudit({
      req,
      storeId,
      action: 'PRODUCT_UPDATE',
      resourceType: 'Product',
      resourceId: product._id,
      details: validation.data,
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id
// Delete product from store
export const deleteProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Product not found or not owned by this store' });
    }

    const storeId = await resolveStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found or unauthorized' });
    }

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      store: storeId,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or not owned by this store' });
    }

    await logAudit({
      req,
      storeId,
      action: 'PRODUCT_DELETE',
      resourceType: 'Product',
      resourceId: req.params.id,
      details: { name: product.name },
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
      deletedId: req.params.id,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/products/:id/toggle-status
// Quick toggle active / inactive status
export const toggleProductStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const storeId = await resolveStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store not found or unauthorized' });
    }

    const product = await Product.findOne({ _id: req.params.id, store: storeId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();

    await logAudit({
      req,
      storeId,
      action: 'PRODUCT_TOGGLE_STATUS',
      resourceType: 'Product',
      resourceId: product._id,
      details: { isActive: product.isActive },
    });

    res.json({
      success: true,
      message: `Product marked as ${product.isActive ? 'active' : 'inactive'}`,
      product,
    });
  } catch (err) {
    next(err);
  }
};

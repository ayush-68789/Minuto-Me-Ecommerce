// Owner: M4
import Product from '../models/Product.js';
import { validateProduct, validateProductUpdate } from '../validators/productValidator.js';
import { resolveMyStore } from './storeController.js';

// The logged-in owner's store -- never trust a store id sent by the client
const resolveStoreId = async (req) => {
  const store = await resolveMyStore(req);
  return store ? store._id.toString() : null;
};

// GET /api/products
// Fetch all products for a store with filtering, search, and pagination
export const getProducts = async (req, res, next) => {
  try {
    const storeId = await resolveStoreId(req);
    if (!storeId) {
      return res.status(400).json({ message: 'Store ID is required' });
    }

    const { search, category, status, sort, page = 1, limit = 50 } = req.query;

    const query = { store: storeId };

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    if (sort === 'price_desc') sortOptions = { price: -1 };
    if (sort === 'stock_asc') sortOptions = { stock: 1 };
    if (sort === 'stock_desc') sortOptions = { stock: -1 };
    if (sort === 'name_asc') sortOptions = { name: 1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [products, totalCount, categories] = await Promise.all([
      Product.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
      Product.distinct('category', { store: storeId }),
    ]);

    res.json({
      success: true,
      products,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
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
    const storeId = await resolveStoreId(req);
    const product = storeId && (await Product.findOne({ _id: req.params.id, store: storeId }));

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
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
      return res.status(400).json({ message: 'Store ID is required to create a product' });
    }

    const validation = validateProduct(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const productData = {
      ...validation.data,
      store: storeId,
    };

    const product = await Product.create(productData);

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
    const storeId = await resolveStoreId(req);
    if (!storeId) {
      return res.status(400).json({ message: 'Store ID is required' });
    }

    const validation = validateProductUpdate(req.body);
    if (!validation.success) {
      return res.status(400).json({
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
      return res.status(404).json({ message: 'Product not found or not owned by this store' });
    }

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
    const storeId = await resolveStoreId(req);
    if (!storeId) {
      return res.status(400).json({ message: 'Store ID is required' });
    }

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      store: storeId,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or not owned by this store' });
    }

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
    const storeId = await resolveStoreId(req);
    const product = await Product.findOne({ _id: req.params.id, store: storeId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      message: `Product marked as ${product.isActive ? 'active' : 'inactive'}`,
      product,
    });
  } catch (err) {
    next(err);
  }
};

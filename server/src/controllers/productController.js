// Owner: M2 - Products & Dashboard
import Product from '../models/Product.js';
import Store from '../models/Store.js';

/**
 * Create a new product under the user's store
 */
export const createProduct = async (req, res, next) => {
  try {
    const storeId =
      req.store?._id ||
      req.body.store ||
      req.body.storeId ||
      req.headers['x-store-id'] ||
      req.user.store;

    if (!storeId) {
      return res.status(400).json({
        message: 'A store must be selected or created before adding products',
        success: false,
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found', success: false });
    }

    if (store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You do not have permission to add products to this store',
        success: false,
      });
    }

    const {
      name,
      description = '',
      price,
      compareAtPrice = null,
      stock = 0,
      sku = '',
      category = 'General',
      images = [],
      imageUrl = '',
      status = 'active',
      isFeatured = false,
    } = req.body;

    const resolvedImages = Array.isArray(images) && images.length > 0 ? images : imageUrl ? [imageUrl] : [];
    const resolvedImageUrl = imageUrl || (resolvedImages.length > 0 ? resolvedImages[0] : '');

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      stock: Number(stock),
      sku: sku.trim(),
      category: category.trim(),
      images: resolvedImages,
      imageUrl: resolvedImageUrl,
      store: store._id,
      owner: req.user._id,
      status,
      isFeatured: Boolean(isFeatured),
    });

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * List products for merchant dashboard with filtering & pagination
 */
export const getProducts = async (req, res, next) => {
  try {
    const storeId =
      req.query.store ||
      req.query.storeId ||
      req.headers['x-store-id'] ||
      req.user?.store;

    const filter = {};

    if (storeId) {
      filter.store = storeId;
    } else if (req.user && req.user.role !== 'admin') {
      filter.owner = req.user._id;
    }

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { sku: searchRegex },
      ];
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('store', 'name slug'),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id || req.params.productId).populate(
      'store',
      'name slug owner'
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found', success: false });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = req.product || (await Product.findById(req.params.id || req.params.productId));
    if (!product) {
      return res.status(404).json({ message: 'Product not found', success: false });
    }

    const allowed = [
      'name',
      'description',
      'price',
      'compareAtPrice',
      'stock',
      'sku',
      'category',
      'images',
      'imageUrl',
      'status',
      'isFeatured',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'price' || key === 'compareAtPrice' || key === 'stock') {
          product[key] = req.body[key] !== null && req.body[key] !== '' ? Number(req.body[key]) : null;
        } else if (typeof req.body[key] === 'string') {
          product[key] = req.body[key].trim();
        } else {
          product[key] = req.body[key];
        }
      }
    }

    if (req.body.imageUrl && (!product.images || product.images.length === 0)) {
      product.images = [req.body.imageUrl];
    }

    await product.save();

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = req.product || (await Product.findById(req.params.id || req.params.productId));
    if (!product) {
      return res.status(404).json({ message: 'Product not found', success: false });
    }

    await Product.findByIdAndDelete(product._id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      productId: product._id,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Public catalog view for storefront customers
 */
export const getPublicProducts = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    let queryStore = null;

    if (storeId.match(/^[0-9a-fA-F]{24}$/)) {
      queryStore = await Store.findById(storeId);
    } else {
      queryStore = await Store.findOne({ slug: storeId });
    }

    if (!queryStore) {
      return res.status(404).json({ message: 'Store not found', success: false });
    }

    const filter = {
      store: queryStore._id,
      status: 'active',
    };

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    const products = await Product.find(filter).sort({ isFeatured: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      store: {
        id: queryStore._id,
        name: queryStore.name,
        slug: queryStore.slug,
        logo: queryStore.logo,
        banner: queryStore.banner,
        category: queryStore.category,
      },
      products,
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getPublicProducts,
};

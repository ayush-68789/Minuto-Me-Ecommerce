// Owner: M3  — public read-only catalog (no auth required)
// Wraps storefrontRoutes with explicit pagination, search sanitisation,
// and per-product endpoint used by the client storefront.
import mongoose from 'mongoose';
import Store from '../models/Store.js';
import Product from '../models/Product.js';

const httpError = (status, message) => Object.assign(new Error(message), { status });

// Escape user input before passing to $regex to prevent ReDoS
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
};

// GET /api/catalog?slug=&search=&category=&sort=&page=&limit=&minPrice=&maxPrice=&inStock=
export const listProducts = async (req, res, next) => {
  try {
    const slug = String(req.query.slug || '').trim().toLowerCase().slice(0, 80);
    if (!slug) throw httpError(400, 'Store slug is required');

    const store = await Store.findOne({ slug, status: 'active' }).lean();
    if (!store) throw httpError(404, 'Store not found');

    // --- sanitise & clamp query params ---
    const rawSearch   = String(req.query.search   || '').trim().slice(0, 100);
    const rawCategory = String(req.query.category || '').trim().slice(0, 60);
    const rawSort     = String(req.query.sort     || 'newest').trim();
    const page        = Math.min(1000, Math.max(1, parseInt(req.query.page,  10) || 1));
    const limit       = Math.min(100,  Math.max(1, parseInt(req.query.limit, 10) || 24));
    const minPrice    = parseFloat(req.query.minPrice) || 0;
    const maxPrice    = parseFloat(req.query.maxPrice) || Infinity;
    const inStockOnly = req.query.inStock === 'true';

    const sortOptions = SORT_MAP[rawSort] || SORT_MAP.newest;

    // --- build filter ---
    const filter = { store: store._id, isActive: true };

    if (rawSearch) {
      const safe = escapeRegex(rawSearch);
      filter.$or = [
        { name:        { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { category:    { $regex: safe, $options: 'i' } },
      ];
    }

    if (rawCategory && rawCategory !== 'All') {
      filter.category = rawCategory;
    }

    if (minPrice > 0 || isFinite(maxPrice)) {
      filter.price = {};
      if (minPrice > 0) filter.price.$gte = minPrice;
      if (isFinite(maxPrice) && maxPrice > 0) filter.price.$lte = maxPrice;
    }

    if (inStockOnly) {
      filter.stock = { $gt: 0 };
    }

    const skip = (page - 1) * limit;

    const [products, total, categories] = await Promise.all([
      Product.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
      Product.distinct('category', { store: store._id, isActive: true }),
    ]);

    res.json({
      store: {
        id:           store._id,
        businessName: store.businessName,
        slug:         store.slug,
        currency:     store.currency,
        branding:     store.branding,
        description:  store.description,
      },
      products,
      total,
      page,
      pages:      Math.max(1, Math.ceil(total / limit)),
      categories: categories.filter(Boolean).sort(),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/catalog/:productId?slug=
export const getProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) throw httpError(404, 'Product not found');

    const slug = String(req.query.slug || '').trim().toLowerCase().slice(0, 80);
    if (!slug) throw httpError(400, 'Store slug is required');

    const store = await Store.findOne({ slug, status: 'active' }).lean();
    if (!store) throw httpError(404, 'Store not found');

    const product = await Product.findOne({ _id: productId, store: store._id, isActive: true }).lean();
    if (!product) throw httpError(404, 'Product not found');

    // Fetch related products (same category, excluding self, up to 8)
    const related = await Product.find({
      store: store._id,
      isActive: true,
      category: product.category,
      _id: { $ne: product._id },
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    res.json({ product, related });
  } catch (err) {
    next(err);
  }
};

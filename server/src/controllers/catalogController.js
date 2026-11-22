// Owner: M3 -- public read-only catalog (no auth required)
// Server-side search, filtering, sorting and pagination for one store's products,
// plus the single-product endpoint used by the storefront.
import mongoose from 'mongoose';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { escapeRegex, parsePagination } from '../utils/queryHelper.js';

const httpError = (status, message) => Object.assign(new Error(message), { status });

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 60;

export const SORT_MAP = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
  name_asc: { name: 1, _id: 1 },
  name_desc: { name: -1, _id: -1 },
};

// Query strings can arrive as arrays (?q=a&q=b); only the first value counts
const one = (v) => (Array.isArray(v) ? v[0] : v);
const text = (v, max) => (typeof one(v) === 'string' ? one(v).trim().slice(0, max) : '');
const price = (v) => {
  const raw = one(v);
  if (raw === undefined || raw === null || String(raw).trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/**
 * Turn raw query params into a safe Mongo filter + sort + page window.
 * Pure (no DB access) so it can be unit tested.
 */
export function buildCatalogQuery(query = {}, storeId) {
  const search = text(query.search ?? query.q, 100);
  const category = text(query.category, 60);
  const sortKey = text(query.sort, 20);
  const { page, limit, skip } = parsePagination(query, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  const filter = { store: storeId, isActive: true };

  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { category: { $regex: safe, $options: 'i' } },
    ];
  }

  if (category && category !== 'All') filter.category = category;

  let minPrice = price(query.minPrice);
  let maxPrice = price(query.maxPrice);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  if (minPrice || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  if (one(query.inStock) === 'true') filter.stock = { $gt: 0 };

  const sort = Object.hasOwn(SORT_MAP, sortKey) ? SORT_MAP[sortKey] : SORT_MAP.newest;

  return { filter, sort, page, limit, skip, search, category, sortKey: Object.hasOwn(SORT_MAP, sortKey) ? sortKey : 'newest' };
}

/** Add reviewCount + averageRating to lean product docs (one aggregate for the whole page). */
export async function attachRatings(products) {
  if (!products.length) return products;
  const rows = await Review.aggregate([
    { $match: { product: { $in: products.map((p) => p._id) } } },
    { $group: { _id: '$product', reviewCount: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
  ]);
  const byId = new Map(rows.map((r) => [r._id.toString(), r]));
  for (const p of products) {
    const r = byId.get(p._id.toString());
    p.reviewCount = r?.reviewCount || 0;
    p.averageRating = r?.averageRating || 0;
  }
  return products;
}

const findActiveStore = async (rawSlug) => {
  const slug = text(rawSlug, 80).toLowerCase();
  if (!slug) throw httpError(400, 'Store slug is required');
  const store = await Store.findOne({ slug, status: 'active' }).select('_id').lean();
  if (!store) throw httpError(404, 'Store not found');
  return store;
};

// GET /api/catalog?slug=&search=&category=&sort=&page=&limit=&minPrice=&maxPrice=&inStock=
export const listProducts = async (req, res, next) => {
  try {
    const store = await findActiveStore(req.query.slug);
    const q = buildCatalogQuery(req.query, store._id);

    const [products, total, categories, priceRange] = await Promise.all([
      Product.find(q.filter).sort(q.sort).skip(q.skip).limit(q.limit).lean(),
      Product.countDocuments(q.filter),
      Product.distinct('category', { store: store._id, isActive: true }),
      Product.aggregate([
        { $match: { store: store._id, isActive: true } },
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
      ]),
    ]);
    await attachRatings(products);

    const pages = Math.max(1, Math.ceil(total / q.limit));
    res.json({
      products,
      total,
      page: q.page,
      pages,
      limit: q.limit,
      hasMore: q.page < pages,
      sort: q.sortKey,
      categories: categories.filter(Boolean).sort((a, b) => a.localeCompare(b)),
      priceRange: { min: priceRange[0]?.min ?? 0, max: priceRange[0]?.max ?? 0 },
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

    const store = await findActiveStore(req.query.slug);

    const product = await Product.findOne({ _id: productId, store: store._id, isActive: true }).lean();
    if (!product) throw httpError(404, 'Product not found');

    // Related products: same category, excluding this one, up to 8
    const related = await Product.find({
      store: store._id,
      isActive: true,
      category: product.category,
      _id: { $ne: product._id },
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    await attachRatings([product, ...related]);
    res.json({ product, related });
  } catch (err) {
    next(err);
  }
};

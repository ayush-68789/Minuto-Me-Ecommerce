import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Store from '../models/Store.js';

const httpError = (status, message) => Object.assign(new Error(message), { status });

async function activeProduct(productId, slug) {
  if (!mongoose.isValidObjectId(productId)) throw httpError(404, 'Product not found');
  const store = await Store.findOne({ slug: String(slug || '').trim().toLowerCase(), status: 'active' }).select('_id features');
  const product = store && await Product.findOne({ _id: productId, store: store._id, isActive: true }).select('_id store');
  if (!product) throw httpError(404, 'Product not found');
  if (!store.features?.reviews) throw httpError(404, 'Reviews are not enabled for this store');
  return { store, product };
}

export async function listReviews(req, res, next) {
  try {
    const { store, product } = await activeProduct(req.params.productId, req.query.slug);
    const [reviews, eligibleOrder, myReview] = await Promise.all([
      Review.find({ product: product._id }).select('customerName rating text createdAt').sort({ createdAt: -1 }).limit(100).lean(),
      req.user ? Order.exists({ store: store._id, customer: req.user._id, status: 'delivered', 'items.product': product._id }) : null,
      req.user ? Review.findOne({ product: product._id, customer: req.user._id }).select('rating text') : null,
    ]);
    const averageRating = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;
    res.json({ reviews, reviewCount: reviews.length, averageRating, canReview: Boolean(eligibleOrder), myReview });
  } catch (err) { next(err); }
}

export async function createReview(req, res, next) {
  try {
    const { store, product } = await activeProduct(req.params.productId, req.body?.slug);
    if (req.user.role !== 'customer' || String(req.user.customerStore) !== String(store._id)) throw httpError(403, 'A customer account for this store is required');
    const rating = Number(req.body?.rating);
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw httpError(400, 'Choose a rating from 1 to 5');
    if (text.length < 5 || text.length > 1000) throw httpError(400, 'Review text must be 5 to 1000 characters');
    const order = await Order.exists({ store: store._id, customer: req.user._id, status: 'delivered', 'items.product': product._id });
    if (!order) throw httpError(403, 'Only customers with a delivered order can review this product');
    const review = await Review.findOneAndUpdate(
      { product: product._id, customer: req.user._id },
      { $set: { store: store._id, customerName: req.user.name, rating, text } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).select('customerName rating text createdAt');
    res.status(201).json({ review });
  } catch (err) { next(err); }
}

// Owner: M3 -- public, read-only storefront data (no auth)
import express from 'express';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import { isEmail } from '../validators/storeValidator.js';

const router = express.Router();

// GET /api/storefront/:slug -> { store, products }
router.get('/:slug', async (req, res, next) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug.toLowerCase(), status: 'active' }).lean();
    if (!store) return res.status(404).json({ message: 'Store not found' });

    const products = await Product.find({ store: store._id, isActive: true }).sort({ createdAt: -1 }).lean();
    const { owner, ...publicStore } = store;
    return res.json({ store: publicStore, products });
  } catch (err) {
    return next(err);
  }
});

// POST /api/storefront/:slug/subscribe { email } -> newsletter sign-up (idempotent per email)
router.post('/:slug/subscribe', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!isEmail(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
    const store = await Store.findOne({ slug: req.params.slug.toLowerCase(), status: 'active' }).select('_id');
    if (!store) return res.status(404).json({ message: 'Store not found' });
    const result = await Store.updateOne(
      { _id: store._id, 'subscribers.email': { $ne: email } },
      { $push: { subscribers: { $each: [{ email, createdAt: new Date() }], $slice: -5000 } } }
    );
    return res.status(result.modifiedCount ? 201 : 200).json({ success: true, message: result.modifiedCount ? 'Subscribed' : 'You are already subscribed' });
  } catch (err) {
    return next(err);
  }
});

export default router;

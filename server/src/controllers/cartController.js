// Owner: M5
// The cart itself lives in the browser; the server re-prices it from the DB.
import Product from '../models/Product.js';
import Store from '../models/Store.js';
import calcTotals from '../utils/calcTotals.js';
import { cartSchema, parse } from '../validators/orderValidator.js';

const httpError = (status, message) => Object.assign(new Error(message), { status });

async function findActiveStore(slug) {
  const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
  if (!store) throw httpError(404, 'Store not found');
  return store;
}

// Merges duplicate lines, loads products for THIS store only, and reports problems per line.
async function priceCart(store, items) {
  const quantities = new Map();
  for (const { productId, quantity } of items) {
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const products = await Product.find({ _id: { $in: [...quantities.keys()] }, store: store._id });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lines = [];
  const issues = [];
  for (const [productId, quantity] of quantities) {
    const product = byId.get(productId);
    if (!product || !product.isActive) {
      issues.push({ productId, message: 'This product is no longer available' });
      continue;
    }
    if (product.stock < quantity) {
      issues.push({ productId, message: `Only ${product.stock} left in stock`, available: product.stock });
      continue;
    }
    lines.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      quantity,
    });
  }

  return { lines, issues, ...calcTotals(lines) };
}

const storeSummary = (store) => ({
  id: store._id,
  name: store.businessName,
  slug: store.slug,
  currency: store.currency,
  paymentsEnabled: store.features.payments,
});

// POST /api/orders/quote
const quoteCart = async (req, res, next) => {
  try {
    const { storeSlug, items } = parse(cartSchema, req.body);
    const store = await findActiveStore(storeSlug);
    const { lines, issues, subtotal, shippingFee, total } = await priceCart(store, items);
    res.json({ store: storeSummary(store), items: lines, issues, subtotal, shippingFee, total });
  } catch (err) {
    next(err);
  }
};

export { quoteCart, priceCart, findActiveStore, storeSummary, httpError };

// The cart is kept in the browser; the server always reprices it from the database.
import mongoose from 'mongoose';
import calcTotals from '../utils/calcTotals.js';
import { cartSchema, parse } from '../validators/orderValidator.js';

const httpError = (status, message) => Object.assign(new Error(message), { status });

function model(name) {
  if (!mongoose.models[name]) throw httpError(503, `${name} service is not available yet`);
  return mongoose.model(name);
}

async function findActiveStore(slug) {
  const store = await model('Store').findOne({ slug: slug.toLowerCase(), status: 'active' });
  if (!store) throw httpError(404, 'Store not found');
  return store;
}

async function priceCart(store, items) {
  const quantities = new Map();
  for (const { productId, quantity } of items) {
    const combined = (quantities.get(productId) || 0) + quantity;
    quantities.set(productId, combined);
  }

  const issues = [];
  const validQuantities = new Map();
  for (const [productId, quantity] of quantities) {
    if (quantity > 99) {
      issues.push({ productId, message: 'Maximum quantity per product is 99' });
    } else {
      validQuantities.set(productId, quantity);
    }
  }

  const Product = model('Product');
  const products = await Product.find({
    _id: { $in: [...validQuantities.keys()] },
    store: store._id,
  });
  const byId = new Map(products.map((product) => [product._id.toString(), product]));
  const lines = [];

  for (const [productId, quantity] of validQuantities) {
    const product = byId.get(productId);
    if (!product || !product.isActive) {
      issues.push({ productId, message: 'This product is no longer available' });
      continue;
    }
    if (!Number.isInteger(product.stock) || product.stock < quantity) {
      issues.push({
        productId,
        message: `Only ${Math.max(0, Number(product.stock) || 0)} left in stock`,
        available: Math.max(0, Number(product.stock) || 0),
      });
      continue;
    }
    if (!Number.isFinite(product.price) || product.price < 0) {
      issues.push({ productId, message: 'This product has an invalid price' });
      continue;
    }
    lines.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || '',
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
  paymentsEnabled: Boolean(store.features?.payments),
});

const quoteCart = async (req, res, next) => {
  try {
    const { storeSlug, items } = parse(cartSchema, req.body);
    const store = await findActiveStore(storeSlug);
    const { lines, issues, subtotal, shippingFee, total } = await priceCart(store, items);
    res.json({ store: storeSummary(store), items: lines, issues, subtotal, shippingFee, total });
  } catch (error) {
    next(error);
  }
};

export { quoteCart, priceCart, findActiveStore, storeSummary, httpError };

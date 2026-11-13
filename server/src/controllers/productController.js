import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Reservation, { RESERVATION_STATUS } from '../models/Reservation.js';
import { HttpError } from '../middleware/errorHandler.js';

function requireDatabase() {
  if (mongoose.connection.readyState !== 1) {
    throw new HttpError(503, 'database_unavailable', 'Product management is temporarily unavailable');
  }
}

function parseProduct(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'invalid_product', 'A product object is required');
  }
  const product = {};
  if (!partial || Object.hasOwn(body, 'name')) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 100) throw new HttpError(400, 'invalid_product_name', 'Product name must be 1 to 100 characters');
    product.name = name;
  }
  if (!partial || Object.hasOwn(body, 'price')) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) throw new HttpError(400, 'invalid_product_price', 'Price must be a non-negative number');
    product.price = price;
  }
  if (!partial || Object.hasOwn(body, 'stock')) {
    const stock = Number(body.stock);
    if (!Number.isSafeInteger(stock) || stock < 0) throw new HttpError(400, 'invalid_product_stock', 'Stock must be a non-negative whole number');
    product.stock = stock;
  }
  for (const field of ['description', 'category']) {
    if (Object.hasOwn(body, field)) {
      if (typeof body[field] !== 'string' || body[field].length > (field === 'description' ? 1000 : 60)) {
        throw new HttpError(400, `invalid_product_${field}`, `${field} must be text within the allowed length`);
      }
      product[field] = body[field].trim();
    }
  }
  if (Object.hasOwn(body, 'imageUrl')) {
    const imageUrl = String(body.imageUrl || '').trim();
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) throw new HttpError(400, 'invalid_product_image', 'Image URL must use HTTP or HTTPS');
    product.imageUrl = imageUrl;
  }
  if (partial && Object.keys(product).length === 0) throw new HttpError(400, 'empty_product_update', 'Provide at least one product field to update');
  return product;
}

function parseId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'invalid_product_id', 'Product ID is invalid');
  return id;
}

export async function listProducts(_req, res) {
  requireDatabase();
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return res.status(200).json({ products });
}

export async function getProduct(req, res) {
  requireDatabase();
  const product = await Product.findById(parseId(req.params.productId)).lean();
  if (!product) throw new HttpError(404, 'product_not_found', 'Product not found');
  return res.status(200).json({ product });
}

export async function createProduct(req, res) {
  requireDatabase();
  const product = await Product.create(parseProduct(req.body));
  return res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  requireDatabase();
  const productId = parseId(req.params.productId);
  const changes = parseProduct(req.body, { partial: true });
  if (Object.hasOwn(changes, 'stock')) {
    const activeReservations = await Reservation.countDocuments({ productId, status: RESERVATION_STATUS.RESERVED });
    if (activeReservations) throw new HttpError(409, 'active_reservations', 'Stock cannot be edited while reservations are active');
  }
  const product = await Product.findByIdAndUpdate(productId, { $set: changes }, { new: true, runValidators: true });
  if (!product) throw new HttpError(404, 'product_not_found', 'Product not found');
  return res.status(200).json({ product });
}

export async function deleteProduct(req, res) {
  requireDatabase();
  const productId = parseId(req.params.productId);
  const activeReservations = await Reservation.countDocuments({ productId, status: RESERVATION_STATUS.RESERVED });
  if (activeReservations) throw new HttpError(409, 'active_reservations', 'Product cannot be deleted while reservations are active');
  const product = await Product.findByIdAndDelete(productId).lean();
  if (!product) throw new HttpError(404, 'product_not_found', 'Product not found');
  return res.status(200).json({ deleted: true, productId: String(product._id) });
}

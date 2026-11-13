// Owner: Member 5 — cart handlers bind cart identity to the authenticated user.
import { HttpError } from '../middleware/errorHandler.js';
import Cart from '../models/Cart.js';

function currentCart(req) {
  return Cart.get(req.tenantId, req.user.id);
}

export function getCart(req, res) {
  res.status(200).json({ cart: currentCart(req) });
}

export function addItem(req, res) {
  const item = req.body?.item || req.body;
  if (!item || typeof item.productId !== 'string' || !item.productId.trim()) {
    throw new HttpError(400, 'invalid_cart_item', 'productId is required');
  }
  res.status(200).json({ cart: Cart.addItem(req.tenantId, req.user.id, item), message: 'Item added to cart' });
}

export function updateItem(req, res) {
  const quantity = Number(req.body?.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new HttpError(400, 'invalid_quantity', 'quantity must be an integer from 1 to 100');
  }
  const cart = Cart.updateItem(req.tenantId, req.user.id, req.params.productId, quantity);
  res.status(200).json({ cart, message: 'Cart item updated' });
}

export function removeItem(req, res) {
  const cart = Cart.removeItem(req.tenantId, req.user.id, req.params.productId);
  res.status(200).json({ cart, message: 'Item removed from cart' });
}

export function clearCart(req, res) {
  const cart = Cart.clear(req.tenantId, req.user.id);
  res.status(200).json({ cart, message: 'Cart cleared' });
}

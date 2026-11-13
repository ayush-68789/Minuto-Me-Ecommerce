// Owner: Member 5 — Cart request handlers.
import Cart from '../models/Cart.js';

function getTenantAndSession(req) {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenantId || req.body?.tenantId || 'default';
  const sessionId = req.headers['x-session-id'] || req.query.sessionId || req.body?.sessionId || 'anonymous';
  return { tenantId, sessionId };
}

export function getCart(req, res) {
  try {
    const { tenantId, sessionId } = getTenantAndSession(req);
    const cart = Cart.get(tenantId, sessionId);
    res.status(200).json({ cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function addItem(req, res) {
  try {
    const { tenantId, sessionId } = getTenantAndSession(req);
    const item = req.body.item || req.body;

    if (!item || !item.productId) {
      return res.status(400).json({ error: 'productId is required to add an item to cart' });
    }

    const cart = Cart.addItem(tenantId, sessionId, item);
    res.status(200).json({ cart, message: 'Item added to cart' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export function updateItem(req, res) {
  try {
    const { tenantId, sessionId } = getTenantAndSession(req);
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ error: 'quantity is required' });
    }

    const cart = Cart.updateItem(tenantId, sessionId, productId, quantity);
    res.status(200).json({ cart, message: 'Cart item updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export function removeItem(req, res) {
  try {
    const { tenantId, sessionId } = getTenantAndSession(req);
    const { productId } = req.params;

    const cart = Cart.removeItem(tenantId, sessionId, productId);
    res.status(200).json({ cart, message: 'Item removed from cart' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export function clearCart(req, res) {
  try {
    const { tenantId, sessionId } = getTenantAndSession(req);
    const cart = Cart.clear(tenantId, sessionId);
    res.status(200).json({ cart, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


// Owner: Member 5 — Client cart data shape and API calls.
import authSessionModel from './authSessionModel.js';

const getHeaders = (tenantId = 'default') => authSessionModel.headers(tenantId);

export const cartModel = {
  async getCart(tenantId = 'default') {
    const res = await fetch('/api/cart', {
      headers: getHeaders(tenantId)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch cart (${res.status})`);
    }
    const data = await res.json();
    return data.cart;
  },

  async addItem(item, tenantId = 'default') {
    const res = await fetch('/api/cart/items', {
      method: 'POST',
      headers: getHeaders(tenantId),
      body: JSON.stringify({ item })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to add item to cart (${res.status})`);
    }
    const data = await res.json();
    return data.cart;
  },

  async updateItemQuantity(productId, quantity, tenantId = 'default') {
    const res = await fetch(`/api/cart/items/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      headers: getHeaders(tenantId),
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update cart item (${res.status})`);
    }
    const data = await res.json();
    return data.cart;
  },

  async removeItem(productId, tenantId = 'default') {
    const res = await fetch(`/api/cart/items/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: getHeaders(tenantId)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to remove item (${res.status})`);
    }
    const data = await res.json();
    return data.cart;
  },

  async clearCart(tenantId = 'default') {
    const res = await fetch('/api/cart', {
      method: 'DELETE',
      headers: getHeaders(tenantId)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to clear cart (${res.status})`);
    }
    const data = await res.json();
    return data.cart;
  }
};

export default cartModel;

// Owner: Member 5 — Client order data shape and API calls aligned with hardened checkout.
import authSessionModel from './authSessionModel.js';

const getHeaders = (tenantId = 'default') => authSessionModel.headers(tenantId);

export const orderModel = {
  // Hardened checkout endpoint (/api/checkout) requiring Idempotency-Key
  async checkout(checkoutData = {}, tenantId = 'default') {
    const rawItems = checkoutData.items || [];
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new Error('Your cart is empty. Please add items before checking out.');
    }

    // Merge duplicate product IDs before submitting
    const merged = new Map();
    for (const item of rawItems) {
      const pid = String(item.productId || item.id || item._id);
      const qty = Math.max(1, Number(item.qty || item.quantity) || 1);
      merged.set(pid, (merged.get(pid) || 0) + qty);
    }
    const items = Array.from(merged.entries()).map(([productId, qty]) => ({
      productId,
      qty
    }));

    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        ...getHeaders(tenantId),
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        items,
        customer: checkoutData.customer,
        shippingAddress: checkoutData.shippingAddress,
        paymentMethod: checkoutData.paymentMethod || 'demo'
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || err.message || err.error || `Checkout failed (${res.status})`;
      throw new Error(msg);
    }

    const data = await res.json();
    return {
      id: String(data.orderId),
      orderId: String(data.orderId),
      ...data
    };
  },

  async getOrder(id, tenantId = 'default') {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      headers: getHeaders(tenantId)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Failed to fetch order (${res.status})`);
    }

    const data = await res.json();
    return data;
  },

  async listOrders({ tenantId = 'default', status, limit } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (status) params.append('status', String(status));

    const res = await fetch(`/api/orders?${params.toString()}`, {
      headers: getHeaders(tenantId)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Failed to fetch orders (${res.status})`);
    }

    const data = await res.json();
    return data.orders || [];
  },

  async cancelOrder(id, reason = 'Cancelled by customer', tenantId = 'default') {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: getHeaders(tenantId),
      body: JSON.stringify({ reason })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Failed to cancel order (${res.status})`);
    }

    return await res.json();
  }
};

export default orderModel;

// Owner: Member 5 — Client order data shape and API calls.
import authSessionModel from './authSessionModel.js';

const getHeaders = (tenantId = 'default') => authSessionModel.headers(tenantId);

export const orderModel = {
  async checkout(checkoutData, tenantId = 'default') {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: getHeaders(tenantId),
      body: JSON.stringify({
        ...checkoutData,
        fromCart: checkoutData.fromCart !== false
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Checkout failed (${res.status})`);
    }

    return await res.json();
  },

  async getOrder(id, tenantId = 'default') {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      headers: getHeaders(tenantId)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch order (${res.status})`);
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
      throw new Error(err.error || `Failed to fetch orders (${res.status})`);
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

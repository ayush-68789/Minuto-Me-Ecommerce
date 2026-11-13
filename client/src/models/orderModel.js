// Owner: Member 5 — Client order data shape and API calls.
import { getSessionId } from './cartModel.js';

function getHeaders(tenantId = 'default') {
  return {
    'Content-Type': 'application/json',
    'x-session-id': getSessionId(),
    'x-tenant-id': tenantId
  };
}

export const orderModel = {
  async checkout(checkoutData, tenantId = 'default') {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: getHeaders(tenantId),
      body: JSON.stringify({
        ...checkoutData,
        tenantId,
        fromCart: checkoutData.fromCart !== false
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Checkout failed (${res.status})`);
    }

    return await res.json();
  },

  async getOrder(id) {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch order (${res.status})`);
    }

    const data = await res.json();
    return data;
  },

  async listOrders({ tenantId = 'default', email, customerId } = {}) {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId);
    if (email) params.append('email', email);
    if (customerId) params.append('customerId', customerId);

    const res = await fetch(`/api/orders?${params.toString()}`, {
      headers: getHeaders(tenantId)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch orders (${res.status})`);
    }

    const data = await res.json();
    return data.orders || [];
  }
};

export default orderModel;


// Owner: Member 5 — MVC model for orders, scoped by tenant and authenticated customer.
import { randomUUID } from 'node:crypto';

const orders = new Map();

const Order = {
  create({ tenantId, customerId, customer = {}, shippingAddress = {}, items = [], pricing = {}, payment = {} }) {
    if (!tenantId || !customerId || !Array.isArray(items) || items.length === 0) {
      throw new Error('tenantId, customerId and at least one item are required');
    }
    const now = new Date().toISOString();
    const orderItems = items.map((item) => ({
      productId: String(item.productId),
      title: item.title || `Product ${item.productId}`,
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
      total: Number(((Number(item.price) || 0) * (Number.parseInt(item.quantity, 10) || 1)).toFixed(2)),
      image: item.image || '',
    }));

    const subtotal = Number(orderItems.reduce((sum, item) => sum + item.total, 0).toFixed(2));
    const discount = Math.max(0, Number(pricing.discount) || 0);
    const discountedSubtotal = Math.max(0, Number((subtotal - discount).toFixed(2)));
    const shipping = pricing.shipping !== undefined ? Number(pricing.shipping) : (discountedSubtotal >= 50 ? 0 : 5);
    const tax = pricing.tax !== undefined ? Number(pricing.tax) : Number((discountedSubtotal * 0.08).toFixed(2));
    const total = Number((discountedSubtotal + shipping + tax).toFixed(2));

    const orderPricing = {
      subtotal,
      discount,
      coupon: pricing.coupon || null,
      shipping,
      tax,
      total,
      currency: pricing.currency || 'USD'
    };

    const order = {
      id: randomUUID(),
      tenantId,
      customerId,
      customer: { name: customer.name || '', email: customer.email || '', phone: customer.phone || '' },
      shippingAddress,
      items: orderItems,
      pricing: orderPricing,
      payment: { paymentId: payment.paymentId || null, method: payment.method || 'demo_card', status: payment.status || 'pending' },
      status: payment.status === 'completed' ? 'processing' : 'pending',
      cancellation: null,
      shipment: null,
      createdAt: now,
      updatedAt: now,
    };
    orders.set(order.id, order);
    return order;
  },

  get(id) {
    return orders.get(id) || null;
  },

  findById(id) {
    return this.get(id);
  },

  list({ tenantId, customerId, status, limit = 50 } = {}) {
    return [...orders.values()]
      .filter((order) => {
        if (tenantId && order.tenantId !== tenantId) return false;
        if (customerId && order.customerId !== customerId) return false;
        if (status && order.status !== status) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.min(Math.max(Number(limit) || 50, 1), 100));
  },

  listByCustomer(customerId) {
    return this.list({ customerId });
  },

  cancel(id, { reason = 'Cancelled by customer', cancelledBy = 'customer' } = {}) {
    const order = orders.get(id);
    if (!order) return null;
    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      throw new Error(`Cannot cancel order with status "${order.status}"`);
    }
    order.status = 'cancelled';
    order.cancellation = {
      reason,
      cancelledBy,
      cancelledAt: new Date().toISOString()
    };
    order.updatedAt = new Date().toISOString();
    return order;
  },

  updateShipment(id, { trackingNumber, carrier = 'Standard Express', estimatedDelivery = null } = {}) {
    const order = orders.get(id);
    if (!order) return null;
    order.shipment = {
      trackingNumber: trackingNumber || `TRK-${randomUUID().slice(0, 8).toUpperCase()}`,
      carrier,
      shippedAt: new Date().toISOString(),
      estimatedDelivery
    };
    order.status = 'shipped';
    order.updatedAt = new Date().toISOString();
    return order;
  },

  updateStatus(id, status) {
    const order = orders.get(id);
    if (!order) return null;
    const validStatuses = ['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) throw new Error('Invalid order status');
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return order;
  },

  updatePayment(id, paymentInfo) {
    const order = orders.get(id);
    if (!order) return null;
    order.payment = { ...order.payment, ...paymentInfo };
    if (paymentInfo.status === 'completed' && order.status === 'pending') order.status = 'processing';
    order.updatedAt = new Date().toISOString();
    return order;
  },

  clear() {
    orders.clear();
  }
};

export default Order;

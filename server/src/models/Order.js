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
    const shipping = subtotal >= 50 ? 0 : 5;
    const tax = Number((subtotal * 0.08).toFixed(2));
    const order = {
      id: randomUUID(),
      tenantId,
      customerId,
      customer: { name: customer.name || '', email: customer.email || '', phone: customer.phone || '' },
      shippingAddress,
      items: orderItems,
      pricing: { subtotal, shipping, tax, total: Number((subtotal + shipping + tax).toFixed(2)), currency: 'USD' },
      payment: { paymentId: payment.paymentId || null, method: payment.method || 'demo_card', status: payment.status || 'pending' },
      status: payment.status === 'completed' ? 'processing' : 'pending',
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
  list({ tenantId, customerId, limit = 50 } = {}) {
    return [...orders.values()]
      .filter((order) => (!tenantId || order.tenantId === tenantId) && (!customerId || order.customerId === customerId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.min(Math.max(Number(limit) || 50, 1), 100));
  },
  listByCustomer(customerId) {
    return this.list({ customerId });
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
};

export default Order;

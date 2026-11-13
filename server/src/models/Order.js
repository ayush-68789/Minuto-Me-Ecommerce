// Owner: Member 5 — Order model for lines, totals, state, and tenant/customer IDs.
const orders = new Map();

function generateOrderId() {
  return `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

const Order = {
  create({
    tenantId = 'default',
    customerId = 'guest',
    customer = {},
    shippingAddress = {},
    items = [],
    pricing = {},
    payment = {}
  }) {
    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const id = generateOrderId();
    const orderItems = items.map(item => ({
      productId: String(item.productId),
      title: item.title || `Product #${item.productId}`,
      price: Number(item.price) || 0,
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      total: Number(((Number(item.price) || 0) * (parseInt(item.quantity, 10) || 1)).toFixed(2)),
      image: item.image || ''
    }));

    const subtotal = Number(orderItems.reduce((acc, item) => acc + item.total, 0).toFixed(2));
    const shipping = pricing.shipping !== undefined ? Number(pricing.shipping) : (subtotal >= 50 ? 0 : 5.00);
    const tax = pricing.tax !== undefined ? Number(pricing.tax) : Number((subtotal * 0.08).toFixed(2));
    const total = pricing.total !== undefined ? Number(pricing.total) : Number((subtotal + shipping + tax).toFixed(2));

    const record = {
      id,
      tenantId,
      customerId: customerId || customer.email || 'guest',
      customer: {
        name: customer.name || 'Valued Customer',
        email: customer.email || '',
        phone: customer.phone || ''
      },
      shippingAddress: {
        fullName: shippingAddress.fullName || customer.name || '',
        street: shippingAddress.street || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postalCode || '',
        country: shippingAddress.country || 'US'
      },
      items: orderItems,
      pricing: {
        subtotal,
        shipping,
        tax,
        total,
        currency: pricing.currency || 'USD'
      },
      payment: {
        paymentId: payment.paymentId || null,
        method: payment.method || 'demo_card',
        status: payment.status || 'pending'
      },
      status: payment.status === 'completed' ? 'processing' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.set(id, record);
    return record;
  },

  get(id) {
    return orders.get(id) || null;
  },

  list({ tenantId, customerId, limit = 50 } = {}) {
    const results = [];
    for (const order of orders.values()) {
      let matches = true;
      if (tenantId && order.tenantId !== tenantId) matches = false;
      if (customerId && order.customerId !== customerId && order.customer?.email !== customerId) matches = false;

      if (matches) {
        results.push(order);
      }
    }

    // Sort descending by creation date
    return results
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  },

  updateStatus(id, status) {
    const order = orders.get(id);
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }

    const validStatuses = ['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid order status: ${status}. Valid: ${validStatuses.join(', ')}`);
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    orders.set(id, order);
    return order;
  },

  updatePayment(id, paymentInfo) {
    const order = orders.get(id);
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }

    order.payment = {
      ...order.payment,
      ...paymentInfo
    };

    if (paymentInfo.status === 'completed' && order.status === 'pending') {
      order.status = 'processing';
    }

    order.updatedAt = new Date().toISOString();
    orders.set(id, order);
    return order;
  }
};

export default Order;


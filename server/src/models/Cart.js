// Owner: Member 5 — Cart model per user/session and tenant.
const carts = new Map();

function buildCartKey(tenantId = 'default', sessionId = 'anonymous') {
  return `${tenantId}:${sessionId}`;
}

function calculatePricing(items = []) {
  const subtotal = Number(
    items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0).toFixed(2)
  );
  // Free shipping above $50, else $5 flat rate if cart not empty
  const shipping = items.length === 0 ? 0 : (subtotal >= 50 ? 0 : 5.00);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return {
    subtotal,
    shipping,
    tax,
    total,
    currency: 'USD',
    itemCount
  };
}

const Cart = {
  get(tenantId = 'default', sessionId = 'anonymous') {
    const key = buildCartKey(tenantId, sessionId);
    if (!carts.has(key)) {
      carts.set(key, {
        tenantId,
        sessionId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    const cart = carts.get(key);
    const pricing = calculatePricing(cart.items);
    return {
      ...cart,
      pricing,
      itemCount: pricing.itemCount
    };
  },

  addItem(tenantId = 'default', sessionId = 'anonymous', item) {
    if (!item || !item.productId) {
      throw new Error('Valid item with productId is required');
    }

    const currentCart = this.get(tenantId, sessionId);
    const existingIndex = currentCart.items.findIndex(i => String(i.productId) === String(item.productId));
    const quantityToAdd = Math.max(1, parseInt(item.quantity, 10) || 1);

    if (existingIndex > -1) {
      currentCart.items[existingIndex].quantity += quantityToAdd;
      if (item.price !== undefined) currentCart.items[existingIndex].price = Number(item.price);
      if (item.title) currentCart.items[existingIndex].title = item.title;
      if (item.image) currentCart.items[existingIndex].image = item.image;
    } else {
      currentCart.items.push({
        productId: String(item.productId),
        title: item.title || `Product #${item.productId}`,
        price: Number(item.price) || 0,
        quantity: quantityToAdd,
        image: item.image || '',
        selectedOptions: item.selectedOptions || {}
      });
    }

    currentCart.updatedAt = new Date().toISOString();
    const key = buildCartKey(tenantId, sessionId);
    carts.set(key, currentCart);
    return this.get(tenantId, sessionId);
  },

  updateItem(tenantId = 'default', sessionId = 'anonymous', productId, quantity) {
    const currentCart = this.get(tenantId, sessionId);
    const targetQuantity = parseInt(quantity, 10);

    if (isNaN(targetQuantity) || targetQuantity <= 0) {
      return this.removeItem(tenantId, sessionId, productId);
    }

    const itemIndex = currentCart.items.findIndex(i => String(i.productId) === String(productId));
    if (itemIndex > -1) {
      currentCart.items[itemIndex].quantity = targetQuantity;
      currentCart.updatedAt = new Date().toISOString();
      const key = buildCartKey(tenantId, sessionId);
      carts.set(key, currentCart);
    }

    return this.get(tenantId, sessionId);
  },

  removeItem(tenantId = 'default', sessionId = 'anonymous', productId) {
    const currentCart = this.get(tenantId, sessionId);
    currentCart.items = currentCart.items.filter(i => String(i.productId) !== String(productId));
    currentCart.updatedAt = new Date().toISOString();
    const key = buildCartKey(tenantId, sessionId);
    carts.set(key, currentCart);
    return this.get(tenantId, sessionId);
  },

  clear(tenantId = 'default', sessionId = 'anonymous') {
    const key = buildCartKey(tenantId, sessionId);
    const clearedCart = {
      tenantId,
      sessionId,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    carts.set(key, clearedCart);
    return this.get(tenantId, sessionId);
  }
};

export default Cart;


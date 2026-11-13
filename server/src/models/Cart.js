// Owner: Member 5 — Cart model per user/session and tenant.
const carts = new Map();

function buildCartKey(tenantId = 'default', userId = 'anonymous') {
  return JSON.stringify([tenantId, userId]);
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
  get(tenantId = 'default', userId = 'anonymous') {
    const key = buildCartKey(tenantId, userId);
    if (!carts.has(key)) {
      carts.set(key, {
        tenantId,
        userId,
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

  addItem(tenantId = 'default', userId = 'anonymous', item) {
    if (!item || !item.productId) {
      throw new Error('Valid item with productId is required');
    }

    const requestedQuantity = item.quantity === undefined ? 1 : Number(item.quantity);
    const requestedPrice = Number(item.price);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 100) {
      throw new Error('quantity must be an integer from 1 to 100');
    }
    if (!Number.isFinite(requestedPrice) || requestedPrice < 0) {
      throw new Error('price must be a non-negative number');
    }

    const currentCart = this.get(tenantId, userId);
    const existingIndex = currentCart.items.findIndex(i => String(i.productId) === String(item.productId));
    const quantityToAdd = requestedQuantity;

    if (existingIndex > -1) {
      currentCart.items[existingIndex].quantity += quantityToAdd;
      if (item.price !== undefined) currentCart.items[existingIndex].price = Number(item.price);
      if (item.title) currentCart.items[existingIndex].title = item.title;
      if (item.image) currentCart.items[existingIndex].image = item.image;
    } else {
      currentCart.items.push({
        productId: String(item.productId),
        title: item.title || `Product #${item.productId}`,
        price: requestedPrice,
        quantity: quantityToAdd,
        image: item.image || '',
        selectedOptions: item.selectedOptions || {}
      });
    }

    currentCart.updatedAt = new Date().toISOString();
    const key = buildCartKey(tenantId, userId);
    carts.set(key, currentCart);
    return this.get(tenantId, userId);
  },

  updateItem(tenantId = 'default', userId = 'anonymous', productId, quantity) {
    const currentCart = this.get(tenantId, userId);
    const targetQuantity = parseInt(quantity, 10);

    if (isNaN(targetQuantity) || targetQuantity <= 0) {
      return this.removeItem(tenantId, userId, productId);
    }

    const itemIndex = currentCart.items.findIndex(i => String(i.productId) === String(productId));
    if (itemIndex > -1) {
      currentCart.items[itemIndex].quantity = targetQuantity;
      currentCart.updatedAt = new Date().toISOString();
      const key = buildCartKey(tenantId, userId);
      carts.set(key, currentCart);
    }

    return this.get(tenantId, userId);
  },

  removeItem(tenantId = 'default', userId = 'anonymous', productId) {
    const currentCart = this.get(tenantId, userId);
    currentCart.items = currentCart.items.filter(i => String(i.productId) !== String(productId));
    currentCart.updatedAt = new Date().toISOString();
    const key = buildCartKey(tenantId, userId);
    carts.set(key, currentCart);
    return this.get(tenantId, userId);
  },

  clear(tenantId = 'default', userId = 'anonymous') {
    const key = buildCartKey(tenantId, userId);
    const clearedCart = {
      tenantId,
      userId,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    carts.set(key, clearedCart);
    return this.get(tenantId, userId);
  }
};

export default Cart;

// Owner: Member 5 — Cart model per user/session and tenant.
const carts = new Map();

const AVAILABLE_COUPONS = {
  SAVE10: { code: 'SAVE10', type: 'percentage', discountPercent: 10, description: '10% off subtotal' },
  MINUTO20: { code: 'MINUTO20', type: 'percentage', discountPercent: 20, description: '20% off subtotal' },
  FREESHIP: { code: 'FREESHIP', type: 'shipping', discountPercent: 100, description: 'Free shipping on any order' },
  FLAT15: { code: 'FLAT15', type: 'fixed', amount: 15.00, description: '$15 off orders $40+' }
};

function buildCartKey(tenantId = 'default', userId = 'anonymous') {
  return JSON.stringify([tenantId, userId]);
}

function calculatePricing(items = [], coupon = null) {
  const subtotal = Number(
    items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0).toFixed(2)
  );

  let discountAmount = 0;
  let freeShippingApplied = false;

  if (coupon && items.length > 0) {
    if (coupon.type === 'percentage') {
      discountAmount = Number(((subtotal * coupon.discountPercent) / 100).toFixed(2));
    } else if (coupon.type === 'fixed') {
      if (subtotal >= 40) {
        discountAmount = Math.min(coupon.amount, subtotal);
      }
    } else if (coupon.type === 'shipping') {
      freeShippingApplied = true;
    }
  }

  // Free shipping above $50 or via coupon, else $5 flat rate if cart not empty
  const shipping = items.length === 0 ? 0 : (subtotal >= 50 || freeShippingApplied ? 0 : 5.00);
  const discountedSubtotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
  const tax = Number((discountedSubtotal * 0.08).toFixed(2));
  const total = Number((discountedSubtotal + shipping + tax).toFixed(2));
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return {
    subtotal,
    discount: discountAmount,
    coupon: coupon ? { code: coupon.code, description: coupon.description, discountAmount } : null,
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
        coupon: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    const cart = carts.get(key);
    const pricing = calculatePricing(cart.items, cart.coupon);
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

  updateItems(tenantId = 'default', userId = 'anonymous', items = []) {
    if (!Array.isArray(items)) {
      throw new Error('items must be an array');
    }
    const currentCart = this.get(tenantId, userId);
    for (const update of items) {
      if (update && update.productId) {
        const qty = parseInt(update.quantity, 10);
        if (!isNaN(qty) && qty > 0) {
          const idx = currentCart.items.findIndex(i => String(i.productId) === String(update.productId));
          if (idx > -1) {
            currentCart.items[idx].quantity = Math.min(qty, 100);
          }
        }
      }
    }
    currentCart.updatedAt = new Date().toISOString();
    const key = buildCartKey(tenantId, userId);
    carts.set(key, currentCart);
    return this.get(tenantId, userId);
  },

  applyCoupon(tenantId = 'default', userId = 'anonymous', couponCode = '') {
    const code = String(couponCode).trim().toUpperCase();
    if (!code) {
      throw new Error('Coupon code is required');
    }
    const coupon = AVAILABLE_COUPONS[code];
    if (!coupon) {
      throw new Error(`Invalid or expired coupon code "${couponCode}"`);
    }

    const currentCart = this.get(tenantId, userId);
    currentCart.coupon = coupon;
    currentCart.updatedAt = new Date().toISOString();
    const key = buildCartKey(tenantId, userId);
    carts.set(key, currentCart);
    return this.get(tenantId, userId);
  },

  removeCoupon(tenantId = 'default', userId = 'anonymous') {
    const currentCart = this.get(tenantId, userId);
    currentCart.coupon = null;
    currentCart.updatedAt = new Date().toISOString();
    const key = buildCartKey(tenantId, userId);
    carts.set(key, currentCart);
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
      coupon: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    carts.set(key, clearedCart);
    return this.get(tenantId, userId);
  }
};

export default Cart;

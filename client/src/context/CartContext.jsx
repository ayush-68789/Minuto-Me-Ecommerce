// Owner: M5
// One cart per store, keyed by store slug and kept in localStorage.
// Prices here are for display only; the server re-prices everything at checkout.
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const CartContext = createContext(null);

const CARTS_KEY = 'minuto_carts';
const ORDERS_KEY = 'minuto_guest_orders';
const MAX_QTY = 99;

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.) -- cart just won't persist
  }
};

const clampQty = (qty, stock) => {
  const limit = Number.isFinite(stock) ? Math.min(stock, MAX_QTY) : MAX_QTY;
  return Math.max(0, Math.min(Math.floor(qty) || 0, limit));
};

export function CartProvider({ children }) {
  const [carts, setCarts] = useState(() => read(CARTS_KEY));
  const [guestOrders, setGuestOrders] = useState(() => read(ORDERS_KEY));

  useEffect(() => write(CARTS_KEY, carts), [carts]);
  useEffect(() => write(ORDERS_KEY, guestOrders), [guestOrders]);

  const updateCart = useCallback((slug, fn) => {
    setCarts((prev) => {
      const items = fn(prev[slug] || []).filter((i) => i.quantity > 0);
      const next = { ...prev };
      if (items.length) next[slug] = items;
      else delete next[slug];
      return next;
    });
  }, []);

  // product: a Product document from the API ({ _id, name, price, images, stock })
  const addItem = useCallback(
    (slug, product, quantity = 1) =>
      updateCart(slug, (items) => {
        const existing = items.find((i) => i.productId === product._id);
        if (existing) {
          return items.map((i) =>
            i === existing ? { ...i, quantity: clampQty(i.quantity + quantity, product.stock) } : i
          );
        }
        return [
          ...items,
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || '',
            stock: product.stock,
            quantity: clampQty(quantity, product.stock),
          },
        ];
      }),
    [updateCart]
  );

  const updateQuantity = useCallback(
    (slug, productId, quantity) =>
      updateCart(slug, (items) =>
        items.map((i) => (i.productId === productId ? { ...i, quantity: clampQty(quantity, i.stock) } : i))
      ),
    [updateCart]
  );

  const removeItem = useCallback(
    (slug, productId) => updateCart(slug, (items) => items.filter((i) => i.productId !== productId)),
    [updateCart]
  );

  const clearCart = useCallback((slug) => updateCart(slug, () => []), [updateCart]);

  // Remember guest orders on this device so they show up in order history
  const rememberOrder = useCallback((slug, orderId, email) => {
    setGuestOrders((prev) => {
      const list = (prev[slug] || []).filter((o) => o.id !== orderId);
      return { ...prev, [slug]: [{ id: orderId, email }, ...list].slice(0, 20) };
    });
  }, []);

  const value = useMemo(
    () => ({ carts, guestOrders, addItem, updateQuantity, removeItem, clearCart, rememberOrder }),
    [carts, guestOrders, addItem, updateQuantity, removeItem, clearCart, rememberOrder]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

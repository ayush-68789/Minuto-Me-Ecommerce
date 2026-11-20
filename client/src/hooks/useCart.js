// Owner: M5
// Usage (storefront):  const { addItem, count } = useCart();  addItem(product)
// The store slug defaults to the :slug route param.
import { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext.jsx';
import { quoteCart } from '../api/orderApi';

// Server-side pricing + stock check for the cart. Re-runs whenever lines/quantities change.
export function useCartQuote(slug, items) {
  const [state, setState] = useState({ quote: null, error: null, loading: true });
  const key = items.map((i) => `${i.productId}:${i.quantity}`).join(',');

  useEffect(() => {
    if (!items.length) {
      setState({ quote: null, error: null, loading: false });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    quoteCart(slug, items)
      .then((quote) => !cancelled && setState({ quote, error: null, loading: false }))
      .catch((error) => !cancelled && setState({ quote: null, error, loading: false }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, key]);

  return state;
}

export default function useCart(storeSlug) {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');

  const params = useParams();
  const slug = storeSlug || params.slug;

  return useMemo(() => {
    const items = ctx.carts[slug] || [];
    return {
      slug,
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      estimatedSubtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      guestOrders: ctx.guestOrders[slug] || [],
      addItem: (product, quantity) => ctx.addItem(slug, product, quantity),
      updateQuantity: (productId, quantity) => ctx.updateQuantity(slug, productId, quantity),
      removeItem: (productId) => ctx.removeItem(slug, productId),
      clearCart: () => ctx.clearCart(slug),
      rememberOrder: (orderId, email) => ctx.rememberOrder(slug, orderId, email),
    };
  }, [ctx, slug]);
}

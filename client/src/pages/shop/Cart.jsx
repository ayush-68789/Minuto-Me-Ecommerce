// Owner: M5
import { Link, useNavigate } from 'react-router-dom';
import useCart, { useCartQuote } from '../../hooks/useCart';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import { button, page } from '../../components/cart/money';

export default function Cart() {
  const navigate = useNavigate();
  const { slug, items, estimatedSubtotal, updateQuantity, removeItem } = useCart();
  const { quote, error, loading } = useCartQuote(slug, items);

  if (!items.length) {
    return (
      <div style={{ ...page, textAlign: 'center' }}>
        <h1>Your cart is empty</h1>
        <Link to={`/store/${slug}`}>Continue shopping</Link>
      </div>
    );
  }

  const currency = quote?.store.currency;
  const issues = new Map((quote?.issues || []).map((i) => [i.productId, i]));
  // Show the server's current price when we have it
  const prices = new Map((quote?.items || []).map((i) => [String(i.product), i.price]));
  const canCheckout = quote && !issues.size && !loading;

  return (
    <div style={page}>
      <h1 style={{ marginTop: 0 }}>Your cart{quote ? ` · ${quote.store.name}` : ''}</h1>
      {error && <p style={{ color: '#dc2626' }}>{error.message}</p>}
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 420px' }}>
          {items.map((item) => (
            <CartItem
              key={item.productId}
              item={{ ...item, price: prices.get(item.productId) ?? item.price }}
              currency={currency}
              issue={issues.get(item.productId)}
              onQuantityChange={(qty) => updateQuantity(item.productId, qty)}
              onRemove={() => removeItem(item.productId)}
            />
          ))}
          <Link to={`/store/${slug}`} style={{ display: 'inline-block', marginTop: 16 }}>
            ← Continue shopping
          </Link>
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <CartSummary
            subtotal={quote ? quote.subtotal : estimatedSubtotal}
            shippingFee={quote?.shippingFee}
            total={quote ? quote.total : estimatedSubtotal}
            currency={currency}
          >
            {issues.size > 0 && (
              <p style={{ color: '#dc2626', fontSize: 14, marginTop: 0 }}>
                Fix the highlighted items to continue.
              </p>
            )}
            <button
              type="button"
              disabled={!canCheckout}
              onClick={() => navigate(`/store/${slug}/checkout`)}
              style={{ ...button(!canCheckout), width: '100%' }}
            >
              {loading ? 'Checking prices…' : 'Proceed to checkout'}
            </button>
          </CartSummary>
        </div>
      </div>
    </div>
  );
}

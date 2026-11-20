// Owner: M5
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useCart, { useCartQuote } from '../../hooks/useCart';
import { createOrder } from '../../api/orderApi';
import AddressForm, { emptyAddress, validateAddress } from '../../components/cart/AddressForm';
import CartSummary from '../../components/cart/CartSummary';
import { button, card, formatMoney, page } from '../../components/cart/money';

export default function Checkout() {
  const navigate = useNavigate();
  const { slug, items, clearCart, rememberOrder } = useCart();
  const { quote, error: quoteError, loading } = useCartQuote(slug, items);

  const [details, setDetails] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [placing, setPlacing] = useState(false);

  if (!items.length && !placing) return <Navigate to={`/store/${slug}/cart`} replace />;

  const currency = quote?.store.currency;
  const blocked = !quote || quote.issues.length > 0;

  const placeOrder = async (e) => {
    e.preventDefault();
    const found = validateAddress(details);
    setErrors(found);
    if (Object.keys(found).length) return;

    setPlacing(true);
    setSubmitError(null);
    try {
      const { order } = await createOrder(slug, items, { ...details, paymentMethod });
      const email = order.customerInfo.email;
      rememberOrder(order._id, email);
      clearCart();
      navigate(`/store/${slug}/orders/${order._id}?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (err) {
      setSubmitError(err);
      setPlacing(false);
    }
  };

  return (
    <div style={page}>
      <Link to={`/store/${slug}/cart`}>← Back to cart</Link>
      <h1>Checkout</h1>
      <form onSubmit={placeOrder} noValidate style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 420px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section style={card}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>Contact & shipping</h2>
            <AddressForm value={details} onChange={setDetails} errors={errors} />
          </section>

          <section style={card}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>Payment</h2>
            <label style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              Cash on delivery
            </label>
            {quote?.store.paymentsEnabled && (
              <label style={{ display: 'flex', gap: 8 }}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                />
                Pay online
              </label>
            )}
          </section>
        </div>

        <div style={{ flex: '1 1 280px' }}>
          <CartSummary
            subtotal={quote?.subtotal}
            shippingFee={quote?.shippingFee}
            total={quote?.total}
            currency={currency}
          >
            {quote?.items.map((i) => (
              <div key={String(i.product)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>{formatMoney(i.price * i.quantity, currency)}</span>
              </div>
            ))}
            {quoteError && <p style={{ color: '#dc2626' }}>{quoteError.message}</p>}
            {quote?.issues.length > 0 && (
              <p style={{ color: '#dc2626', fontSize: 14 }}>
                Some items changed. <Link to={`/store/${slug}/cart`}>Review your cart</Link>
              </p>
            )}
            {submitError && (
              <div style={{ color: '#dc2626', fontSize: 14, margin: '8px 0' }}>
                {submitError.message}
                {submitError.issues.map((i) => (
                  <div key={i.productId}>• {i.message}</div>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={blocked || loading || placing}
              style={{ ...button(blocked || loading || placing), width: '100%', marginTop: 12 }}
            >
              {placing ? 'Placing order…' : 'Place order'}
            </button>
          </CartSummary>
        </div>
      </form>
    </div>
  );
}

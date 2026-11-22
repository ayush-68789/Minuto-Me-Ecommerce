// Owner: M5
import { useState, useRef, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useCart, { useCartQuote } from '../../hooks/useCart';
import { createOrder } from '../../api/orderApi';
import AddressForm, { emptyAddress, validateAddress } from '../../components/cart/AddressForm';
import CartSummary from '../../components/cart/CartSummary';
import useAuth from '../../hooks/useAuth';
import { button, card, formatMoney, page } from '../../components/cart/money';

// Generate or retrieve cryptographically secure idempotency key preserved across page refresh
const getSecureKey = (slug) => {
  const storageKey = `minuto_idem_${slug}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing && existing.length >= 8) return existing;
  } catch {
    /* ignore storage errors */
  }

  const secureCrypto = typeof crypto !== 'undefined' ? crypto : null;
  if (!secureCrypto?.randomUUID && !secureCrypto?.getRandomValues) {
    throw new Error('Secure checkout is unavailable in this browser.');
  }
  let generated;
  if (secureCrypto.randomUUID) generated = `idem_${secureCrypto.randomUUID()}`;
  else {
    const bytes = secureCrypto.getRandomValues(new Uint8Array(16));
    generated = `idem_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
  }

  try {
    sessionStorage.setItem(storageKey, generated);
  } catch {
    /* ignore storage errors */
  }

  return generated;
};

export default function Checkout() {
  const navigate = useNavigate();
  const { slug, items, clearCart, rememberOrder } = useCart();
  const { user, updateCustomerProfile } = useAuth();
  const { quote, error: quoteError, loading } = useCartQuote(slug, items);

  const [details, setDetails] = useState(() => user ? {
    customerInfo: { ...emptyAddress.customerInfo, name: user.name || '', email: user.email || '', phone: user.phone || '' },
    shippingAddress: { ...emptyAddress.shippingAddress, ...(user.shippingAddress || {}) },
  } : emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [saveProfile, setSaveProfile] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [quoteNotice, setQuoteNotice] = useState(null);
  const [overrideQuote, setOverrideQuote] = useState(null);
  const [quoteMismatchCount, setQuoteMismatchCount] = useState(0);
  const [quoteStale, setQuoteStale] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Maintain stable idempotency key across retries and refreshes of the same attempt
  const idempotencyKeyRef = useRef(getSecureKey(slug));

  useEffect(() => {
    if (!user) return;
    setDetails({
      customerInfo: { ...emptyAddress.customerInfo, name: user.name || '', email: user.email || '', phone: user.phone || '' },
      shippingAddress: { ...emptyAddress.shippingAddress, ...(user.shippingAddress || {}) },
    });
  }, [user?.id]);

  const effectiveQuote = overrideQuote || quote;

  if (!items.length && !placing) return <Navigate to={`/store/${slug}/cart`} replace />;

  const currency = effectiveQuote?.store?.currency;
  const blocked = !effectiveQuote || (effectiveQuote.issues && effectiveQuote.issues.length > 0);

  const placeOrder = async (e) => {
    e.preventDefault();
    const found = validateAddress(details);
    setErrors(found);
    if (Object.keys(found).length) return;

    if (!effectiveQuote?.quoteHash) {
      setSubmitError({ message: 'Waiting for pricing confirmation. Please wait a moment.' });
      return;
    }

    setPlacing(true);
    setSubmitError(null);

    try {
      const orderPayload = {
        ...details,
        paymentMethod,
        quoteHash: effectiveQuote.quoteHash,
        idempotencyKey: idempotencyKeyRef.current,
      };

      const result = await createOrder(slug, items, orderPayload, idempotencyKeyRef.current);
      const order = result.order;

      if (saveProfile && user?.role === 'customer') {
        try {
          await updateCustomerProfile({ phone: details.customerInfo.phone, shippingAddress: details.shippingAddress, storeSlug: slug });
        } catch {
          // The order is already confirmed; a profile-save error must not make checkout appear to fail.
        }
      }

      // Clean up session idempotency key upon successful checkout
      try {
        sessionStorage.removeItem(`minuto_idem_${slug}`);
      } catch {
        /* ignore */
      }

      rememberOrder(slug, order._id);
      clearCart(slug);

      navigate(`/store/${slug}/orders/${order._id}`, {
        replace: true,
      });
    } catch (err) {
      if (err.code === 'QUOTE_CHANGED' && err.updatedQuote && quoteMismatchCount === 0) {
        setQuoteMismatchCount(1);
        setOverrideQuote(err.updatedQuote);
        setQuoteNotice(err.message);
        // Refresh idempotency key for the newly confirmed attempt
        try {
          sessionStorage.removeItem(`minuto_idem_${slug}`);
        } catch {
          /* ignore */
        }
        idempotencyKeyRef.current = getSecureKey(slug);
      } else {
        if (err.code === 'QUOTE_CHANGED') {
          setQuoteStale(true);
          setSubmitError({ message: 'Prices changed again. Reload checkout to review the latest quote before placing your order.' });
        } else setSubmitError(err);
      }
      setPlacing(false);
    }
  };

  return (
    <div style={page}>
      <Link to={`/store/${slug}/cart`}>← Back to cart</Link>
      <h1>Checkout</h1>

      {quoteNotice && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            color: '#92400e',
            borderRadius: 8,
            padding: '14px 18px',
            marginBottom: 20,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <strong>Price Update:</strong> {quoteNotice}
          <div style={{ marginTop: 6, fontWeight: 600 }}>
            Updated Total: {formatMoney(effectiveQuote?.total, currency)}. Click &quot;Confirm & Place Order&quot; below to proceed.
          </div>
        </div>
      )}

      <form onSubmit={placeOrder} noValidate style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 420px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section style={card}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>Contact & shipping</h2>
            <AddressForm value={details} onChange={setDetails} errors={errors} savedAccount={user?.role === 'customer'} />
            {user?.role === 'customer' && <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, fontSize: 14 }}>
              <input type="checkbox" checked={saveProfile} onChange={(event) => setSaveProfile(event.target.checked)} />
              Save phone and address changes to my account
            </label>}
          </section>
          <section style={card}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>Payment method</h2>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, border: `1px solid ${paymentMethod === 'cod' ? '#2563eb' : '#d1d5db'}`, borderRadius: 8, marginBottom: 10 }}>
              <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
              <span><strong>Cash on delivery</strong><br /><span style={{ color: '#64748b', fontSize: 13 }}>Pay the store when your order arrives.</span></span>
            </label>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 12, border: `1px solid ${paymentMethod === 'online' ? '#2563eb' : '#d1d5db'}`, borderRadius: 8 }}>
              <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
              <span><strong>Pay online</strong><br /><span style={{ color: '#64748b', fontSize: 13 }}>Online payment is not available yet. This records your preference; no charge will be made.</span></span>
            </label>
          </section>
        </div>

        <div style={{ flex: '1 1 280px' }}>
          <CartSummary
            subtotal={effectiveQuote?.subtotal}
            shippingFee={effectiveQuote?.shippingFee}
            total={effectiveQuote?.total}
            currency={currency}
          >
            {effectiveQuote?.items?.map((i) => (
              <div key={String(i.product || i.id)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>{formatMoney(i.price * i.quantity, currency)}</span>
              </div>
            ))}
            {quoteError && <p style={{ color: '#dc2626' }}>{quoteError.message}</p>}
            {effectiveQuote?.issues?.length > 0 && (
              <p style={{ color: '#dc2626', fontSize: 14 }}>
                Some items changed. <Link to={`/store/${slug}/cart`}>Review your cart</Link>
              </p>
            )}
            {submitError && (
              <div style={{ color: '#dc2626', fontSize: 14, margin: '8px 0' }}>
                {submitError.message}
                {submitError.issues?.map((i) => (
                  <div key={i.productId}>• {i.message}</div>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={blocked || loading || placing || quoteStale}
              style={{ ...button(blocked || loading || placing || quoteStale), width: '100%', marginTop: 12 }}
            >
            {placing ? 'Confirming order…' : quoteNotice ? 'Confirm total & place order' : 'Place order'}
            </button>
          </CartSummary>
        </div>
      </form>
    </div>
  );
}

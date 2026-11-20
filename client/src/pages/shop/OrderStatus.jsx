// Owner: M5
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { simulatePayment, trackOrder } from '../../api/orderApi';
import CartSummary from '../../components/cart/CartSummary';
import { button, card, formatMoney, page, statusColors } from '../../components/cart/money';

const steps = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function OrderStatus() {
  const { slug, orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { guestOrders } = useCart();

  const [email, setEmail] = useState(
    searchParams.get('email') || guestOrders.find((o) => o.id === orderId)?.email || ''
  );
  const [emailInput, setEmailInput] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [lookup, setLookup] = useState(0);

  useEffect(() => {
    if (!email) return;
    setError(null);
    trackOrder(orderId, email).then(setData).catch(setError);
  }, [orderId, email, lookup]);

  const pay = async () => {
    setPaying(true);
    try {
      const { order } = await simulatePayment(orderId, email);
      setData((d) => ({ ...d, order }));
    } catch (err) {
      setError(err);
    } finally {
      setPaying(false);
    }
  };

  if (!email || (error && !data)) {
    return (
      <div style={{ ...page, maxWidth: 480 }}>
        <h1>Find your order</h1>
        {error && <p style={{ color: '#dc2626' }}>{error.message}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setData(null);
            setError(null);
            setEmail(emailInput.trim());
            setLookup((n) => n + 1);
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            type="email"
            required
            placeholder="Email used at checkout"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <button type="submit" style={button(false)}>
            Look up
          </button>
        </form>
      </div>
    );
  }

  if (!data) return <div style={page}>Loading order…</div>;

  const { order, store } = data;
  const currency = store.currency;
  const currentStep = steps.indexOf(order.status);
  const canPay =
    order.payment.method === 'online' && order.status === 'pending' && order.payment.status !== 'paid';
  const a = order.shippingAddress;

  return (
    <div style={page}>
      <Link to={`/store/${slug}/orders`}>← My orders</Link>
      <h1 style={{ marginBottom: 4 }}>Order #{order._id.slice(-8).toUpperCase()}</h1>
      <p style={{ color: 'var(--s-muted, #6b7280)', marginTop: 0 }}>
        Placed {new Date(order.createdAt).toLocaleString()} at {store.name}
      </p>

      <section style={{ ...card, marginBottom: 24 }}>
        {order.status === 'cancelled' ? (
          <strong style={{ color: statusColors.cancelled }}>This order was cancelled.</strong>
        ) : (
          <ol style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0, gap: 8 }}>
            {steps.map((step, i) => (
              <li key={step} style={{ flex: 1, textAlign: 'center', fontSize: 14, textTransform: 'capitalize' }}>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    marginBottom: 8,
                    background: i <= currentStep ? statusColors[order.status] : '#e5e7eb',
                  }}
                />
                <span style={{ fontWeight: i === currentStep ? 700 : 400 }}>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {error && <p style={{ color: '#dc2626' }}>{error.message}</p>}

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '2 1 420px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section style={card}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>Items</h2>
            {order.items.map((item) => (
              <div key={item.product} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatMoney(item.price * item.quantity, currency)}</span>
              </div>
            ))}
          </section>
          <section style={card}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>Shipping to</h2>
            <div>{order.customerInfo.name}</div>
            <div>
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ''}
            </div>
            <div>
              {a.city}, {a.state} {a.postalCode}, {a.country}
            </div>
            <div style={{ color: 'var(--s-muted, #6b7280)', marginTop: 8 }}>
              {order.customerInfo.phone} · {order.customerInfo.email}
            </div>
          </section>
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <CartSummary
            subtotal={order.subtotal}
            shippingFee={order.shippingFee}
            total={order.total}
            currency={currency}
          >
            <div style={{ fontSize: 14 }}>
              Payment: {order.payment.method === 'cod' ? 'Cash on delivery' : 'Online'} ·{' '}
              <span style={{ textTransform: 'capitalize' }}>{order.payment.status}</span>
            </div>
            {canPay && (
              <button
                type="button"
                onClick={pay}
                disabled={paying}
                style={{ ...button(paying), width: '100%', marginTop: 12 }}
              >
                {paying ? 'Processing…' : 'Pay now (test mode)'}
              </button>
            )}
          </CartSummary>
        </div>
      </div>
    </div>
  );
}

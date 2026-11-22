// Owner: M5
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { trackOrder } from '../../api/orderApi';
import CartSummary from '../../components/cart/CartSummary';
import { card, formatMoney, page, statusColors } from '../../components/cart/money';

const steps = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function OrderStatus() {
  const { slug, orderId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    trackOrder(orderId)
      .then(setData)
      .catch(setError);
  }, [orderId]);

  if (!data && error) {
    return (
      <div style={{ ...page, maxWidth: 480 }}>
        <h1>Order status unavailable</h1>
        <p className="muted" style={{ fontSize: 14 }}>{error.message}</p>
        <Link to={`/store/${slug}/orders`}>Return to order history</Link>
      </div>
    );
  }

  if (!data) return <div style={page}>Loading order status…</div>;

  const { order, store } = data;
  const currency = store.currency;
  const currentStep = steps.indexOf(order.status);

  return (
    <div style={page}>
      <Link to={`/store/${slug}/orders`}>← My orders</Link>
      <h1 style={{ marginBottom: 4 }}>Order #{order._id.slice(-8).toUpperCase()}</h1>
      {order.status === 'confirmed' && <p role="status" style={{ color: '#15803d', fontWeight: 700 }}>Your order is confirmed. The store will update its delivery status here.</p>}
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
              <div key={item.product || item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatMoney(item.price * item.quantity, currency)}</span>
              </div>
            ))}
          </section>
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <CartSummary
            subtotal={order.subtotal}
            shippingFee={order.shippingFee}
            total={order.total}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
}

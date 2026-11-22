// Owner: M5
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useStore } from '../../context/StoreContext';
import { fetchMyOrder, trackOrder } from '../../api/orderApi';
import { card, formatMoney, page, statusColors } from '../../components/cart/money';

const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
const panel = { ...card, borderRadius: 18, padding: 22 };

function Address({ address }) {
  if (!address) return <p style={{ color: 'var(--s-muted, #64748b)', marginBottom: 0 }}>Delivery details are available to the signed-in customer.</p>;
  const cityLine = [address.city, address.state].filter(Boolean).join(', ');
  return <address style={{ fontStyle: 'normal', lineHeight: 1.7 }}>
    {address.line1}{address.line2 && <><br />{address.line2}</>}
    {cityLine && <><br />{cityLine}</>}
    {address.postalCode && <> · {address.postalCode}</>}
    {address.country && <><br />{address.country}</>}
  </address>;
}

export default function OrderStatus() {
  const { slug, orderId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { store: currentStore, loading: storeLoading } = useStore();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || storeLoading) return;
    let cancelled = false;
    const isStoreCustomer = user?.role === 'customer'
      && String(user.customerStore) === String(currentStore?._id);
    setLoading(true);
    setData(null);
    setError(null);
    const request = isStoreCustomer ? fetchMyOrder(orderId, slug) : trackOrder(orderId);
    request
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authLoading, storeLoading, user?.id, user?.role, user?.customerStore, currentStore?._id, orderId, slug]);

  if (loading) return <div style={page}>Loading order details…</div>;
  if (!data && error) {
    return (
      <div style={{ ...page, maxWidth: 520 }}>
        <Link to={`/store/${slug}/orders`}>← My orders</Link>
        <h1>Order details unavailable</h1>
        <p className="muted" style={{ fontSize: 14 }}>{error.message}</p>
        <Link to={`/store/${slug}/orders`}>Return to order history</Link>
      </div>
    );
  }
  if (!data) return null;

  const { order, store } = data;
  const currency = store.currency;
  const currentStep = steps.indexOf(order.status);
  const customer = order.customerInfo;
  const address = order.shippingAddress;
  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online payment';

  return (
    <div style={{ ...page, maxWidth: 1040 }}>
      <Link to={`/store/${slug}/orders`} style={{ color: 'var(--s-primary, #2563eb)', fontWeight: 600 }}>← My orders</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', margin: '20px 0 22px' }}>
        <div>
          <p style={{ color: 'var(--s-muted, #64748b)', fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>Order details</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(27px, 4vw, 36px)' }}>Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p style={{ color: 'var(--s-muted, #64748b)', margin: '9px 0 0' }}>
            Placed {new Date(order.createdAt).toLocaleString()} · {store.name}
          </p>
        </div>
        <span style={{ background: `${statusColors[order.status] || '#64748b'}18`, color: statusColors[order.status] || '#64748b', borderRadius: 999, padding: '8px 13px', fontWeight: 700, textTransform: 'capitalize' }}>
          {order.status}
        </span>
      </div>

      {order.status === 'confirmed' && <p role="status" style={{ color: '#15803d', fontWeight: 700 }}>Your order is confirmed. The store will update its delivery status here.</p>}

      <section style={{ ...panel, marginBottom: 22 }} aria-label="Order progress">
        {order.status === 'cancelled' ? (
          <strong style={{ color: statusColors.cancelled }}>This order was cancelled.</strong>
        ) : (
          <ol style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0, gap: 8 }}>
            {steps.map((step, i) => (
              <li key={step} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 13, textTransform: 'capitalize' }}>
                <div style={{ height: 6, borderRadius: 3, marginBottom: 9, background: i <= currentStep ? statusColors[order.status] : '#e5e7eb' }} />
                <span style={{ fontWeight: i === currentStep ? 700 : 400 }}>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="order-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(260px, .9fr)', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <section style={panel}>
            <h2 style={{ fontSize: 19, margin: '0 0 16px' }}>Items ({order.items.reduce((sum, item) => sum + item.quantity, 0)})</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              {order.items.map((item, index) => (
                <div key={`${item.product || item.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: '76px minmax(0, 1fr) auto', gap: 14, alignItems: 'center', borderTop: index ? '1px solid var(--s-line, #e5e7eb)' : 'none', paddingTop: index ? 14 : 0 }}>
                  <div style={{ width: 76, height: 76, borderRadius: 12, background: 'var(--s-bg, #f3f4f6)', border: '1px solid var(--s-line, #e5e7eb)', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                    {item.image ? <img src={item.image} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span aria-hidden="true" style={{ fontSize: 25 }}>📦</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{item.name}</div>
                    <div style={{ color: 'var(--s-muted, #64748b)', fontSize: 14, marginTop: 5 }}>Qty {item.quantity} · {formatMoney(item.price, currency)} each</div>
                  </div>
                  <strong style={{ whiteSpace: 'nowrap' }}>{formatMoney(item.price * item.quantity, currency)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section style={panel}>
            <h2 style={{ fontSize: 19, margin: '0 0 14px' }}>Delivery details</h2>
            {customer && <div style={{ marginBottom: 13, lineHeight: 1.7 }}>
              <strong>{customer.name}</strong><br />
              {customer.email && <a href={`mailto:${customer.email}`} style={{ color: 'inherit' }}>{customer.email}</a>}
              {customer.phone && <><br /><a href={`tel:${customer.phone}`} style={{ color: 'inherit' }}>{customer.phone}</a></>}
            </div>}
            <Address address={address} />
          </section>
        </div>

        <aside style={{ display: 'grid', gap: 18 }}>
          <section style={panel}>
            <h2 style={{ fontSize: 19, margin: '0 0 14px' }}>Order summary</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}><span>Subtotal</span><span>{formatMoney(order.subtotal, currency)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}><span>Shipping</span><span>{order.shippingFee ? formatMoney(order.shippingFee, currency) : 'Free'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: '1px solid var(--s-line, #e5e7eb)', paddingTop: 13, fontWeight: 800, fontSize: 18 }}><span>Total</span><span>{formatMoney(order.total, currency)}</span></div>
          </section>
          <section style={panel}>
            <h2 style={{ fontSize: 19, margin: '0 0 12px' }}>Payment</h2>
            <div style={{ fontWeight: 600 }}>{paymentLabel}</div>
          </section>
        </aside>
      </div>
      <style>{'@media (max-width: 700px) { .order-detail-grid { grid-template-columns: 1fr !important; } }'}</style>
    </div>
  );
}

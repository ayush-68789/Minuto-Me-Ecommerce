// Owner: M5
// Logged-in customers see their account's orders; guests see orders placed from this device.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { fetchMyOrders, trackOrder } from '../../api/orderApi';
import OrderCard from '../../components/cart/OrderCard';
import { page } from '../../components/cart/money';

export default function OrderHistory() {
  const { slug, guestOrders } = useCart();
  const [orders, setOrders] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState(null);
  const guestKey = guestOrders.map((o) => o.id).join(',');

  useEffect(() => {
    let cancelled = false;

    const loadGuestOrders = async () => {
      const results = await Promise.allSettled(guestOrders.map((o) => trackOrder(o.id, o.email)));
      return results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => ({ ...r.value.order, currency: r.value.store.currency, email: r.value.order.customerInfo.email }));
    };

    fetchMyOrders(slug)
      .then(({ orders: mine }) => {
        if (cancelled) return;
        setIsGuest(false);
        setOrders(mine.map((o) => ({ ...o, currency: o.store?.currency })));
      })
      .catch(async (err) => {
        if (err.status !== 401) {
          if (!cancelled) setError(err);
          return;
        }
        const found = await loadGuestOrders();
        if (!cancelled) {
          setIsGuest(true);
          setOrders(found);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, guestKey]);

  return (
    <div style={{ ...page, maxWidth: 720 }}>
      <Link to={`/store/${slug}`}>← Back to store</Link>
      <h1>My orders</h1>
      {isGuest && (
        <p style={{ color: 'var(--s-muted, #6b7280)' }}>
          Showing orders placed on this device. <Link to="/login">Log in</Link> to see all your orders.
        </p>
      )}
      {error && <p style={{ color: '#dc2626' }}>{error.message}</p>}
      {!orders && !error && <p>Loading…</p>}
      {orders && !orders.length && <p>No orders yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {orders?.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            currency={order.currency}
            to={`/store/${slug}/orders/${order._id}${
              order.email ? `?email=${encodeURIComponent(order.email)}` : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
}

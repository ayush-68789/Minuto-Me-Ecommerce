// Owner: Member 5 — Order history page showing customer past orders and statuses.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderModel from '../../models/orderModel.js';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        const list = await orderModel.listOrders();
        setOrders(list);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      processing: { bg: '#dcfce7', text: '#15803d', label: 'Processing' },
      paid: { bg: '#dcfce7', text: '#15803d', label: 'Paid' },
      shipped: { bg: '#e0f2fe', text: '#0369a1', label: 'Shipped' },
      delivered: { bg: '#f1f5f9', text: '#0f172a', label: 'Delivered' },
      cancelled: { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelled' },
      pending: { bg: '#fef3c7', text: '#b45309', label: 'Pending Payment' }
    };
    const s = map[status] || { bg: '#f1f5f9', text: '#334155', label: status };
    return (
      <span style={{ padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, background: s.bg, color: s.text, textTransform: 'capitalize' }}>
        ● {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="page">
        <p className="eyebrow">M5 · Order History</p>
        <h1>Your Orders</h1>
        <p>Loading order history...</p>
      </main>
    );
  }

  return (
    <main className="page" style={{ maxWidth: '880px' }}>
      <p className="eyebrow">M5 · Order History</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Order History</h1>
        <span style={{ color: '#58627a', fontSize: '0.95rem' }}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
        </span>
      </div>

      {error && (
        <div style={{ padding: '0.9rem 1.2rem', marginBottom: '1.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '3.5rem 2rem', textAlign: 'center', border: '1px solid #e6e8ee' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h2 style={{ fontSize: '1.35rem', margin: '0 0 0.5rem 0' }}>No orders yet</h2>
          <p style={{ color: '#58627a', marginBottom: '2rem' }}>When you complete a purchase, your orders will appear here.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/cart" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#172033', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              Go to Cart
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => {
            const itemCount = (order.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
            return (
              <div
                key={order.id}
                style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e6e8ee', overflow: 'hidden' }}
              >
                {/* Order card top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#f8fafc', padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order ID</div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{order.id}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date Placed</div>
                      <div style={{ color: '#334155' }}>
                        {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>${order.pricing?.total?.toFixed(2)}</div>
                    </div>
                  </div>

                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Order card body */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {(order.items || []).map(i => `${i.title} (×${i.quantity})`).join(', ')}
                    </div>
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    style={{ padding: '0.55rem 1.15rem', background: '#f1f5f9', color: '#1e293b', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

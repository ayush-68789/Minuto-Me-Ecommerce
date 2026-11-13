// Owner: Member 5 — Order detail page showing status, shipping address, lines, and payment.
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderModel from '../../models/orderModel.js';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);
        const data = await orderModel.getOrder(id);
        setOrderData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="page">
        <p className="eyebrow">M5 · Order Details</p>
        <h1>Order Status</h1>
        <p>Loading order details...</p>
      </main>
    );
  }

  if (error || !orderData?.order) {
    return (
      <main className="page" style={{ maxWidth: '650px', textAlign: 'center' }}>
        <p className="eyebrow">M5 · Order Details</p>
        <h1>Order Not Found</h1>
        <p style={{ color: '#ef4444', marginBottom: '2rem' }}>{error || `Unable to find order "${id}"`}</p>
        <Link
          to="/orders"
          style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#172033', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
        >
          View My Orders
        </Link>
      </main>
    );
  }

  const order = orderData.order;
  const items = order.items || [];
  const pricing = order.pricing || { subtotal: 0, shipping: 0, tax: 0, total: 0 };
  const payment = order.payment || {};
  const shippingAddress = order.shippingAddress || {};

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
      <span style={{ padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, background: s.bg, color: s.text, textTransform: 'capitalize' }}>
        ● {s.label}
      </span>
    );
  };

  return (
    <main className="page" style={{ maxWidth: '850px' }}>
      <p className="eyebrow">M5 · Order Confirmation & Details</p>

      {/* Confirmation Top Box */}
      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ fontSize: '2.5rem' }}>🎉</div>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0', color: '#065f46', fontSize: '1.25rem' }}>Thank you for your order!</h2>
          <p style={{ margin: 0, color: '#047857', fontSize: '0.92rem' }}>
            We received your order and payment. A confirmation has been registered for {order.customer?.email || 'your account'}.
          </p>
        </div>
      </div>

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.8rem' }}>Order {order.id}</h1>
          <div style={{ color: '#58627a', fontSize: '0.88rem' }}>
            Placed on {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>
        <div>{getStatusBadge(order.status)}</div>
      </div>

      {/* Order Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(240px, 1.2fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Items */}
        <section style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e6e8ee' }}>
          <h2 style={{ fontSize: '1.15rem', marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid #f1f3f7', paddingBottom: '0.5rem' }}>
            Purchased Items
          </h2>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map(item => (
              <li key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '42px', height: '42px', background: '#f8fafc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', border: '1px solid #e2e8f0' }}>
                    {item.image || '📦'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.82rem' }}>Qty: {item.quantity} × ${Number(item.price).toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>${Number(item.total).toFixed(2)}</div>
              </li>
            ))}
          </ul>

          <div style={{ borderTop: '1px solid #e6e8ee', marginTop: '1.25rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.92rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Subtotal</span>
              <span style={{ color: '#1e293b' }}>${pricing.subtotal?.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Shipping</span>
              <span style={{ color: '#1e293b' }}>{pricing.shipping === 0 ? 'FREE' : `$${pricing.shipping?.toFixed(2)}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Tax</span>
              <span style={{ color: '#1e293b' }}>${pricing.tax?.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f3f7', paddingTop: '0.75rem', marginTop: '0.25rem', fontWeight: 800, fontSize: '1.15rem' }}>
              <span>Total Paid</span>
              <span>${pricing.total?.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Right Column: Customer & Delivery Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Delivery Card */}
          <section style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e6e8ee' }}>
            <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '0.75rem', color: '#334155' }}>📍 Delivery Address</h3>
            <div style={{ fontSize: '0.92rem', lineHeight: 1.5, color: '#475569' }}>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{shippingAddress.fullName || order.customer?.name}</div>
              <div>{shippingAddress.street}</div>
              <div>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</div>
              <div>{shippingAddress.country}</div>
            </div>
          </section>

          {/* Payment Card */}
          <section style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e6e8ee' }}>
            <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '0.75rem', color: '#334155' }}>💳 Payment Info</h3>
            <div style={{ fontSize: '0.88rem', lineHeight: 1.5, color: '#475569' }}>
              <div><strong>Method:</strong> {payment.method}</div>
              <div><strong>Status:</strong> {payment.status}</div>
              {payment.paymentId && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Ref: {payment.paymentId}</div>}
            </div>
          </section>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              to="/orders"
              style={{ display: 'block', textAlign: 'center', padding: '0.75rem', background: '#172033', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.92rem' }}
            >
              View All Orders
            </Link>
            <Link
              to="/shop"
              style={{ display: 'block', textAlign: 'center', padding: '0.75rem', background: '#ffffff', color: '#172033', border: '1px solid #cbd5e1', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.92rem' }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}


import { useCallback, useEffect, useState } from 'react';
import { deleteOrder, fetchStoreOrders, updateOrderStatus } from '../../api/orderApi';
import Sidebar from '../../components/dashboard/Sidebar';
import { fetchStoreSettings } from '../../api/productApi';

const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const label = (status) => status.replaceAll('_', ' ');
const statusStyle = {
  pending: { color: '#92400e', background: '#fef3c7' },
  confirmed: { color: '#1d4ed8', background: '#dbeafe' },
  shipped: { color: '#6d28d9', background: '#ede9fe' },
  delivered: { color: '#166534', background: '#dcfce7' },
  cancelled: { color: '#991b1b', background: '#fee2e2' },
};

export default function ManageOrders() {
  const [store, setStore] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchStoreOrders({ status: statusFilter === 'all' ? undefined : statusFilter, limit: 100 });
      setOrders(result.orders || []);
    } catch (err) {
      setError(err.message || 'Could not load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { fetchStoreSettings().then((result) => setStore(result.store)).catch(() => {}); }, []);

  const changeStatus = async (order, status) => {
    if (status === 'cancelled' && !window.confirm('Cancel this order and restock its items?')) return;
    setBusyId(order._id);
    setError('');
    try {
      const result = await updateOrderStatus(order._id, status);
      setOrders((current) => current
        .map((item) => item._id === order._id ? result.order : item)
        .filter((item) => statusFilter === 'all' || item.status === statusFilter));
    } catch (err) {
      setError(err.message || 'Could not update order status');
    } finally {
      setBusyId('');
    }
  };

  const removeOrder = async (order) => {
    if (!window.confirm(`Remove order #${order._id.slice(-8).toUpperCase()} from order history?`)) return;
    setBusyId(order._id);
    setError('');
    try {
      await deleteOrder(order._id);
      setOrders((current) => current.filter((item) => item._id !== order._id));
    } catch (err) {
      setError(err.message || 'Could not remove the order');
    } finally {
      setBusyId('');
    }
  };

  const currency = store?.currency || 'INR';
  const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value || 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar store={store} />
      <main style={{ flex: 1, minWidth: 0, padding: '32px clamp(16px, 4vw, 48px)' }}>
        <header style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a' }}>Manage orders</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>Review orders and update their delivery status.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select aria-label="Filter orders by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff' }}>
              <option value="all">All statuses</option>
              {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </select>
            <button type="button" onClick={loadOrders} disabled={loading} style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>Refresh</button>
          </div>
        </header>

        {error && <div role="alert" style={{ marginBottom: 16, padding: 12, borderRadius: 8, color: '#991b1b', background: '#fef2f2' }}>{error}</div>}
        {loading ? <p>Loading orders…</p> : orders.length === 0 ? (
          <section style={{ padding: 32, textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#64748b' }}>No orders found.</section>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {orders.map((order) => (
              <article key={order._id} style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', boxShadow: '0 1px 2px #0f172a08' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                  <div>
                    <strong>Order #{order._id.slice(-8).toUpperCase()}</strong>
                    <div style={{ marginTop: 5, color: '#64748b', fontSize: 13 }}>{new Date(order.createdAt).toLocaleString()}</div>
                    <div style={{ marginTop: 10, color: '#0f172a' }}>{order.customerInfo?.name || 'Customer'} · {order.customerInfo?.phone || ''}</div>
                    <div style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{money(order.total)}</div>
                    <span style={{ display: 'inline-block', marginTop: 6, padding: '4px 9px', borderRadius: 999, ...statusStyle[order.status], textTransform: 'capitalize', fontSize: 12, fontWeight: 700 }}>{label(order.status)}</span>
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', color: '#475569', fontSize: 14 }}>
                  {order.items.map((item) => <div key={`${item.product}-${item.name}`}>{item.name} × {item.quantity} <span style={{ color: '#64748b' }}>· {money(item.price * item.quantity)}</span></div>)}
                </div>

                <footer style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 16 }}>
                  <span style={{ marginRight: 'auto', fontSize: 13, color: '#64748b' }}>{order.customerInfo?.email}</span>
                  {transitions[order.status]?.map((next) => (
                    <button key={next} type="button" disabled={busyId === order._id} onClick={() => changeStatus(order, next)} style={{ padding: '8px 11px', border: '1px solid #cbd5e1', borderRadius: 7, background: next === 'cancelled' ? '#fff7f7' : '#fff', color: next === 'cancelled' ? '#b91c1c' : '#1e293b', cursor: busyId === order._id ? 'wait' : 'pointer', textTransform: 'capitalize' }}>
                      {busyId === order._id ? 'Saving…' : next === 'confirmed' ? 'Confirm order' : next === 'cancelled' ? 'Cancel order' : `Mark ${label(next)}`}
                    </button>
                  ))}
                  {(order.status === 'delivered' || (order.status === 'cancelled' && order.cancellationState === 'completed')) && <button type="button" disabled={busyId === order._id} onClick={() => removeOrder(order)} style={{ padding: '8px 11px', border: '1px solid #fecaca', borderRadius: 7, background: '#fff7f7', color: '#b91c1c', cursor: busyId === order._id ? 'wait' : 'pointer' }}>{busyId === order._id ? 'Saving…' : 'Delete history'}</button>}
                </footer>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

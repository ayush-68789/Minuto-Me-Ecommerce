// Owner: M2 - Products & Dashboard
import React from 'react';
import { formatCurrency, formatDate } from '../../utils/validators';

export default function RecentOrders({ orders = [], currency = 'USD' }) {
  // Demo mock orders when none provided
  const sampleOrders = orders.length > 0 ? orders : [
    { id: 'ORD-1092', customer: 'Sarah Jenkins', items: 3, total: 124.50, status: 'Completed', date: new Date().toISOString() },
    { id: 'ORD-1091', customer: 'David Kim', items: 1, total: 49.00, status: 'Processing', date: new Date(Date.now() - 3600000 * 4).toISOString() },
    { id: 'ORD-1090', customer: 'Elena Rostova', items: 4, total: 289.90, status: 'Completed', date: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: 'ORD-1089', customer: 'Marcus Brody', items: 2, total: 78.00, status: 'Pending', date: new Date(Date.now() - 3600000 * 36).toISOString() },
  ];

  const getOrderStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'processing':
        return <span className="badge badge-warning">Processing</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="dash-table-wrap">
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dash-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 16 }}>Recent Store Orders</h4>
        <span style={{ fontSize: 13, color: 'var(--dash-muted)' }}>Latest activity</span>
      </div>
      <table className="dash-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sampleOrders.map((ord) => (
            <tr key={ord.id}>
              <td style={{ fontWeight: 600 }}>{ord.id}</td>
              <td>{ord.customer}</td>
              <td>{ord.items}</td>
              <td style={{ fontWeight: 600 }}>{formatCurrency(ord.total, currency)}</td>
              <td style={{ color: 'var(--dash-muted)', fontSize: 13 }}>{formatDate(ord.date)}</td>
              <td>{getOrderStatusBadge(ord.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

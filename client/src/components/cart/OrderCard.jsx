// Owner: M5
import { Link } from 'react-router-dom';
import { card, formatMoney, statusColors } from './money';

export default function OrderCard({ order, currency, to }) {
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <Link to={to} style={{ ...card, display: 'block', color: 'inherit', textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Order #{order._id.slice(-8).toUpperCase()}</div>
          <div style={{ color: 'var(--s-muted, #6b7280)', fontSize: 14, marginTop: 4 }}>
            {new Date(order.createdAt).toLocaleDateString()} · {itemCount} item{itemCount === 1 ? '' : 's'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600 }}>{formatMoney(order.total, currency)}</div>
          <div
            style={{ color: statusColors[order.status], fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}
          >
            {order.status}
          </div>
        </div>
      </div>
    </Link>
  );
}

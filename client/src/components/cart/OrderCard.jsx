// Owner: M5
import { Link } from 'react-router-dom';
import { card, formatMoney, statusColors } from './money';

export default function OrderCard({ order, currency, to }) {
  const items = order.items || [];
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const previews = items.filter((item) => item.image).slice(0, 3);
  return (
    <Link to={to} style={{ ...card, display: 'block', color: 'inherit', textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: '1 1 300px' }}>
          {previews.length > 0 && <div style={{ display: 'flex', flexShrink: 0 }}>
            {previews.map((item, index) => <img key={`${item.product || item.name}-${index}`} src={item.image} alt={item.name} loading="lazy" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--s-surface, #fff)', marginLeft: index ? -10 : 0 }} onError={(event) => { event.currentTarget.style.display = 'none'; }} />)}
          </div>}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>Order #{order._id.slice(-8).toUpperCase()}</div>
            <div style={{ color: 'var(--s-muted, #6b7280)', fontSize: 14, marginTop: 4 }}>
              {new Date(order.createdAt).toLocaleDateString()} · {itemCount} item{itemCount === 1 ? '' : 's'}
            </div>
            <div style={{ color: 'var(--s-muted, #6b7280)', fontSize: 13, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {items.slice(0, 2).map((item) => item.name).join(', ')}{items.length > 2 ? ` +${items.length - 2} more` : ''}
            </div>
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

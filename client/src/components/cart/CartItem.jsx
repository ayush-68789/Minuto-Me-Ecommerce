// Owner: M5
import { formatMoney } from './money';

export default function CartItem({ item, currency, issue, onQuantityChange, onRemove }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--s-line, #f3f4f6)' }}>
      <div
        style={{
          width: 80,
          height: 80,
          flexShrink: 0,
          borderRadius: 8,
          background: item.image ? `center / cover no-repeat url("${item.image}")` : '#f3f4f6',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{item.name}</div>
        <div style={{ color: 'var(--s-muted, #6b7280)', fontSize: 14, marginTop: 4 }}>{formatMoney(item.price, currency)} each</div>
        {issue && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 6 }}>{issue.message}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onQuantityChange(item.quantity - 1)}
            style={qtyButton}
          >
            −
          </button>
          <span style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQuantityChange(item.quantity + 1)}
            disabled={item.stock != null && item.quantity >= item.stock}
            style={qtyButton}
          >
            +
          </button>
          <button
            type="button"
            onClick={onRemove}
            style={{ marginLeft: 12, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      </div>
      <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatMoney(item.price * item.quantity, currency)}</div>
    </div>
  );
}

const qtyButton = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: 'var(--s-surface, #fff)',
  cursor: 'pointer',
};

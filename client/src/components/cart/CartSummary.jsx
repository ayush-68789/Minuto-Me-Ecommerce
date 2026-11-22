// Owner: M5
import { card, formatMoney } from './money';

export default function CartSummary({ subtotal, shippingFee = 0, total, currency, children }) {
  const row = { display: 'flex', justifyContent: 'space-between', marginBottom: 10 };
  return (
    <div style={card}>
      <h2 style={{ fontSize: 18, margin: '0 0 16px' }}>Order summary</h2>
      <div style={row}>
        <span>Subtotal</span>
        <span>{formatMoney(subtotal, currency)}</span>
      </div>
      <div style={row}>
        <span>Shipping</span>
        <span>{shippingFee ? formatMoney(shippingFee, currency) : 'Free'}</span>
      </div>
      <div style={{ ...row, fontWeight: 700, fontSize: 18, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
        <span>Total</span>
        <span>{formatMoney(total, currency)}</span>
      </div>
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

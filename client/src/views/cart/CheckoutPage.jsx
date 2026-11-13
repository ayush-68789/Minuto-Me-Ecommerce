// Owner: Member 5 — Checkout page with customer contact, shipping address, and payment selection.
import { useNavigate, Link } from 'react-router-dom';
import useCartController from '../../controllers/useCartController.js';
import useCheckoutController from '../../controllers/useCheckoutController.js';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, loading: cartLoading } = useCartController();
  const {
    formData,
    updateCustomer,
    updateShippingAddress,
    setPaymentMethod,
    submitCheckout,
    submitting,
    error
  } = useCheckoutController({
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 555-0199',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'OR',
    postalCode: '97477',
    country: 'US',
    paymentMethod: 'demo_card'
  });

  const items = cart.items || [];
  const pricing = cart.pricing || { subtotal: 0, shipping: 0, tax: 0, total: 0 };
  const hasItems = items.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const order = await submitCheckout({ fromCart: true });
    if (order && order.id) {
      navigate(`/orders/${order.id}`);
    }
  };

  if (cartLoading) {
    return (
      <main className="page">
        <p className="eyebrow">M5 · Checkout</p>
        <h1>Checkout</h1>
        <p>Loading checkout...</p>
      </main>
    );
  }

  if (!hasItems) {
    return (
      <main className="page" style={{ maxWidth: '650px', textAlign: 'center' }}>
        <p className="eyebrow">M5 · Checkout</p>
        <h1>Your Cart is Empty</h1>
        <p style={{ color: '#58627a', marginBottom: '2rem' }}>
          You need at least one product in your cart before proceeding to checkout.
        </p>
        <Link
          to="/cart"
          style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#172033', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
        >
          ← Return to Cart
        </Link>
      </main>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 0.85rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    marginTop: '0.35rem',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.88rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '0.85rem'
  };

  return (
    <main className="page" style={{ maxWidth: '1020px' }}>
      <p className="eyebrow">M5 · Secure Checkout</p>
      <h1 style={{ marginBottom: '2rem' }}>Complete Your Order</h1>

      {error && (
        <div style={{ padding: '0.9rem 1.2rem', marginBottom: '1.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1.2fr)', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left Column: Checkout Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Step 1: Contact Details */}
          <section style={{ background: '#ffffff', borderRadius: '12px', padding: '1.75rem', border: '1px solid #e6e8ee' }}>
            <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '1.25rem', borderBottom: '1px solid #f1f3f7', paddingBottom: '0.5rem' }}>
              1. Customer Contact
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label style={labelStyle}>
                Full Name *
                <input
                  type="text"
                  required
                  value={formData.customer.name}
                  onChange={(e) => updateCustomer('name', e.target.value)}
                  style={inputStyle}
                  placeholder="e.g. Jane Doe"
                />
              </label>
              <label style={labelStyle}>
                Email Address *
                <input
                  type="email"
                  required
                  value={formData.customer.email}
                  onChange={(e) => updateCustomer('email', e.target.value)}
                  style={inputStyle}
                  placeholder="jane@example.com"
                />
              </label>
            </div>
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              Phone Number
              <input
                type="tel"
                value={formData.customer.phone}
                onChange={(e) => updateCustomer('phone', e.target.value)}
                style={inputStyle}
                placeholder="+1 555-0100"
              />
            </label>
          </section>

          {/* Step 2: Shipping Address */}
          <section style={{ background: '#ffffff', borderRadius: '12px', padding: '1.75rem', border: '1px solid #e6e8ee' }}>
            <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '1.25rem', borderBottom: '1px solid #f1f3f7', paddingBottom: '0.5rem' }}>
              2. Shipping Address
            </h2>
            <label style={labelStyle}>
              Street Address *
              <input
                type="text"
                required
                value={formData.shippingAddress.street}
                onChange={(e) => updateShippingAddress('street', e.target.value)}
                style={inputStyle}
                placeholder="123 Market Street, Apt 4"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <label style={labelStyle}>
                City *
                <input
                  type="text"
                  required
                  value={formData.shippingAddress.city}
                  onChange={(e) => updateShippingAddress('city', e.target.value)}
                  style={inputStyle}
                  placeholder="Springfield"
                />
              </label>
              <label style={labelStyle}>
                State
                <input
                  type="text"
                  value={formData.shippingAddress.state}
                  onChange={(e) => updateShippingAddress('state', e.target.value)}
                  style={inputStyle}
                  placeholder="OR"
                />
              </label>
              <label style={labelStyle}>
                Postal Code
                <input
                  type="text"
                  value={formData.shippingAddress.postalCode}
                  onChange={(e) => updateShippingAddress('postalCode', e.target.value)}
                  style={inputStyle}
                  placeholder="97477"
                />
              </label>
            </div>
          </section>

          {/* Step 3: Payment Method */}
          <section style={{ background: '#ffffff', borderRadius: '12px', padding: '1.75rem', border: '1px solid #e6e8ee' }}>
            <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '1.25rem', borderBottom: '1px solid #f1f3f7', paddingBottom: '0.5rem' }}>
              3. Payment Method
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', border: formData.paymentMethod === 'demo_card' ? '2px solid #172033' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: formData.paymentMethod === 'demo_card' ? '#f8fafc' : '#ffffff' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="demo_card"
                  checked={formData.paymentMethod === 'demo_card'}
                  onChange={() => setPaymentMethod('demo_card')}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>💳 Demo Credit / Debit Card</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Simulates instant verified payment gateway callback</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', border: formData.paymentMethod === 'cod' ? '2px solid #172033' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: formData.paymentMethod === 'cod' ? '#f8fafc' : '#ffffff' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>📦 Cash on Delivery</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Pay upon package arrival at your delivery address</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', border: formData.paymentMethod === 'upi' ? '2px solid #172033' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: formData.paymentMethod === 'upi' ? '#f8fafc' : '#ffffff' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={formData.paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>📱 Instant UPI / QR Transfer</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Simulate instant mobile wallet or app transfer</div>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Summary */}
        <aside style={{ background: '#ffffff', borderRadius: '12px', padding: '1.75rem', border: '1px solid #e6e8ee', position: 'sticky', top: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.25rem' }}>Review Summary</h2>

          {/* Mini items list */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.25rem', borderBottom: '1px solid #f1f3f7', paddingBottom: '0.75rem' }}>
            {items.map(item => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.65rem' }}>
                <span style={{ color: '#334155' }}>
                  {item.title} <span style={{ color: '#94a3b8' }}>× {item.quantity}</span>
                </span>
                <span style={{ fontWeight: 600 }}>${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', fontSize: '0.92rem' }}>
            <span style={{ color: '#58627a' }}>Subtotal</span>
            <span>${pricing.subtotal?.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', fontSize: '0.92rem' }}>
            <span style={{ color: '#58627a' }}>Shipping</span>
            <span>{pricing.shipping === 0 ? <span style={{ color: '#16a34a' }}>FREE</span> : `$${pricing.shipping?.toFixed(2)}`}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
            <span style={{ color: '#58627a' }}>Estimated Tax</span>
            <span>${pricing.tax?.toFixed(2)}</span>
          </div>

          <div style={{ borderTop: '1px solid #e6e8ee', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
            <span>Total</span>
            <span>${pricing.total?.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '0.95rem 1.25rem',
              background: submitting ? '#64748b' : '#172033',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Processing Payment...' : `Place Order · $${pricing.total?.toFixed(2)}`}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/cart" style={{ color: '#58627a', fontSize: '0.85rem', textDecoration: 'none' }}>
              ← Modify Cart Items
            </Link>
          </div>
        </aside>
      </form>
    </main>
  );
}

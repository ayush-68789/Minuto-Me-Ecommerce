// Owner: Member 5 — Cart page showing cart items, quantity adjustments, and totals.
import { Link } from 'react-router-dom';
import useCartController from '../../controllers/useCartController.js';

export default function CartPage() {
  const {
    cart,
    loading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    addDemoItem
  } = useCartController();

  if (loading && (!cart.items || cart.items.length === 0)) {
    return (
      <main className="page">
        <p className="eyebrow">M5 · Cart & Checkout</p>
        <h1>Your Shopping Cart</h1>
        <p>Loading your cart items...</p>
      </main>
    );
  }

  const items = cart.items || [];
  const pricing = cart.pricing || { subtotal: 0, shipping: 0, tax: 0, total: 0 };
  const hasItems = items.length > 0;

  return (
    <main className="page" style={{ maxWidth: '1000px' }}>
      <p className="eyebrow">M5 · Cart & Checkout</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Shopping Cart</h1>
        <span style={{ color: '#58627a', fontSize: '0.95rem' }}>
          {cart.itemCount || 0} {cart.itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {error && (
        <div style={{ padding: '0.9rem 1.2rem', marginBottom: '1.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
          {error}
        </div>
      )}

      {!hasItems ? (
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '3.5rem 2rem', textAlign: 'center', border: '1px solid #e6e8ee' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>Your cart is empty</h2>
          <p style={{ color: '#58627a', marginBottom: '2rem' }}>Explore the store catalog and add items to your cart.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#172033', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              Browse Storefront
            </Link>
            <button
              onClick={addDemoItem}
              type="button"
              style={{ padding: '0.75rem 1.5rem', background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              + Add Demo Product
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: '2rem', alignItems: 'start' }}>
          {/* Items List */}
          <section aria-label="Cart items" style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e6e8ee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f3f7', paddingBottom: '0.75rem', marginBottom: '1rem', color: '#58627a', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Product</span>
              <span>Total</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((item) => (
                <li
                  key={item.productId}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #f1f3f7', gap: '1rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '56px', height: '56px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', border: '1px solid #e2e8f0' }}>
                      {item.image || '📦'}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>{item.title}</h3>
                      <div style={{ color: '#58627a', fontSize: '0.88rem' }}>${Number(item.price).toFixed(2)} each</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Quantity controls */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        style={{ padding: '0.35rem 0.65rem', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span style={{ padding: '0.35rem 0.75rem', minWidth: '32px', textAlign: 'center', fontSize: '0.92rem', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        style={{ padding: '0.35rem 0.65rem', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div style={{ fontWeight: 700, minWidth: '70px', textAlign: 'right' }}>
                      ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', padding: '0.2rem' }}
                      title="Remove product"
                      aria-label={`Remove ${item.title}`}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={addDemoItem}
                style={{ padding: '0.5rem 1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500 }}
              >
                + Add Another Demo Item
              </button>
              <button
                type="button"
                onClick={clearCart}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.88rem', textDecoration: 'underline' }}
              >
                Empty Cart
              </button>
            </div>
          </section>

          {/* Order Summary */}
          <aside aria-label="Order summary" style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e6e8ee', position: 'sticky', top: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.25rem 0' }}>Order Summary</h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              <span style={{ color: '#58627a' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>${pricing.subtotal?.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              <span style={{ color: '#58627a' }}>Shipping</span>
              <span style={{ fontWeight: 600 }}>
                {pricing.shipping === 0 ? <span style={{ color: '#16a34a' }}>FREE</span> : `$${pricing.shipping?.toFixed(2)}`}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
              <span style={{ color: '#58627a' }}>Estimated Tax (8%)</span>
              <span style={{ fontWeight: 600 }}>${pricing.tax?.toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '1px solid #e6e8ee', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
              <span>Total</span>
              <span>${pricing.total?.toFixed(2)}</span>
            </div>

            <Link
              to="/checkout"
              style={{ display: 'block', textAlign: 'center', width: '100%', padding: '0.9rem 1.2rem', background: '#172033', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxSizing: 'border-box' }}
            >
              Proceed to Checkout →
            </Link>

            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.78rem', color: '#64748b' }}>
              🔒 Simulated Secure Checkout (Demo Mode)
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}


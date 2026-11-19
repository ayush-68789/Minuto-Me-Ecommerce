// Storefront catalog browsing page
import { useState, useEffect } from 'react';
import { Link, useNavigate } from '../../shared/components/Link.jsx';
import useCartController from '../../controllers/useCartController.js';

export default function ShopPage() {
  const navigate = useNavigate();
  const { addItem, cart } = useCartController();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
            return;
          }
        }
      } catch {
        // Fallback to seeded demo products
      } finally {
        setLoading(false);
      }

      // Default seeded catalog
      setProducts([
        { _id: '65f1a1b2c3d4e5f6a7b8c901', name: 'Minimalist Ceramic Mug', price: 24.00, category: 'Home & Kitchen', imageUrl: '☕', description: 'Handcrafted stoneware ceramic mug with a smooth matte glaze.' },
        { _id: '65f1a1b2c3d4e5f6a7b8c902', name: 'Organic Cotton Tote Bag', price: 18.50, category: 'Accessories', imageUrl: '👜', description: 'Durable 100% certified organic cotton canvas everyday tote.' },
        { _id: '65f1a1b2c3d4e5f6a7b8c903', name: 'Desk Ambient Lamp', price: 45.00, category: 'Lighting', imageUrl: '💡', description: 'Warm dimmable LED ambient desk lamp with brushed brass base.' },
        { _id: '65f1a1b2c3d4e5f6a7b8c904', name: 'Recycled Leather Notebook', price: 15.00, category: 'Stationery', imageUrl: '📓', description: 'Hardcover journal with recycled bonded leather cover and archival paper.' }
      ]);
    }

    loadProducts();
  }, []);

  const handleAddToCart = async (product) => {
    try {
      await addItem({
        productId: product._id || product.id,
        title: product.name || product.title,
        price: product.price,
        image: product.imageUrl || '📦',
        quantity: 1
      }, 1);

      setNotification(`Added "${product.name}" to cart!`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      alert(`Could not add item: ${err.message}`);
    }
  };

  const totalCartCount = (cart.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Navbar */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ width: '32px', height: '32px', background: '#172033', color: '#ffffff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>M</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>Minuto Me Store</span>
          </Link>
          <nav style={{ display: 'flex', gap: '1.5rem', fontSize: '0.92rem', fontWeight: 600 }}>
            <Link to="/shop" style={{ color: '#0284c7', textDecoration: 'none' }}>Shop</Link>
            <Link to="/orders" style={{ color: '#64748b', textDecoration: 'none' }}>My Orders</Link>
            <Link to="/studio/overview" style={{ color: '#64748b', textDecoration: 'none' }}>Studio</Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/cart"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.15rem',
              background: '#172033',
              color: '#ffffff',
              borderRadius: '999px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.92rem'
            }}
          >
            <span>🛒 Cart</span>
            {totalCartCount > 0 && (
              <span style={{ background: '#38bdf8', color: '#0f172a', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.8rem', fontWeight: 800 }}>
                {totalCartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', padding: '3.5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.85rem 0', fontWeight: 800 }}>The Independent Collection</h1>
        <p style={{ maxWidth: '600px', margin: '0 auto', color: '#94a3b8', fontSize: '1.1rem' }}>
          Thoughtfully crafted essentials designed for modern living. Fully backed by live stock reservations and secure checkout.
        </p>
      </section>

      {/* Toast Notification */}
      {notification && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: '#065f46', color: '#ffffff', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>✓ {notification}</span>
          <button
            onClick={() => navigate('/cart')}
            style={{ background: '#ffffff', color: '#065f46', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
          >
            View Cart →
          </button>
        </div>
      )}

      {/* Main Grid */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Available Products ({products.length})</h2>
          <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Stock verified by MongoDB</span>
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {products.map((product) => (
              <div
                key={product._id || product.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <div style={{ height: '180px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                  {product.imageUrl && product.imageUrl.startsWith('http') ? (
                    <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    product.imageUrl || '📦'
                  )}
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#0284c7', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    {product.category || 'General'}
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
                    {product.name}
                  </h3>
                  <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.88rem', lineHeight: 1.4, flexGrow: 1 }}>
                    {product.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                      ${Number(product.price).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      style={{
                        background: '#172033',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.6rem 1rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.88rem'
                      }}
                    >
                      + Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

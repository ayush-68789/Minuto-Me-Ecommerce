import { Link, Navigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { page } from '../../components/cart/money';
import { useStore } from '../../context/StoreContext';

export default function CustomerAccount() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { store, loading } = useStore();
  const base = `/store/${slug}`;
  if (!user) return <Navigate to={`${base}/login`} replace />;
  if (user.role !== 'customer') return <Navigate to={base} replace />;
  if (loading) return <main style={page}>Loading account…</main>;
  if (String(user.customerStore) !== String(store?._id)) return <Navigate to={`${base}/login`} replace />;

  const address = user.shippingAddress || {};
  const fullAddress = [address.line1, address.line2, [address.city, address.state].filter(Boolean).join(', '), address.postalCode, address.country]
    .filter(Boolean).join(' · ');
  const initials = (user.name || 'Customer').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const panel = { padding: 22, border: '1px solid var(--s-line, #e2e8f0)', borderRadius: 16, background: 'var(--s-surface, #fff)' };
  const label = { display: 'block', color: 'var(--s-muted, #64748b)', fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 };
  const value = { color: 'var(--s-text, #0f172a)', fontWeight: 600, overflowWrap: 'anywhere' };

  return <main style={{ ...page, maxWidth: 880, paddingTop: 32, paddingBottom: 64 }}>
    <Link to={base} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--s-primary, #4f46e5)', fontWeight: 700, textDecoration: 'none', marginBottom: 22 }}>← Back to store</Link>
    <section style={{ ...panel, padding: 0, overflow: 'hidden', boxShadow: '0 16px 40px rgba(15,23,42,.07)' }}>
      <div style={{ height: 8, background: 'linear-gradient(90deg, var(--s-primary, #4f46e5), var(--s-accent, #8b5cf6))' }} />
      <div style={{ padding: '28px clamp(20px, 5vw, 40px) 34px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div aria-hidden="true" style={{ width: 72, height: 72, borderRadius: 22, display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--s-on-primary, #fff)', background: 'var(--s-primary, #4f46e5)', fontSize: 25, fontWeight: 800, boxShadow: '0 10px 22px rgba(var(--s-primary-rgb, 79,70,229),.25)' }}>{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ color: 'var(--s-primary, #4f46e5)', fontWeight: 800, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>Customer account</span>
            <h1 style={{ color: 'var(--s-text, #0f172a)', fontSize: 'clamp(27px, 5vw, 36px)', lineHeight: 1.1, letterSpacing: '-.04em', margin: '5px 0 5px' }}>{user.name}</h1>
            <p style={{ color: 'var(--s-muted, #64748b)', margin: 0 }}>{store?.businessName || 'Store'} account details</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', gap: 14, marginTop: 28 }}>
          <section style={{ ...panel, padding: 18 }}>
            <h2 style={{ margin: '0 0 17px', color: 'var(--s-text, #0f172a)', fontSize: 16 }}>Contact information</h2>
            <div style={{ marginBottom: 16 }}><span style={label}>Email address</span><div style={value}>{user.email || 'Not added'}</div></div>
            <div><span style={label}>Phone number</span><div style={value}>{user.phone || 'Not added'}</div></div>
          </section>
          <section style={{ ...panel, padding: 18 }}>
            <h2 style={{ margin: '0 0 17px', color: 'var(--s-text, #0f172a)', fontSize: 16 }}>Delivery address</h2>
            <span style={label}>Saved address</span>
            <div style={{ ...value, lineHeight: 1.65 }}>{fullAddress || 'No delivery address saved yet.'}</div>
          </section>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--s-line, #e2e8f0)' }}>
          <Link className="sf-btn" to={`${base}/account/profile`}>Edit profile</Link>
          <Link className="sf-btn sf-btn-ghost" to={`${base}/logout`}>Log out</Link>
          <Link className="sf-btn sf-btn-ghost" to={`${base}/delete-account`} style={{ color: '#b91c1c', borderColor: '#fecaca', marginLeft: 'auto' }}>Delete account</Link>
        </div>
      </div>
    </section>
  </main>;
}

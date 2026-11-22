// Owner: M3 -- every store is this one template + the store's saved config
import { Link, Route, Routes, useParams } from 'react-router-dom';
import { StoreProvider, useStore } from '../../context/StoreContext';
import useAuth from '../../hooks/useAuth';
import useStoreTheme from '../../hooks/useStoreTheme';
import Navbar from '../../components/storefront/Navbar';
import { useEffect } from 'react';
import Footer from '../../components/storefront/Footer';
import Loader from '../../components/common/Loader';
import Home from './Home';
import ProductDetails from './ProductDetails';
import Shop from '../shop';
import CustomerLogin from '../auth/CustomerLogin';
import CustomerRegister from '../auth/CustomerRegister';
import CustomerAccount from '../auth/CustomerAccount';
import CustomerLogout from '../auth/CustomerLogout';
import CustomerDeleteAccount from '../auth/CustomerDeleteAccount';
import CustomerProfile from '../auth/CustomerProfile';
import '../../components/storefront/storefront.css';

function StoreShell() {
  const { store, loading, error } = useStore();
  const { user } = useAuth();
  const theme = useStoreTheme(store);
  useEffect(() => {
    if (store?.businessName) document.title = `${store.businessName} · Shop online`;
    return () => { document.title = 'Minuto Me — Launch your store in minutes'; };
  }, [store?.businessName]);

  if (loading) return <Loader full label="Loading store…" />;
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 52 }}>🏪</div>
          <h1 style={{ margin: '12px 0 8px', letterSpacing: '-.02em' }}>{error === 'not_found' ? 'Store not found' : 'Something went wrong'}</h1>
          <p className="muted" style={{ marginTop: 0 }}>{error === 'not_found' ? 'This store doesn’t exist or isn’t published yet.' : error}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-ghost">Back to Minuto Me</Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.store && String(user.store) === String(store._id);

  return (
    <div className="sf" {...theme.attrs} style={theme.style}>
      {isOwner && (
        <div className="sf-owner-bar">
          <div className="container">
            <span>👀 You’re viewing your live store</span>
            <Link to="/dashboard" style={{ color: '#a5b4fc', fontWeight: 700, textDecoration: 'none' }}>← Back to dashboard</Link>
          </div>
        </div>
      )}
      <Navbar store={store} />
      <main className="sf-body">
        <Routes>
          <Route index element={<Home />} />
          <Route path="product/:productId" element={<ProductDetails />} />
          <Route path="login" element={<CustomerLogin />} />
          <Route path="register" element={<CustomerRegister />} />
          <Route path="account" element={<CustomerAccount />} />
          <Route path="account/profile" element={<CustomerProfile />} />
          <Route path="logout" element={<CustomerLogout />} />
          <Route path="delete-account" element={<CustomerDeleteAccount />} />
          <Route path="*" element={<div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}><Shop /></div>} />
        </Routes>
      </main>
      <Footer store={store} />
    </div>
  );
}

export default function Storefront() {
  const { slug } = useParams();
  return (
    <StoreProvider slug={slug} key={slug}>
      <StoreShell />
    </StoreProvider>
  );
}

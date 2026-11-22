// Owner: M5
// Mounted at /store/:slug/* -- M3's storefront routes (e.g. /store/:slug) are more specific and win.
import { Routes, Route, Link, useParams, Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useStore } from '../../context/StoreContext';
import Cart from './Cart';
import Checkout from './Checkout';
import OrderHistory from './OrderHistory';
import OrderStatus from './OrderStatus';

function CustomerOnly({ children }) {
  const { user, loading } = useAuth();
  const { store, loading: storeLoading } = useStore();
  const { slug } = useParams();
  const location = useLocation();
  if (loading || storeLoading) return <div style={{ padding: 32 }}>Loading account…</div>;
  if (user?.role === 'client' && String(user.store) === String(store?._id)) return <Navigate to={`/store/${slug}`} replace />;
  if (user?.role !== 'customer' || String(user.customerStore) !== String(store?._id)) return <Navigate to={`/store/${slug}/login`} replace state={{ from: location.pathname }} />;
  return children;
}

export default function Shop() {
  const { slug } = useParams();
  return (
    <Routes>
      <Route path="cart" element={<CustomerOnly><Cart /></CustomerOnly>} />
      <Route path="checkout" element={<CustomerOnly><Checkout /></CustomerOnly>} />
      <Route path="orders" element={<OrderHistory />} />
      <Route path="orders/:orderId" element={<OrderStatus />} />
      <Route
        path="*"
        element={
          <div style={{ padding: 32 }}>
            Page not found. <Link to={`/store/${slug}/cart`}>Go to cart</Link>
          </div>
        }
      />
    </Routes>
  );
}

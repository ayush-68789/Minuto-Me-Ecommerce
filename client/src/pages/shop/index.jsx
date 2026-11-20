// Owner: M5
// Mounted at /store/:slug/* -- M3's storefront routes (e.g. /store/:slug) are more specific and win.
import { Routes, Route, Link, useParams } from 'react-router-dom';
import Cart from './Cart';
import Checkout from './Checkout';
import OrderHistory from './OrderHistory';
import OrderStatus from './OrderStatus';

export default function Shop() {
  const { slug } = useParams();
  return (
    <Routes>
      <Route path="cart" element={<Cart />} />
      <Route path="checkout" element={<Checkout />} />
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

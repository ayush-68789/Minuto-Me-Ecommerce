// Owner: M1 (everyone adds ONE route line)
import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import { DEMO, resetDemo } from './demo/mockApi.js';
import Landing from './pages/Landing.jsx';
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';
import CreateStore from './pages/onboarding/CreateStore.jsx';
import Dashboard from './pages/dashboard';
import Storefront from './pages/storefront';
import Profile from './pages/Profile.jsx';

function DemoPill() {
  if (!DEMO) return null;
  const reset = () => {
    resetDemo();
    try {
      localStorage.removeItem('minuto_carts');
      localStorage.removeItem('minuto_guest_orders');
      localStorage.removeItem('minuto_store_id');
    } catch {
      /* ignore */
    }
    window.location.href = '/';
  };
  return (
    <div className="demo-pill">
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: 'pulseDot 2s infinite' }} />
      Demo mode · data stays in your browser
      <button type="button" onClick={reset}>Reset</button>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <div className="grad-text-dark" style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-.05em' }}>404</div>
        <p className="muted">This page doesn’t exist.</p>
        <Link to="/" className="btn btn-primary">Go home</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />                                                       {/* M1 */}
          <Route path="/signup" element={<Signup />} />                                                     {/* M1 */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/create-store" element={<ProtectedRoute><CreateStore /></ProtectedRoute>} />         {/* M2 */}
          <Route path="/dashboard/*" element={<ProtectedRoute requireStore><Dashboard /></ProtectedRoute>} /> {/* M4 */}
          <Route path="/store/:slug/*" element={<Storefront />} /> {/* M3 storefront; M5 cart/checkout/orders render inside it */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <DemoPill />
      </CartProvider>
    </AuthProvider>
  );
}

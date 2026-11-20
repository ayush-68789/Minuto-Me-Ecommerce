// Owner: M1
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loader from '../components/common/Loader';

// requireStore: send logged-in users without a store to onboarding first
export default function ProtectedRoute({ children, requireStore = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (requireStore && !user.store) return <Navigate to="/create-store" replace />;
  return children;
}

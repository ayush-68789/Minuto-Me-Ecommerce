import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { page } from '../../components/cart/money';
import { useStore } from '../../context/StoreContext';

export default function CustomerDeleteAccount() {
  const { slug } = useParams();
  const { user, deleteAccount } = useAuth();
  const { store, loading } = useStore();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!user) return <Navigate to={`/store/${slug}/login`} replace />;
  if (user.role !== 'customer') return <Navigate to={`/store/${slug}`} replace />;
  if (loading) return <main style={page}>Loading account…</main>;
  if (String(user.customerStore) !== String(store?._id)) return <Navigate to={`/store/${slug}/login`} replace />;

  const remove = async () => {
    if (!window.confirm('Permanently delete your customer account? This cannot be undone.')) return;
    setBusy(true);
    setError('');
    try {
      await deleteAccount(slug);
      navigate(`/store/${slug}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not delete account');
      setBusy(false);
    }
  };

  return <main style={{ ...page, maxWidth: 560 }}>
    <Link to={`/store/${slug}/account`}>← Account</Link>
    <h1>Delete customer account</h1>
    <p>This removes your customer sign-in. Your past order records stay with the store for fulfillment history.</p>
    {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
    <button type="button" className="btn btn-ghost" disabled={busy || user?.role !== 'customer'} onClick={remove}>{busy ? 'Deleting…' : 'Delete account'}</button>
  </main>;
}

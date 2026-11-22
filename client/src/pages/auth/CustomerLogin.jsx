import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { errorMessage } from '../../api/authApi';
import AuthLayout, { ErrorBox } from './AuthLayout';
import { useStore } from '../../context/StoreContext';

export default function CustomerLogin() {
  const { slug } = useParams();
  const { store } = useStore();
  const { loginCustomer, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const base = `/store/${slug}`;

  useEffect(() => {
    if (user?.role === 'customer' && String(user.customerStore) === String(store?._id)) navigate(location.state?.from || base, { replace: true });
  }, [user, store?._id, navigate, location.state, base]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await loginCustomer({ ...form, storeSlug: slug });
      navigate(location.state?.from || base, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in'));
    } finally {
      setBusy(false);
    }
  };

  return <AuthLayout title="Sign in to shop" subtitle="Sign in to add items to your cart and place orders." footer={<>New here? <Link to={`${base}/register`}>Create a customer account</Link></>}>
    <ErrorBox>{error}</ErrorBox>
    <form onSubmit={submit}>
      <div className="field"><label className="label" htmlFor="customer-email">Email</label><input className="input" id="customer-email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className="field"><label className="label" htmlFor="customer-password">Password</label><input className="input" id="customer-password" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
      <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </AuthLayout>;
}

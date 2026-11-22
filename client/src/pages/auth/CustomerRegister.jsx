import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { errorMessage } from '../../api/authApi';
import AuthLayout, { ErrorBox } from './AuthLayout';

export default function CustomerRegister() {
  const { slug } = useParams();
  const { signupCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    shippingAddress: { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' },
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const base = `/store/${slug}`;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signupCustomer({ ...form, storeSlug: slug });
      navigate(location.state?.from || base, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account'));
    } finally {
      setBusy(false);
    }
  };

  return <AuthLayout title="Create your customer account" subtitle="Sign up to shop and manage your orders." footer={<>Already registered? <Link to={`${base}/login`}>Sign in</Link></>}>
    <ErrorBox>{error}</ErrorBox>
    <form onSubmit={submit}>
      <div className="field"><label className="label" htmlFor="customer-name">Full name</label><input className="input" id="customer-name" autoComplete="name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="field"><label className="label" htmlFor="customer-email">Email</label><input className="input" id="customer-email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className="field"><label className="label" htmlFor="customer-password">Password</label><input className="input" id="customer-password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
      <h2 style={{ fontSize: 17, margin: '22px 0 8px' }}>Delivery details</h2>
      <div className="field"><label className="label" htmlFor="customer-phone">Phone</label><input className="input" id="customer-phone" type="tel" autoComplete="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="field"><label className="label" htmlFor="customer-line1">Address line 1</label><input className="input" id="customer-line1" autoComplete="address-line1" required value={form.shippingAddress.line1} onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, line1: e.target.value } })} /></div>
      <div className="field"><label className="label" htmlFor="customer-line2">Address line 2 (optional)</label><input className="input" id="customer-line2" autoComplete="address-line2" value={form.shippingAddress.line2} onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, line2: e.target.value } })} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="field"><label className="label" htmlFor="customer-city">City</label><input className="input" id="customer-city" autoComplete="address-level2" required value={form.shippingAddress.city} onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, city: e.target.value } })} /></div>
        <div className="field"><label className="label" htmlFor="customer-state">State</label><input className="input" id="customer-state" autoComplete="address-level1" required value={form.shippingAddress.state} onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, state: e.target.value } })} /></div>
        <div className="field"><label className="label" htmlFor="customer-postal">Postal code</label><input className="input" id="customer-postal" autoComplete="postal-code" required value={form.shippingAddress.postalCode} onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, postalCode: e.target.value } })} /></div>
        <div className="field"><label className="label" htmlFor="customer-country">Country</label><input className="input" id="customer-country" autoComplete="country-name" required value={form.shippingAddress.country} onChange={(e) => setForm({ ...form, shippingAddress: { ...form.shippingAddress, country: e.target.value } })} /></div>
      </div>
      <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
  </AuthLayout>;
}

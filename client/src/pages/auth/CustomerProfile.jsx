import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { page } from '../../components/cart/money';
import { useStore } from '../../context/StoreContext';

export default function CustomerProfile() {
  const { slug } = useParams();
  const { user, updateCustomerProfile } = useAuth();
  const { store, loading } = useStore();
  const [form, setForm] = useState(() => ({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    shippingAddress: { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India', ...(user?.shippingAddress || {}) },
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const base = `/store/${slug}`;
  if (!user) return <Navigate to={`${base}/login`} replace />;
  if (user.role !== 'customer') return <Navigate to={`${base}/account`} replace />;
  if (loading) return <main style={page}>Loading profile…</main>;
  if (String(user.customerStore) !== String(store?._id)) return <Navigate to={`${base}/login`} replace />;

  const setAddress = (key, value) => setForm((old) => ({ ...old, shippingAddress: { ...old.shippingAddress, [key]: value } }));
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setSaved(false);
    try { await updateCustomerProfile({ ...form, storeSlug: slug }); setSaved(true); }
    catch (err) { setError(err.response?.data?.message || 'Could not update your profile'); }
    finally { setBusy(false); }
  };

  const input = (label, key, type = 'text', group = 'shippingAddress', autoComplete) => <label className="field" key={key}>
    <span className="label">{label}</span>
    <input className="input" type={type} autoComplete={autoComplete} required value={group === 'shippingAddress' ? form.shippingAddress[key] : form[key]} onChange={(e) => group === 'shippingAddress' ? setAddress(key, e.target.value) : setForm({ ...form, [key]: e.target.value })} />
  </label>;

  return <main style={{ ...page, maxWidth: 680 }}>
    <Link to={`${base}/account`}>← Your account</Link>
    <h1>Profile & delivery details</h1>
    <p style={{ color: '#64748b' }}>Update your account details and saved shipping address.</p>
    <form onSubmit={save} style={{ display: 'grid', gap: 14 }}>
      {input('Full name', 'name', 'text', 'user', 'name')}
      {input('Email', 'email', 'email', 'user', 'email')}
      {input('Phone', 'phone', 'tel', 'user', 'tel')}
      {input('Address line 1', 'line1', 'text', 'shippingAddress', 'address-line1')}
      {input('Address line 2 (optional)', 'line2', 'text', 'shippingAddress', 'address-line2')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
        {input('City', 'city', 'text', 'shippingAddress', 'address-level2')}
        {input('State', 'state', 'text', 'shippingAddress', 'address-level1')}
        {input('Postal code', 'postalCode', 'text', 'shippingAddress', 'postal-code')}
        {input('Country', 'country', 'text', 'shippingAddress', 'country-name')}
      </div>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {saved && <p role="status" style={{ color: '#15803d' }}>Profile saved.</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form>
  </main>;
}

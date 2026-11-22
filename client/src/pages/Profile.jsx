import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../components/common/Logo';
import useAuth from '../hooks/useAuth';

export default function Profile() {
  const { user, logout, deleteAccount, updateCustomerProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await updateCustomerProfile({ name, email }); setMessage('Profile updated.'); }
    catch (err) { setError(err.response?.data?.message || 'Could not update profile'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    const warning = user?.role === 'client'
      ? 'Delete your account and all stores, products, reviews, and order history? This cannot be undone.'
      : 'Permanently delete your account? This cannot be undone.';
    if (!window.confirm(warning)) return;
    setBusy(true); setError('');
    try { await deleteAccount(); navigate('/', { replace: true }); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete account'); setBusy(false); }
  };

  return (
    <main style={{ minHeight: '100vh', padding: '28px 20px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Logo />
        <section style={{ marginTop: 40, padding: 28, borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.06)' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Your profile</h1>
          <p style={{ margin: '0 0 24px', color: '#64748b' }}>Account details for Minuto Me.</p>
          <form onSubmit={save} style={{ display: 'grid', gap: 14 }}>
            <label>Name<input className="input" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Email<input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <p style={{ margin: 0, color: '#64748b' }}>Account type: {user?.role === 'admin' ? 'Administrator' : user?.role === 'customer' ? 'Customer' : 'Store owner'}</p>
            {message && <p role="status" style={{ color: '#15803d', margin: 0 }}>{message}</p>}
            {error && <p role="alert" style={{ color: '#b91c1c', margin: 0 }}>{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
          </form>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
            <Link to={user?.store ? '/dashboard' : '/create-store'} className="btn btn-primary">{user?.store ? 'Manage stores' : 'Create a store'}</Link>
            <button className="btn btn-ghost" type="button" onClick={async () => { await logout(); navigate('/login'); }}>Log out</button>
            {user?.role === 'client' && <button className="btn btn-ghost" type="button" disabled={busy} onClick={remove} style={{ color: '#b91c1c' }}>Delete account</button>}
          </div>
        </section>
      </div>
    </main>
  );
}

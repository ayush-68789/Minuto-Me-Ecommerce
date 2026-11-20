import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import useAuth from '../hooks/useAuth';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <main style={{ minHeight: '100vh', padding: '28px 20px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Logo />
        <section style={{ marginTop: 40, padding: 28, borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.06)' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Your profile</h1>
          <p style={{ margin: '0 0 24px', color: '#64748b' }}>Account details for Minuto Me.</p>
          <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '14px 20px', margin: 0 }}>
            <dt style={{ color: '#64748b' }}>Name</dt><dd style={{ margin: 0, fontWeight: 700 }}>{user?.name}</dd>
            <dt style={{ color: '#64748b' }}>Email</dt><dd style={{ margin: 0, fontWeight: 700, overflowWrap: 'anywhere' }}>{user?.email}</dd>
            <dt style={{ color: '#64748b' }}>Account type</dt><dd style={{ margin: 0, fontWeight: 700 }}>{user?.role === 'admin' ? 'Administrator' : 'Store owner'}</dd>
          </dl>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
            <Link to={user?.store ? '/dashboard' : '/create-store'} className="btn btn-primary">{user?.store ? 'Manage stores' : 'Create a store'}</Link>
            <button className="btn btn-ghost" type="button" onClick={async () => { await logout(); navigate('/login'); }}>Log out</button>
          </div>
        </section>
      </div>
    </main>
  );
}

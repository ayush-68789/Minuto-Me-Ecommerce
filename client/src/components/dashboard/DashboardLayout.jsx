// Owner: M2 - Products & Dashboard
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './dashboard.css';

export default function DashboardLayout({ children, store = null }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      // fallback
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-root">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <Link to="/dashboard" className="dash-brand">
          <span>⚡</span>
          <span>Minuto Me</span>
        </Link>

        <nav className="dash-nav">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/dashboard/products"
            className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
          >
            <span>📦</span>
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
          >
            <span>⚙️</span>
            <span>Store Settings</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
          >
            <span>👤</span>
            <span>My Profile</span>
          </NavLink>
        </nav>

        <div className="dash-user-footer">
          <div className="dash-user-info">
            <div className="dash-user-name">{user?.name || 'Store Owner'}</div>
            <div className="dash-user-role">{user?.role || 'Merchant'}</div>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: 12 }}
            onClick={handleLogout}
            title="Log out"
          >
            Exit
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-store-title">
            <span>🏪</span>
            <span>{store?.name || 'Merchant Dashboard'}</span>
            {store?.slug && (
              <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                /{store.slug}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {store?.slug && (
              <a
                href={`/store/${store.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ fontSize: 13, textDecoration: 'none' }}
              >
                View Live Store ↗
              </a>
            )}
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--dash-primary)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        <main className="dash-body">{children}</main>
      </div>
    </div>
  );
}

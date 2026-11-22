// Owner: M4
import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { fetchMyStores } from '../../api/storeApi';

export default function Sidebar({ store, isOpen: openProp, onClose: closeProp }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // On small screens the sidebar is an off-canvas drawer; it manages its own state unless the page controls it
  const [selfOpen, setSelfOpen] = useState(false);
  const [stores, setStores] = useState([]);
  const [activeStoreId, setActiveStoreId] = useState(() => localStorage.getItem('minuto_store_id') || '');
  const isOpen = openProp ?? selfOpen;
  const onClose = closeProp ?? (() => setSelfOpen(false));
  useEffect(() => { setSelfOpen(false); }, [location.pathname]);
  useEffect(() => {
    fetchMyStores().then((items) => {
      setStores(items || []);
      const selected = localStorage.getItem('minuto_store_id');
      const current = items?.find((item) => item._id === selected) || items?.find((item) => item._id === store?._id) || items?.[0];
      if (current && current._id !== selected) {
        localStorage.setItem('minuto_store_id', current._id);
        setActiveStoreId(current._id);
        if (selected) window.location.reload();
      }
    }).catch(() => {});
  }, [store?._id]);
  const navItems = [
    {
      label: 'Overview',
      path: '/dashboard',
      exact: true,
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Products',
      path: '/dashboard/products',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: 'Orders',
      path: '/dashboard/orders',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
        </svg>
      ),
    },
    {
      label: 'Add Product',
      path: '/dashboard/products/new',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      label: 'Store & Branding',
      path: '/dashboard/settings',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const storeSlug = store?.slug || '';
  const storeName = store?.businessName || 'My Store';
  const logo = store?.branding?.logo;

  return (
    <>
      {openProp === undefined && (
        <button type="button" className="dash-burger" aria-label="Open menu" onClick={() => setSelfOpen(true)}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      )}
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      <aside
        className="dash-sidebar"
        data-open={isOpen ? 'true' : 'false'}
        style={{
          width: '260px',
          backgroundColor: '#0b0a1f',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1e293b',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                fontWeight: 700,
                fontSize: '18px',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              {logo ? (
                <img
                  src={logo}
                  alt={storeName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                storeName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '15px',
                  color: '#f8fafc',
                  maxWidth: '140px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {storeName}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: store?.status === 'active' ? '#10b981' : '#f59e0b',
                  }}
                />
                {store?.status || 'Active'}
              </div>
            </div>
          </div>
        </div>

        {stores.length > 1 && (
          <div style={{ padding: '14px 16px 0' }}>
            <label htmlFor="dashboard-store-select" style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Current store</label>
            <select id="dashboard-store-select" value={activeStoreId || store?._id || ''} onChange={(event) => {
              localStorage.setItem('minuto_store_id', event.target.value);
              setActiveStoreId(event.target.value);
              window.location.reload();
            }} style={{ width: '100%', padding: '9px 10px', borderRadius: 8, color: '#f8fafc', background: '#1e293b', border: '1px solid #334155' }}>
              {stores.map((item) => <option key={item._id} value={item._id}>{item.businessName}</option>)}
            </select>
          </div>
        )}

        <Link to="/create-store" style={{ display: 'block', margin: '12px 16px 0', padding: '10px 12px', borderRadius: 8, color: '#ddd6fe', background: 'rgba(124,58,237,.15)', textDecoration: 'none', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>+ Create another store</Link>

        {/* Navigation Items */}
        <nav style={{ padding: '20px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              padding: '0 12px 8px 12px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#64748b',
            }}
          >
            Store Management
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'transparent',
                boxShadow: isActive ? '0 8px 18px -10px rgba(168, 85, 247, 0.9)' : 'none',
                transition: 'all 0.15s ease',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Storefront Link Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e293b' }}>
          {storeSlug ? (
            <Link
              to={`/store/${storeSlug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid #334155',
                transition: 'background-color 0.2s',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Live Store
            </Link>
          ) : (
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
              Minuto Me
            </div>
          )}
          <Link to="/profile" style={{ display: 'block', marginBottom: 10, padding: '9px 10px', borderRadius: 8, color: '#cbd5e1', textDecoration: 'none', fontSize: 13, border: '1px solid #1e293b', textAlign: 'center' }}>
            {user?.name || 'Account'} · View profile
          </Link>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <Link
              to="/"
              style={{ flex: 1, textAlign: 'center', padding: '9px', borderRadius: '8px', color: '#94a3b8', textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: '1px solid #1e293b' }}
            >
              Home
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', color: '#fca5a5', background: 'transparent', fontSize: '13px', fontWeight: 600, border: '1px solid #1e293b', cursor: 'pointer' }}
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

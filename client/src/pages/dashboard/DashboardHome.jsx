// Owner: M4
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import StatsCard from '../../components/dashboard/StatsCard';
import { fetchDashboardStats, toggleProductStatus } from '../../api/productApi';

export default function DashboardHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDashboardStats();
      setData(res);
      // Persist store ID for subsequent API requests if available
      if (res?.store?.id) {
        localStorage.setItem('minuto_store_id', res.store.id);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err?.response?.data?.message || 'Unable to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleToggleProduct = async (productId) => {
    try {
      await toggleProductStatus(productId);
      loadStats();
    } catch (err) {
      console.error('Error toggling product status:', err);
    }
  };

  const store = data?.store;
  const stats = data?.stats;
  const recentProducts = data?.recentProducts || [];
  const recentOrders = data?.recentOrders || [];

  const currencySymbol = store?.currency === 'USD' ? '$' : store?.currency === 'EUR' ? '€' : '₹';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar store={store} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Store Overview
            </h1>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Welcome back to your client dashboard for{' '}
              <strong style={{ color: '#1e293b' }}>{store?.businessName || 'ShopSphere'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {store?.slug && (
              <Link
                to={`/store/${store.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🌐</span> Visit Storefront
              </Link>
            )}

            <Link
              to="/dashboard/products/new"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}
            >
              <span>+</span> Add Product
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: '32px', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '14px',
                marginBottom: '24px',
              }}
            >
              {error}
            </div>
          )}

          {/* Analytics Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
            }}
          >
            <StatsCard
              title="Total Revenue"
              value={`${currencySymbol}${(stats?.totalRevenue || 0).toLocaleString()}`}
              subtitle="All confirmed & delivered orders"
              badgeText="Live Orders"
              badgeType="positive"
              accentColor="#10b981"
              icon={
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatsCard
              title="Total Orders"
              value={stats?.totalOrders || 0}
              subtitle={`${stats?.pendingOrders || 0} pending processing`}
              badgeText={stats?.pendingOrders ? `${stats.pendingOrders} pending` : 'All clear'}
              badgeType={stats?.pendingOrders ? 'warning' : 'neutral'}
              accentColor="#3b82f6"
              icon={
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
            />

            <StatsCard
              title="Active Products"
              value={stats?.activeProducts || 0}
              subtitle={`${stats?.totalProducts || 0} total products listed`}
              badgeText={`${stats?.categoryCount || 0} categories`}
              badgeType="neutral"
              accentColor="#6366f1"
              icon={
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            />

            <StatsCard
              title="Inventory Alert"
              value={(stats?.lowStockProducts || 0) + (stats?.outOfStockProducts || 0)}
              subtitle={`${stats?.outOfStockProducts || 0} out of stock, ${stats?.lowStockProducts || 0} low`}
              badgeText={stats?.outOfStockProducts ? 'Action Required' : 'Optimal'}
              badgeType={stats?.outOfStockProducts ? 'danger' : 'positive'}
              accentColor="#f59e0b"
              icon={
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </div>

          {/* Quick Setup / Customization Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '24px 28px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.3)',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>
                Customize Your Storefront Theme & Branding
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', maxWidth: '600px' }}>
                Tune your brand colors, upload logos, set hero banners, and enable features like coupons and reviews for your store.
              </div>
            </div>
            <Link
              to="/dashboard/settings"
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Edit Branding & Settings →
            </Link>
          </div>

          {/* Recent Products & Recent Orders Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            {/* Recent Products Section */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Recent Products
                </h2>
                <Link
                  to="/dashboard/products"
                  style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}
                >
                  Manage All Products ({stats?.totalProducts || 0}) →
                </Link>
              </div>

              {recentProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                  <p style={{ fontSize: '14px', margin: 0 }}>No products created yet.</p>
                  <Link
                    to="/dashboard/products/new"
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      fontSize: '13px',
                      color: '#2563eb',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    + Add your first product
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentProducts.map((p) => (
                    <div
                      key={p._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                          alt={p.name}
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {p.category || 'General'} • Stock: {p.stock}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                          {currencySymbol}{p.price}
                        </span>
                        <Link
                          to={`/dashboard/products/edit/${p._id}`}
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#3b82f6',
                            textDecoration: 'none',
                          }}
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders Section */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Recent Orders
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {recentOrders.length} Recent
                </span>
              </div>

              {recentOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                  <p style={{ fontSize: '14px', margin: 0 }}>No orders received yet.</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    When customers purchase from your storefront, orders will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentOrders.map((ord) => (
                    <div
                      key={ord._id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                          {ord.customerInfo?.name || 'Customer'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {ord.items?.length || 1} items • {new Date(ord.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                          {currencySymbol}{ord.total}
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            backgroundColor: ord.status === 'delivered' ? '#dcfce7' : '#fef3c7',
                            color: ord.status === 'delivered' ? '#15803d' : '#b45309',
                          }}
                        >
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

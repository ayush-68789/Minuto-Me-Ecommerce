// Owner: M2 - Products & Dashboard
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import ProductTable from '../../components/dashboard/ProductTable';
import RecentOrders from '../../components/dashboard/RecentOrders';
import LowStockBanner from '../../components/dashboard/LowStockBanner';
import SalesChart from '../../components/dashboard/SalesChart';
import { fetchDashboardSummary, fetchMyStore } from '../../api/storeApi';
import { formatCurrency } from '../../utils/validators';

export default function DashboardHome() {
  const [summary, setSummary] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [dashData, storeData] = await Promise.allSettled([
          fetchDashboardSummary(),
          fetchMyStore(),
        ]);

        if (mounted) {
          if (dashData.status === 'fulfilled') setSummary(dashData.value);
          if (storeData.status === 'fulfilled') setStore(storeData.value);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = summary?.stats || {};
  const currency = store?.currency || 'USD';

  return (
    <DashboardLayout store={store || summary?.store}>
      {error && (
        <div style={{ padding: 16, background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800 }}>Overview</h2>
          <p style={{ margin: 0, color: 'var(--dash-muted)', fontSize: 14 }}>
            Real-time performance, inventory alerts, and catalog status.
          </p>
        </div>
        <Link to="/dashboard/products" className="btn-primary" style={{ textDecoration: 'none' }}>
          + Manage Products
        </Link>
      </div>

      <LowStockBanner lowStockItems={summary?.lowStockAlerts || []} />

      {/* KPI Stats */}
      <div className="stats-grid">
        <StatCard
          title="Total Products"
          value={stats.totalProducts !== undefined ? stats.totalProducts : '—'}
          subtitle={`${stats.activeProducts || 0} active in catalog`}
          icon="📦"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue || 0, currency)}
          trend="+14.2%"
          subtitle="vs previous week"
          icon="💰"
          isPositive={true}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          trend="+8.5%"
          subtitle="weekly volume"
          icon="🛍️"
          isPositive={true}
        />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(stats.inventoryValuation || 0, currency)}
          subtitle={`${stats.outOfStockProducts || 0} out of stock`}
          icon="📊"
        />
      </div>

      {/* Sales Trend Chart */}
      <SalesChart trends={summary?.salesTrends || []} currency={currency} />

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 28 }}>
        <RecentOrders currency={currency} />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Recently Added Products</h3>
            <Link to="/dashboard/products" style={{ fontSize: 13, color: 'var(--dash-primary)', fontWeight: 600, textDecoration: 'none' }}>
              View All →
            </Link>
          </div>
          <ProductTable
            products={summary?.recentProducts || []}
            currency={currency}
            isLoading={loading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

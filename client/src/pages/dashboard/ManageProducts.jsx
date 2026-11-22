// Owner: M4 (Product Management & Dashboard)
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import ProductTable from '../../components/dashboard/ProductTable';
import {
  fetchProducts,
  deleteProduct,
  toggleProductStatus,
  updateProductStock,
  fetchStoreSettings,
} from '../../api/productApi';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Pagination & Counts
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, storeRes] = await Promise.all([
        fetchProducts({
          search: searchQuery,
          category: selectedCategory,
          status: statusFilter,
          stockStatus: stockFilter,
          page,
          limit: 20,
        }),
        fetchStoreSettings().catch(() => null),
      ]);

      if (prodRes?.products) {
        setProducts(prodRes.products);
        setCategories(prodRes.categories || []);
        setTotalPages(prodRes.totalPages || 1);
        setTotalProducts(prodRes.total || 0);
      }
      if (storeRes?.store) {
        setStore(storeRes.store);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      showNotification('Failed to load products. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, statusFilter, stockFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 whenever filters change
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleCategoryChange = (val) => {
    setSelectedCategory(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleStockFilterChange = (val) => {
    setStockFilter(val);
    setPage(1);
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setTotalProducts((prev) => Math.max(0, prev - 1));
      showNotification('Product deleted successfully');
    } catch (err) {
      console.error('Error deleting product:', err);
      showNotification('Failed to delete product', 'error');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await toggleProductStatus(id);
      if (res?.product) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? res.product : p))
        );
        showNotification(
          `Product is now ${res.product.isActive ? 'Active' : 'Inactive'}`
        );
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
      showNotification('Failed to update product status', 'error');
    }
  };

  const handleUpdateStock = async (id, newStock) => {
    const res = await updateProductStock(id, { stock: newStock });
    if (res?.product) {
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? res.product : p))
      );
      showNotification(`Stock updated for "${res.product.name}"`);
    }
  };

  // Stock summary counts for the current store view
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const inStockCount = products.filter((p) => p.stock > 5).length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar store={store} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
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
              Product Inventory &amp; Catalog
            </h1>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Manage, search, and update stock across your store catalog ({totalProducts} total)
            </div>
          </div>

          <Link
            to="/dashboard/products/new"
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
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
            <span>+</span> New Product
          </Link>
        </header>

        {/* Notification Toast */}
        {notification && (
          <div
            style={{
              margin: '16px 32px 0',
              padding: '12px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
              color: notification.type === 'error' ? '#b91c1c' : '#15803d',
              border: `1px solid ${notification.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '16px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Content Container */}
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Inventory Health Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <div
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#475569',
              }}
            >
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{totalProducts}</span> Total Items
            </div>
            <div
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#15803d',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '15px' }}>{inStockCount}</span> In Stock
            </div>
            <div
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#b45309',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '15px' }}>{lowStockCount}</span> Low Stock (≤ 5)
            </div>
            <div
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#b91c1c',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '15px' }}>{outOfStockCount}</span> Out of Stock
            </div>
          </div>

          {/* Product Table */}
          <ProductTable
            products={products}
            currency={store?.currency || 'INR'}
            loading={loading}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onUpdateStock={handleUpdateStock}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            stockFilter={stockFilter}
            onStockFilterChange={handleStockFilterChange}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalProducts} total)
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: page <= 1 ? '#f8fafc' : '#ffffff',
                    color: page <= 1 ? '#94a3b8' : '#334155',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: page >= totalPages ? '#f8fafc' : '#ffffff',
                    color: page >= totalPages ? '#94a3b8' : '#334155',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

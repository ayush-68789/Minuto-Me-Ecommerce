// Owner: M4
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import ProductTable from '../../components/dashboard/ProductTable';
import {
  fetchProducts,
  deleteProduct,
  toggleProductStatus,
  fetchStoreSettings,
} from '../../api/productApi';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, storeRes] = await Promise.all([
        fetchProducts({
          search: searchQuery,
          category: selectedCategory,
          status: statusFilter,
        }),
        fetchStoreSettings().catch(() => null),
      ]);

      if (prodRes?.products) {
        setProducts(prodRes.products);
        setCategories(prodRes.categories || []);
      }
      if (storeRes?.store) {
        setStore(storeRes.store);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, statusFilter]);

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await toggleProductStatus(id);
      if (res?.product) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? res.product : p))
        );
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
      alert('Failed to update product status');
    }
  };

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
              Product Inventory
            </h1>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Manage pricing, stock counts, images, and visibility for your products.
            </div>
          </div>

          <Link
            to="/dashboard/products/new"
            style={{
              padding: '9px 18px',
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
        </header>

        {/* Content */}
        <div style={{ padding: '32px', flex: 1 }}>
          <ProductTable
            products={products}
            currency={store?.currency || 'INR'}
            loading={loading}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>
      </main>
    </div>
  );
}

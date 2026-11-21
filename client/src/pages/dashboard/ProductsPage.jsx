// Owner: M2 - Products & Dashboard
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProductTable from '../../components/dashboard/ProductTable';
import ProductModal from '../../components/dashboard/ProductModal';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  productErrorMessage,
} from '../../api/productApi';
import { fetchMyStore } from '../../api/storeApi';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const [prodRes, storeRes] = await Promise.allSettled([
        fetchProducts(params),
        fetchMyStore(),
      ]);

      if (prodRes.status === 'fulfilled') {
        setProducts(prodRes.value.products || []);
      } else {
        setError(productErrorMessage(prodRes.reason, 'Could not fetch products'));
      }

      if (storeRes.status === 'fulfilled') {
        setStore(storeRes.value);
      }
    } catch (err) {
      setError(err.message || 'Error loading catalog');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSaveProduct = async (productData) => {
    try {
      setIsSaving(true);
      if (selectedProduct) {
        await updateProduct(selectedProduct._id, productData);
      } else {
        await createProduct({ ...productData, store: store?._id });
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      alert(productErrorMessage(err, 'Failed to save product'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      alert(productErrorMessage(err, 'Failed to delete product'));
    }
  };

  return (
    <DashboardLayout store={store}>
      {error && (
        <div style={{ padding: 14, background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800 }}>Products</h2>
          <p style={{ margin: 0, color: 'var(--dash-muted)', fontSize: 14 }}>
            Manage pricing, inventory units, and catalog visibility.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={handleOpenAddModal}>
          + Add Product
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          background: 'var(--dash-card)',
          padding: '16px 20px',
          border: '1px solid var(--dash-border)',
          borderRadius: 12,
          marginBottom: 20,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: '1 1 240px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, SKU or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ width: 160 }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div style={{ width: 160 }}>
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="General">General</option>
            <option value="Electronics">Electronics</option>
            <option value="Apparel">Apparel</option>
            <option value="Home & Living">Home & Living</option>
          </select>
        </div>
      </div>

      {/* Product Listing Table */}
      <ProductTable
        products={products}
        currency={store?.currency || 'USD'}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteProduct}
        isLoading={loading}
      />

      {/* Add / Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        initialData={selectedProduct}
        isSaving={isSaving}
      />
    </DashboardLayout>
  );
}

// Owner: M4
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import ProductForm from '../../components/dashboard/ProductForm';
import {
  fetchProductById,
  createProduct,
  updateProduct,
  fetchStoreSettings,
} from '../../api/productApi';

export default function AddEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const storeRes = await fetchStoreSettings().catch(() => null);
        if (storeRes?.store) setStore(storeRes.store);

        if (isEditMode) {
          const prodRes = await fetchProductById(id);
          if (prodRes?.product) {
            setProduct(prodRes.product);
          }
        }
      } catch (err) {
        console.error('Error loading product form data:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEditMode]);

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError(null);

      if (isEditMode) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }

      navigate('/dashboard/products');
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err?.response?.data?.message || 'Failed to save product. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar store={store} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
              <Link to="/dashboard/products" style={{ color: '#2563eb', textDecoration: 'none' }}>
                Products
              </Link>
              <span>/</span>
              <span>{isEditMode ? 'Edit Product' : 'New Product'}</span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
              {isEditMode ? `Edit: ${product?.name || 'Product'}` : 'Create New Product'}
            </h1>
          </div>
        </header>

        {/* Form Container */}
        <div style={{ padding: '32px', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ marginTop: '12px' }}>Loading product details...</div>
            </div>
          ) : (
            <ProductForm
              initialData={product}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
              currency={store?.currency || 'INR'}
              title={isEditMode ? 'Edit Product' : 'Add Product'}
            />
          )}
        </div>
      </main>
    </div>
  );
}

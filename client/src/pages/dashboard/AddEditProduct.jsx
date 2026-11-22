// Owner: M4 (Product Management & Dashboard)
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
    let isMounted = true;
    const init = async () => {
      try {
        const storeRes = await fetchStoreSettings().catch(() => null);
        if (storeRes?.store && isMounted) setStore(storeRes.store);

        if (isEditMode) {
          const prodRes = await fetchProductById(id);
          if (prodRes?.product && isMounted) {
            setProduct(prodRes.product);
          }
        }
      } catch (err) {
        console.error('Error loading product form data:', err);
        if (isMounted) setError('Failed to load product details. It may not exist or belongs to another store.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
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
      const serverMsg = err?.response?.data?.message;
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === 'object') {
        const details = Object.entries(fieldErrors)
          .map(([f, msgs]) => `${f}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        setError(`Validation error: ${details}`);
      } else {
        setError(serverMsg || 'Failed to save product. Please check your inputs.');
      }
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
              <Link to="/dashboard/products" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
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
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '14px 18px',
                borderRadius: '10px',
                marginBottom: '24px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: '16px' }}
              >
                ×
              </button>
            </div>
          )}

          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 20px',
                color: '#64748b',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid #cbd5e1',
                  borderTopColor: '#2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span style={{ marginTop: '14px', fontSize: '14px' }}>Loading product details...</span>
            </div>
          ) : (
            <ProductForm
              initialData={product}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
              currency={store?.currency || 'INR'}
              title={isEditMode ? 'Update Product' : 'Create Product'}
            />
          )}
        </div>
      </main>
    </div>
  );
}

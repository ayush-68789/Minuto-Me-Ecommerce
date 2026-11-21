// Owner: M2 - Products & Dashboard
import React, { useState, useEffect } from 'react';
import { validateProduct } from '../../utils/validators';

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isSaving = false,
}) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    price: '',
    compareAtPrice: '',
    stock: 0,
    sku: '',
    description: '',
    imageUrl: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'General',
        price: initialData.price !== undefined ? initialData.price : '',
        compareAtPrice: initialData.compareAtPrice !== undefined ? initialData.compareAtPrice : '',
        stock: initialData.stock !== undefined ? initialData.stock : 0,
        sku: initialData.sku || '',
        description: initialData.description || '',
        imageUrl: initialData.imageUrl || (initialData.images && initialData.images[0]) || '',
        status: initialData.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        category: 'General',
        price: '',
        compareAtPrice: '',
        stock: 0,
        sku: '',
        description: '',
        imageUrl: '',
        status: 'active',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateProduct(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    onSave({
      ...formData,
      price: Number(formData.price),
      compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : null,
      stock: Number(formData.stock),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? 'Edit Product' : 'Add New Product'}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Wireless Noise-Cancelling Headphones"
                value={formData.name}
                onChange={handleChange}
                required
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  className="form-input"
                  placeholder="29.99"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
                {errors.price && <div className="form-error">{errors.price}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Compare Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="compareAtPrice"
                  className="form-input"
                  placeholder="39.99"
                  value={formData.compareAtPrice}
                  onChange={handleChange}
                />
                {errors.compareAtPrice && <div className="form-error">{errors.compareAtPrice}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  name="stock"
                  className="form-input"
                  placeholder="100"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                />
                {errors.stock && <div className="form-error">{errors.stock}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">SKU</label>
                <input
                  type="text"
                  name="sku"
                  className="form-input"
                  placeholder="PROD-001"
                  value={formData.sku}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  name="category"
                  className="form-input"
                  placeholder="Electronics, Apparel, etc."
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active (Published)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input
                type="url"
                name="imageUrl"
                className="form-input"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={handleChange}
              />
              {errors.imageUrl && <div className="form-error">{errors.imageUrl}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-textarea"
                rows="3"
                placeholder="Describe your product benefits, specs, and materials…"
                value={formData.description}
                onChange={handleChange}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : initialData ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

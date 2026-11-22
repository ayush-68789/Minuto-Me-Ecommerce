// Owner: M4
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProductForm({
  initialData = null,
  onSubmit,
  isSubmitting = false,
  currency = 'INR',
  title = 'Add Product',
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price ?? '',
    comparePrice: initialData?.comparePrice ?? '',
    category: initialData?.category || 'General',
    stock: initialData?.stock ?? 10,
    isActive: initialData?.isActive ?? true,
    images: initialData?.images?.length ? initialData.images : [''],
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [errors, setErrors] = useState({});

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';

  // Calculate discount percentage
  const discountPercent =
    formData.comparePrice && Number(formData.comparePrice) > Number(formData.price)
      ? Math.round(
          ((Number(formData.comparePrice) - Number(formData.price)) /
            Number(formData.comparePrice)) *
            100
        )
      : null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    const cleanUrl = imageUrlInput.trim();
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter(Boolean).concat(cleanUrl),
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }
    if (formData.comparePrice && Number(formData.comparePrice) < 0) {
      newErrors.comparePrice = 'Compare price cannot be negative';
    }
    if (formData.stock === '' || isNaN(formData.stock) || Number(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      price: Number(formData.price),
      comparePrice: formData.comparePrice ? Number(formData.comparePrice) : undefined,
      stock: Number(formData.stock),
      images: formData.images.filter(Boolean),
    };

    onSubmit(payload);
  };

  const primaryImage =
    formData.images.filter(Boolean)[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '30px' }}>
      {/* Left Form Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Basic Information Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Basic Information
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Product Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Minimalist Ceramic Mug"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${errors.name ? '#ef4444' : '#cbd5e1'}`,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              {errors.name && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of features, materials, sizing, etc."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Home Goods, Apparel"
                  list="category-suggestions"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <datalist id="category-suggestions">
                  <option value="Apparel" />
                  <option value="Electronics" />
                  <option value="Home & Living" />
                  <option value="Beauty & Wellness" />
                  <option value="Books & Stationery" />
                  <option value="Food & Beverages" />
                </datalist>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Stock Inventory <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="10"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${errors.stock ? '#ef4444' : '#cbd5e1'}`,
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                {errors.stock && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.stock}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Pricing
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Selling Price ({currencySymbol}) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="499"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${errors.price ? '#ef4444' : '#cbd5e1'}`,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              {errors.price && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.price}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Original Price ({currencySymbol}) <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="number"
                name="comparePrice"
                min="0"
                step="0.01"
                value={formData.comparePrice}
                onChange={handleChange}
                placeholder="799"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              {discountPercent && (
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                  Save {discountPercent}% off
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Media / Images Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Product Images
          </h2>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              type="url"
              placeholder="Paste public image URL (e.g. https://...)"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleAddImage}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0f172a',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add Image
            </button>
          </div>

          {/* Image Thumbnails Gallery */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {formData.images.filter(Boolean).map((imgUrl, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  width: '90px',
                  height: '90px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: idx === 0 ? '2px solid #2563eb' : '1px solid #cbd5e1',
                }}
              >
                <img
                  src={imgUrl}
                  alt={`Product ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {idx === 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: 700,
                      textAlign: 'center',
                      padding: '2px 0',
                    }}
                  >
                    PRIMARY
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Form Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard/products')}
            style={{
              padding: '11px 20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#fff',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '11px 28px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {/* Right Column: Live Storefront Card Preview & Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Visibility Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            Product Visibility
          </h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                Active in Storefront
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Customers can view and purchase this item.
              </div>
            </div>
          </label>
        </div>

        {/* Live Customer Preview */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              Live Storefront Preview
            </span>
            <span style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
              Live
            </span>
          </div>

          {/* Product Card Preview */}
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#f1f5f9' }}>
              <img
                src={primaryImage}
                alt="Product preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                }}
              />
              {discountPercent && (
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  -{discountPercent}%
                </span>
              )}
            </div>

            <div style={{ padding: '14px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                {formData.category || 'General'}
              </span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formData.name || 'Product Title'}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {currencySymbol}
                  {formData.price ? Number(formData.price).toLocaleString() : '0'}
                </span>
                {formData.comparePrice && (
                  <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                    {currencySymbol}
                    {Number(formData.comparePrice).toLocaleString()}
                  </span>
                )}
              </div>

              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'default',
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

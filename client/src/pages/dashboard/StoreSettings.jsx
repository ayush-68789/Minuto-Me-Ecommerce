// Owner: M2 - Products & Dashboard
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { fetchMyStore, updateStore, storeErrorMessage } from '../../api/storeApi';
import { validateStore } from '../../utils/validators';

export default function StoreSettings() {
  const [store, setStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'General',
    currency: 'USD',
    logo: '',
    banner: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    theme: 'modern',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function getStoreData() {
      try {
        setLoading(true);
        const data = await fetchMyStore();
        setStore(data);
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          category: data.category || 'General',
          currency: data.currency || 'USD',
          logo: data.logo || '',
          banner: data.banner || '',
          contactEmail: data.settings?.contactEmail || '',
          contactPhone: data.settings?.contactPhone || '',
          address: data.settings?.address || '',
          theme: data.settings?.theme || 'modern',
        });
      } catch (err) {
        setMessage({ text: storeErrorMessage(err, 'Could not load store data'), type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    getStoreData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateStore(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      setMessage({ text: '', type: '' });
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        currency: formData.currency,
        logo: formData.logo,
        banner: formData.banner,
        settings: {
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          address: formData.address,
          theme: formData.theme,
        },
      };

      const updated = await updateStore(store._id, payload);
      setStore(updated);
      setMessage({ text: 'Store settings saved successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: storeErrorMessage(err, 'Failed to save store settings'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout store={store}>
      <div style={{ maxWidth: 760 }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800 }}>Store Settings</h2>
          <p style={{ margin: 0, color: 'var(--dash-muted)', fontSize: 14 }}>
            Update branding, public store domain, currency, and customer contact information.
          </p>
        </div>

        {message.text && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 20,
              background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#15803d' : '#b91c1c',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--dash-muted)' }}>
            Loading store settings…
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'var(--dash-card)',
              border: '1px solid var(--dash-border)',
              borderRadius: 12,
              padding: 28,
            }}
          >
            <div className="form-group">
              <label className="form-label">Store Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Store Slug / Subdomain</label>
                <input
                  type="text"
                  name="slug"
                  className="form-input"
                  value={formData.slug}
                  onChange={handleChange}
                />
                {errors.slug && <div className="form-error">{errors.slug}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Store Currency</label>
                <select
                  name="currency"
                  className="form-select"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Store Description</label>
              <textarea
                name="description"
                className="form-textarea"
                rows="3"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Logo URL</label>
                <input
                  type="url"
                  name="logo"
                  className="form-input"
                  placeholder="https://…"
                  value={formData.logo}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Banner Image URL</label>
                <input
                  type="url"
                  name="banner"
                  className="form-input"
                  placeholder="https://…"
                  value={formData.banner}
                  onChange={handleChange}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--dash-border)', margin: '24px 0' }} />

            <h4 style={{ margin: '0 0 16px', fontSize: 16 }}>Customer Contact Details</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Support Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  className="form-input"
                  value={formData.contactEmail}
                  onChange={handleChange}
                />
                {errors.contactEmail && <div className="form-error">{errors.contactEmail}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Support Phone</label>
                <input
                  type="text"
                  name="contactPhone"
                  className="form-input"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Business Address</label>
              <input
                type="text"
                name="address"
                className="form-input"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving Changes…' : 'Save Store Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

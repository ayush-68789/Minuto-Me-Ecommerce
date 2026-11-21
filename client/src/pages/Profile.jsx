// Owner: M2 - Products & Dashboard
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import useAuth from '../hooks/useAuth';
import { validateProfile } from '../utils/validators';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
  });

  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateProfile(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      setStatusMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setStatusMessage({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800 }}>Account Profile</h2>
          <p style={{ margin: 0, color: 'var(--dash-muted)', fontSize: 14 }}>
            Manage your personal merchant account details and authentication credentials.
          </p>
        </div>

        {statusMessage.text && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 20,
              background: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {statusMessage.text}
          </div>
        )}

        <form
          onSubmit={handleUpdateProfile}
          style={{
            background: 'var(--dash-card)',
            border: '1px solid var(--dash-border)',
            borderRadius: 12,
            padding: 28,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--dash-primary)',
                color: '#fff',
                fontSize: 24,
                fontWeight: 800,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {(user?.name || 'M').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{user?.name || 'Store Merchant'}</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--dash-muted)', fontSize: 14 }}>
                Role: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{user?.role || 'Client'}</span>
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
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

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--dash-border)', margin: '24px 0' }} />

          <h4 style={{ margin: '0 0 16px', fontSize: 15 }}>Change Password (Optional)</h4>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              className="form-input"
              placeholder="••••••••"
              value={formData.currentPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              name="newPassword"
              className="form-input"
              placeholder="At least 8 characters"
              value={formData.newPassword}
              onChange={handleChange}
            />
            {errors.newPassword && <div className="form-error">{errors.newPassword}</div>}
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger zone / sign out */}
        <div
          style={{
            background: 'var(--dash-card)',
            border: '1px solid var(--dash-border)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: 15 }}>Sign out of account</h4>
            <p style={{ margin: '4px 0 0', color: 'var(--dash-muted)', fontSize: 13 }}>
              Clear current session and secure your store portal.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

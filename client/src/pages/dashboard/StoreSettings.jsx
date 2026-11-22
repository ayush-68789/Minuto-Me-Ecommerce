// Owner: M4 -- Store Studio in the dashboard: edit theme/branding/sections with a live 3D preview of the real store
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import BrandingEditor from '../../components/dashboard/BrandingEditor';
import { fetchStoreSettings, updateStoreSettings } from '../../api/productApi';
import { fetchStorefront } from '../../api/storefrontApi';
import { SAMPLE_PRODUCTS } from '../../demo/seedData';
import { deleteMyStore } from '../../api/storeApi';
import useAuth from '../../hooks/useAuth';
import './storeSettings.css';

export default function StoreSettings() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [subs, setSubs] = useState(0);
  const [sample, setSample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetchStoreSettings();
        if (!live || !res?.store) return;
        setStore(res.store);
        setSubs(res.subscriberCount || 0);
        // the preview uses the store's real, active products (sample ones until the owner adds some)
        const pub = await fetchStorefront(res.store.slug).catch(() => null);
        if (!live) return;
        setSample(!pub?.products?.length);
        setProducts(pub?.products?.length ? pub.products : SAMPLE_PRODUCTS.filter((p) => p.isActive));
      } catch {
        if (live) setError('Unable to load store settings');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const res = await updateStoreSettings(data);
      if (res?.store) setStore(res.store);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message || 'Failed to update store settings' };
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!store || !window.confirm(`Delete “${store.businessName}” and permanently remove its products, reviews, orders, and store data? This cannot be undone.`)) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const result = await deleteMyStore();
      await refresh();
      navigate(result.nextStore ? '/dashboard' : '/create-store', { replace: true });
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete this store');
      setDeleting(false);
    }
  };

  return (
    <div className="ss-wrap">
      <Sidebar store={store} />
      <main className="ss-main">
        <header className="ss-head">
          <div>
            <h1>Store Studio</h1>
            <p>Theme, colors, fonts, layout and sections, with a live 3D preview of your real store.</p>
          </div>
          {sample && <span className="ss-note">Preview uses sample products until you add your own</span>}
        </header>
        <div className="ss-body">
          {error && <div className="error-box">{error}</div>}
          {!loading && store && <section style={{ marginBottom: 24, padding: 22, borderRadius: 14, background: '#fff', border: '1px solid #fecaca' }}>
            <h2 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: 18 }}>Delete this store</h2>
            <p style={{ color: '#64748b', marginTop: 0 }}>Permanently removes this store and its products, reviews, and order history.</p>
            {deleteError && <p role="alert" style={{ color: '#b91c1c' }}>{deleteError}</p>}
            <button type="button" className="btn btn-ghost" disabled={deleting} onClick={handleDeleteStore} style={{ color: '#b91c1b', borderColor: '#fecaca' }}>{deleting ? 'Deleting store…' : 'Delete store'}</button>
          </section>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <div style={{ marginTop: 12 }}>Loading your studio…</div>
            </div>
          ) : (
            store && <BrandingEditor store={store} products={products} onSave={handleSave} isSaving={saving} subscriberCount={subs} />
          )}
        </div>
      </main>
    </div>
  );
}

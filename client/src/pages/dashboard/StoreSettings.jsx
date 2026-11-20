// Owner: M4 -- Store Studio in the dashboard: edit theme/branding/sections with a live 3D preview of the real store
import { useEffect, useState } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import BrandingEditor from '../../components/dashboard/BrandingEditor';
import { fetchStoreSettings, updateStoreSettings } from '../../api/productApi';
import { fetchStorefront } from '../../api/storefrontApi';
import { SAMPLE_PRODUCTS } from '../../demo/seedData';
import './storeSettings.css';

export default function StoreSettings() {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [subs, setSubs] = useState(0);
  const [sample, setSample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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

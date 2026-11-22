// Owner: Member 5 -- /studio: edit the live store's design with a side-by-side preview, then publish.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyStore, storeErrorMessage, updateStore } from '../../api/storeApi';
import { fetchProducts } from '../../api/productApi';
import Loader from '../../components/common/Loader';
import { DeviceToggle, StudioEditor, StudioPreview, draftFromStore, draftToPayload } from '../../components/studio';
import '../../components/onboarding/onboarding.css';

// Admin products use compareAtPrice/imageUrl; the storefront components read comparePrice/images
const toStorefrontProduct = (p) => ({
  ...p,
  comparePrice: p.comparePrice ?? p.compareAtPrice ?? 0,
  images: p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : [],
});

const sameDesign = (a, b) => JSON.stringify(draftToPayload(a)) === JSON.stringify(draftToPayload(b));

export default function StoreStudio() {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [device, setDevice] = useState('desktop');
  const [view, setView] = useState('edit');

  useEffect(() => {
    let cancelled = false;
    fetchMyStore()
      .then((store) => {
        if (cancelled) return;
        const d = draftFromStore(store);
        setSaved(d);
        setDraft(d);
        fetchProducts({ store: store._id, limit: 24 })
          .then((r) => !cancelled && setProducts((r.products || []).filter((p) => p.status !== 'archived').map(toStorefrontProduct)))
          .catch(() => {});
      })
      .catch((err) => !cancelled && setLoadError(storeErrorMessage(err, 'Could not load your store')));
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => Boolean(draft && saved && !sameDesign(draft, saved)), [draft, saved]);

  // Warn before closing the tab with unpublished changes
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const change = useCallback((next) => {
    setDraft(next);
    setStatus((s) => (s.state === 'saving' ? s : { state: 'idle', message: '' }));
  }, []);

  const publish = async () => {
    setStatus({ state: 'saving', message: 'Publishing…' });
    try {
      const store = await updateStore(draft._id, draftToPayload(draft));
      const d = draftFromStore(store);
      setSaved(d);
      setDraft(d);
      setStatus({ state: 'ok', message: 'Published. Your store is up to date.' });
    } catch (err) {
      setStatus({ state: 'bad', message: storeErrorMessage(err, 'Could not publish your changes') });
    }
  };

  if (loadError) {
    return (
      <div className="studio" style={{ placeItems: 'center', display: 'grid', textAlign: 'center', padding: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 8px' }}>Studio unavailable</h1>
          <p style={{ color: 'var(--st-muted)' }}>{loadError}</p>
          <Link to="/create-store" className="st-btn">Create a store</Link>
        </div>
      </div>
    );
  }
  if (!draft) return <Loader full label="Opening the studio…" />;

  const statusText = status.message || (dirty ? 'Unpublished changes' : 'All changes published');
  const statusClass = status.state === 'ok' ? 'ok' : status.state === 'bad' ? 'bad' : dirty ? 'dirty' : '';

  return (
    <div className="studio">
      <header className="studio-top">
        <Link to="/dashboard" className="st-btn st-btn-ghost st-btn-sm">← Dashboard</Link>
        <h1>Studio · {draft.businessName}</h1>
        <span className="grow" />
        <span className={`studio-status ${statusClass}`} role="status">{statusText}</span>
        <button type="button" className="st-btn st-btn-ghost st-btn-sm" onClick={() => setDraft(saved)} disabled={!dirty || status.state === 'saving'}>Discard</button>
        <a href={`/store/${saved.slug}`} target="_blank" rel="noopener noreferrer" className="st-btn st-btn-ghost st-btn-sm">View store ↗</a>
        <button type="button" className="st-btn st-btn-sm" onClick={publish} disabled={!dirty || status.state === 'saving'}>
          {status.state === 'saving' ? 'Publishing…' : 'Publish'}
        </button>
      </header>

      <div className="studio-mobile-tabs">
        <div className="st-seg st-seg-sm" style={{ width: '100%' }} role="radiogroup" aria-label="View">
          <button type="button" role="radio" aria-checked={view === 'edit'} className={view === 'edit' ? 'on' : ''} onClick={() => setView('edit')}>Edit</button>
          <button type="button" role="radio" aria-checked={view === 'preview'} className={view === 'preview' ? 'on' : ''} onClick={() => setView('preview')}>Preview</button>
        </div>
      </div>

      <div className="studio-body" data-view={view}>
        <aside className="studio-side">
          <StudioEditor draft={draft} onChange={change} />
        </aside>
        <section className="studio-stage" aria-label="Live preview">
          <div className="ob-stage-bar">
            <strong>Live preview</strong>
            <DeviceToggle device={device} onChange={setDevice} />
          </div>
          <StudioPreview draft={draft} products={products} device={device} />
        </section>
      </div>
    </div>
  );
}

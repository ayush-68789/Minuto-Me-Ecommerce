// Owner: M4 -- the dashboard Store Studio: same panels + live 3D preview as onboarding, saving to PUT /api/dashboard/store
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import StudioPreview from '../studio/StudioPreview';
import { LayoutPanel, SectionsPanel, SettingsPanel, StylePanel, ThemePanel } from '../studio/StudioPanels';
import { downscaleImage } from '../studio/imageTools';
import { DEFAULT_THEME } from '../../theme/themeConfig';
import { IconBrush, IconEye, IconLayers, IconLayout, IconPalette, IconSettings, IconStore, IconUpload } from '../common/Icons';
import '../../pages/onboarding/onboarding.css';

const TABS = [
  ['details', 'Details', IconStore],
  ['theme', 'Theme', IconBrush],
  ['style', 'Style', IconPalette],
  ['layout', 'Layout', IconLayout],
  ['sections', 'Sections', IconLayers],
  ['settings', 'Settings', IconSettings],
];
const CATEGORIES = ['Fashion', 'Electronics', 'Beauty', 'Food & Grocery', 'Home & Living', 'Books', 'Sports', 'Other'];

export const toForm = (store = {}) => ({
  ...store,
  businessName: store.businessName || '',
  category: store.category || 'Other',
  description: store.description || '',
  currency: store.currency || 'INR',
  template: store.template || 'modern',
  branding: { logo: '', primaryColor: '#4f46e5', secondaryColor: '#eef2ff', accentColor: '#f97316', banners: [], ...(store.branding || {}) },
  contact: { email: '', phone: '', address: '', ...(store.contact || {}) },
  features: { payments: false, reviews: false, wishlist: false, coupons: false, ...(store.features || {}) },
  theme: { ...DEFAULT_THEME, ...(store.theme || {}), content: { ...(store.theme?.content || {}) } },
  social: { ...(store.social || {}) },
});

const payload = (f) => ({
  businessName: f.businessName,
  category: f.category,
  description: f.description,
  currency: f.currency,
  template: f.template,
  branding: f.branding,
  contact: f.contact,
  features: f.features,
  theme: f.theme,
  social: f.social,
});

export default function BrandingEditor({ store, products, onSave, isSaving = false, subscriberCount = 0 }) {
  const [form, setForm] = useState(() => toForm(store));
  const [saved, setSaved] = useState(() => JSON.stringify(payload(toForm(store))));
  const [tab, setTab] = useState('theme');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [focus, setFocus] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const logoRef = useRef(null);

  useEffect(() => {
    setForm(toForm(store));
    setSaved(JSON.stringify(payload(toForm(store))));
  }, [store?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = JSON.stringify(payload(form)) !== saved;
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = (fn) => setForm(fn);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setContact = (patch) => setForm((f) => ({ ...f, contact: { ...f.contact, ...patch } }));
  const previewStore = useMemo(() => ({ ...form, slug: store?.slug }), [form, store?.slug]);

  const save = async () => {
    if (!form.businessName.trim()) { setTab('details'); setError('Store name is required'); return; }
    setError('');
    const res = await onSave(payload(form));
    if (res?.ok) {
      setSaved(JSON.stringify(payload(form)));
      setToast('Saved! Your live store is updated.');
      setTimeout(() => setToast(''), 3500);
    } else {
      setError(res?.message || 'Could not save your changes');
    }
  };

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const logo = await downscaleImage(file, { max: 200, quality: 0.9, square: true });
    setForm((f) => ({ ...f, branding: { ...f.branding, logo } }));
  };

  const onSectionPick = (key) => { setTab('sections'); setFocus({ key, n: Date.now() }); setMobilePreview(false); };

  return (
    <div className="be">
      <div className="be-bar">
        <div className="be-tabs" role="tablist">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        <div className="be-actions">
          <span className="be-subs" title="Newsletter sign-ups from your storefront">✉️ {subscriberCount} subscriber{subscriberCount === 1 ? '' : 's'}</span>
          {store?.slug && <Link to={`/store/${store.slug}`} target="_blank" className="btn btn-ghost btn-sm"><IconEye size={15} /> Live store</Link>}
          <button type="button" className="btn btn-ghost btn-sm be-mprev" onClick={() => setMobilePreview(true)}><IconEye size={15} /> Preview</button>
          {dirty && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(toForm(store))}>Discard</button>}
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={isSaving || !dirty}>{isSaving ? 'Saving…' : dirty ? 'Save changes' : 'All saved ✓'}</button>
        </div>
      </div>
      {(toast || error) && <div className={error ? 'error-box' : 'be-toast'}>{error || toast}</div>}

      <div className="be-grid">
        <section className="be-panel">
          {tab === 'details' && (
            <div className="st-panel">
              <div className="field" style={{ margin: 0 }}>
                <label className="label" htmlFor="be-name">Store name</label>
                <input id="be-name" className="input" maxLength={60} value={form.businessName} onChange={(e) => set({ businessName: e.target.value })} />
                <div className="hint">Store link: minuto.me/store/{store?.slug} (fixed)</div>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label" htmlFor="be-cat">Category</label>
                <select id="be-cat" className="input" value={form.category} onChange={(e) => set({ category: e.target.value })}>
                  {[...new Set([...CATEGORIES, form.category])].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <span className="label">Logo</span>
                <div className="ob-logo">
                  <span className="ob-logo-mark" style={{ background: form.branding.primaryColor }}>
                    {form.branding.logo ? <img src={form.branding.logo} alt="" className="img-cover" /> : (form.businessName || 'S').charAt(0).toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => logoRef.current?.click()}><IconUpload size={15} /> Upload</button>
                    {form.branding.logo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, branding: { ...f.branding, logo: '' } }))}>Remove</button>}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" hidden onChange={onLogo} />
                </div>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label" htmlFor="be-desc">Description</label>
                <textarea id="be-desc" className="input" maxLength={1000} value={form.description} onChange={(e) => set({ description: e.target.value })} />
              </div>
              <div className="ob-two">
                <div className="field" style={{ margin: 0 }}><label className="label" htmlFor="be-em">Email</label><input id="be-em" className="input" type="email" value={form.contact.email} onChange={(e) => setContact({ email: e.target.value })} /></div>
                <div className="field" style={{ margin: 0 }}><label className="label" htmlFor="be-ph">Phone</label><input id="be-ph" className="input" value={form.contact.phone} onChange={(e) => setContact({ phone: e.target.value })} /></div>
              </div>
              <div className="field" style={{ margin: 0 }}><label className="label" htmlFor="be-ad">Address</label><input id="be-ad" className="input" value={form.contact.address} onChange={(e) => setContact({ address: e.target.value })} /></div>
            </div>
          )}
          {tab === 'theme' && <ThemePanel form={form} update={update} />}
          {tab === 'style' && <StylePanel form={form} update={update} />}
          {tab === 'layout' && <LayoutPanel form={form} update={update} />}
          {tab === 'sections' && <SectionsPanel form={form} update={update} focus={focus} />}
          {tab === 'settings' && <SettingsPanel form={form} update={update} />}
        </section>
        <section className="be-preview">
          <StudioPreview store={previewStore} products={products} onSectionPick={onSectionPick} activeSection={focus?.key} />
        </section>
      </div>

      {mobilePreview && (
        <div className="ob-sheet" role="dialog" aria-label="Store preview">
          <StudioPreview store={previewStore} products={products} defaultMode="mobile" onClose={() => setMobilePreview(false)} onSectionPick={onSectionPick} />
        </div>
      )}
    </div>
  );
}

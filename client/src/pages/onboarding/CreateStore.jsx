// Owner: M2 -- Store Studio wizard: business -> theme -> style -> layout -> sections -> settings -> launch.
// The right side is a live preview (desktop / phone / 3D devices / 3D layers) of the real storefront.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { createStoreRequest } from '../../api/storeApi';
import { fetchStorefront } from '../../api/storefrontApi';
import { errorMessage } from '../../api/authApi';
import { SAMPLE_PRODUCTS } from '../../demo/seedData';
import { applyPreset, BANNERS, DEFAULT_THEME, PRESETS, resolveTheme, SECTIONS, TEMPLATES, FONTS } from '../../theme/themeConfig';
import Logo from '../../components/common/Logo';
import StudioPreview from '../../components/studio/StudioPreview';
import { LayoutPanel, SectionsPanel, SettingsPanel, StylePanel, ThemePanel } from '../../components/studio/StudioPanels';
import { uploadImage } from '../../api/uploadApi';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { IconArrow, IconCheck, IconEye, IconUpload } from '../../components/common/Icons';
import './onboarding.css';

const STORE_TYPES = [['Fashion', '👗'], ['Electronics', '🎧'], ['Beauty', '💄'], ['Food & Grocery', '🥑'], ['Home & Living', '🛋️'], ['Books', '📚'], ['Sports', '⚽'], ['Other', '✨']];
// a sensible starting look per business type (only until the owner picks a theme themselves)
const SUGGESTED = { Fashion: 'street', Electronics: 'midnight', Beauty: 'bloom', 'Food & Grocery': 'citrus', 'Home & Living': 'terra', Books: 'paper', Sports: 'breeze', Other: 'aurora' };
const STEPS = [
  ['business', 'Business', 'Tell us about your business', 'This is what customers see first. You can change everything later.'],
  ['theme', 'Theme', 'Pick a look you love', 'Start from a complete theme, or mix any template with your own style.'],
  ['style', 'Style', 'Make it unmistakably yours', 'Colors, fonts, corners, buttons and cards. Watch the preview update live.'],
  ['layout', 'Layout', 'Design your homepage', 'Hero style, banner images, navigation and product grid.'],
  ['sections', 'Sections', 'Build your page', 'Turn sections on, reorder them and write your own copy.'],
  ['settings', 'Settings', 'Store settings', 'Currency, checkout features and social links.'],
  ['launch', 'Launch', 'Ready for launch 🚀', 'Spin your store in 3D, then publish it to the world.'],
];

const slugify = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function useSlugCheck(slug) {
  const [state, setState] = useState('idle');
  useEffect(() => {
    if (!slug || slug.length < 2) return setState('idle');
    setState('checking');
    let live = true;
    const id = setTimeout(() => {
      fetchStorefront(slug)
        .then(() => live && setState('taken'))
        .catch((err) => live && setState(err?.response?.status === 404 ? 'free' : 'idle'));
    }, 450);
    return () => { live = false; clearTimeout(id); };
  }, [slug]);
  return state;
}

export default function CreateStore() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const [step, setStep] = useState(0);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [sectionFocus, setSectionFocus] = useState(null);
  const [form, setForm] = useState(() =>
    applyPreset(
      {
        businessName: '',
        slug: '',
        category: 'Fashion',
        description: '',
        contact: { email: user?.email || '', phone: '', address: '' },
        template: 'modern',
        branding: { logo: '', primaryColor: '#4f46e5', secondaryColor: '#eef2ff', accentColor: '#f97316', banners: [BANNERS[0], BANNERS[1]] },
        currency: 'INR',
        features: { reviews: true, wishlist: true, coupons: false },
        theme: { ...DEFAULT_THEME, content: {} },
        social: {},
      },
      PRESETS.find((p) => p.id === SUGGESTED.Fashion)
    )
  );
  const [presetTouched, setPresetTouched] = useState(false);

  const slug = slugify(form.slug || form.businessName);
  const slugState = useSlugCheck(slug);
  const previewStore = useMemo(() => ({ ...form, slug: slug || 'your-store', businessName: form.businessName || 'Your Store', createdAt: new Date().toISOString() }), [form, slug]);
  const products = SAMPLE_PRODUCTS.filter((p) => p.isActive);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const update = (fn) => {
    setPresetTouched(true); // any design edit means the owner is choosing their own look
    setForm(fn);
  };
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setContact = (patch) => setForm((f) => ({ ...f, contact: { ...f.contact, ...patch } }));

  const pickType = (category) => {
    setForm((f) => {
      const next = { ...f, category };
      const p = PRESETS.find((x) => x.id === SUGGESTED[category]);
      return !presetTouched && p ? applyPreset(next, p) : next;
    });
  };

  const validate = (i = step) => {
    if (i === 0) {
      if (!form.businessName.trim()) return 'Please enter your store name';
      if (!slug) return 'Please choose a store link';
    }
    return '';
  };
  const go = (i) => {
    if (i > step) {
      for (let k = step; k < i; k++) {
        const v = validate(k);
        if (v) { setError(v); setStep(k); return; }
      }
    }
    setError('');
    setStep(Math.max(0, Math.min(i, STEPS.length - 1)));
  };

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Logo must be an image');
    try {
      const logo = await uploadImage(file);
      setForm((f) => ({ ...f, branding: { ...f.branding, logo } }));
      setError('');
    } catch (err) {
      setError(err.message || 'Could not upload that image');
    }
  };

  const onLogoUrl = () => {
    const url = normalizeImageUrl(logoUrl);
    if (!url) return setError('Enter a valid HTTP or HTTPS image URL');
    setForm((f) => ({ ...f, branding: { ...f.branding, logo: url } }));
    setLogoUrl('');
    setError('');
  };

  const publish = async () => {
    const v = validate(0);
    if (v) { setError(v); setStep(0); return; }
    setError('');
    setBusy(true);
    try {
      const store = await createStoreRequest({ ...form, slug, status: 'active' });
      localStorage.setItem('minuto_store_id', store._id);
      await refresh();
      navigate('/dashboard', { replace: true, state: { justLaunched: true } });
    } catch (err) {
      setError(errorMessage(err, 'Could not create store'));
      if (err?.response?.status === 409) setStep(0);
    } finally {
      setBusy(false);
    }
  };

  const onSectionPick = (key) => {
    if (!SECTIONS[key]) return;
    setSectionFocus({ key, n: Date.now() });
    if (STEPS[step][0] !== 'sections') setStep(4);
    setMobilePreview(false);
  };

  const [id, , title, sub] = STEPS[step];
  const t = resolveTheme(previewStore);
  const isLaunch = id === 'launch';

  return (
    <div className="ob">
      <header className="ob-top">
        <Logo />
        <ol className="ob-steps">
          {STEPS.map(([sid, label], i) => (
            <li key={sid} className={i === step ? 'on' : i < step ? 'done' : ''}>
              <button type="button" onClick={() => go(i)}>
                <span>{i < step ? <IconCheck size={13} /> : i + 1}</span>
                <em>{label}</em>
              </button>
            </li>
          ))}
        </ol>
        <details className="ob-account">
          <summary>Hi, {user?.name?.split(' ')[0]} <span aria-hidden="true">▾</span></summary>
          <div className="ob-account-menu">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
            <Link to="/profile">View profile</Link>
            {user?.store && <Link to="/dashboard">My stores</Link>}
            <button type="button" onClick={async () => { await logout(); navigate('/login'); }}>Log out</button>
          </div>
        </details>
      </header>
      <div className="ob-progress"><i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>

      <div className={`ob-body${isLaunch ? ' launch' : ''}`}>
        <section className="ob-form" key={id}>
          <div className="fade-up">
            <span className="ob-kicker">Step {step + 1} of {STEPS.length}</span>
            <h1>{title}</h1>
            <p className="muted ob-sub">{sub}</p>

            {id === 'business' && (
              <>
                <div className="field">
                  <label className="label" htmlFor="bn">Store name *</label>
                  <input className="input" id="bn" placeholder="e.g. Urban Threads" value={form.businessName} autoFocus maxLength={60}
                    onChange={(e) => set({ businessName: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="slug">Store link</label>
                  <div className={`ob-slug ${slugState}`}>
                    <span>minuto.me/store/</span>
                    <input id="slug" value={form.slug} placeholder="urban-threads" maxLength={80} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} />
                    <b>{slugState === 'checking' ? '…' : slugState === 'free' ? '✓ Available' : slugState === 'taken' ? 'Will add a number' : ''}</b>
                  </div>
                  {slugState === 'taken' && <small className="muted">That link is in use. We’ll give your store a unique URL when you publish.</small>}
                </div>
                <div className="field">
                  <span className="label">What do you sell?</span>
                  <div className="ob-types">
                    {STORE_TYPES.map(([tp, emoji]) => (
                      <button type="button" key={tp} className={form.category === tp ? 'on' : ''} onClick={() => pickType(tp)}>
                        <span style={{ fontSize: 22 }}>{emoji}</span>{tp}
                      </button>
                    ))}
                  </div>
                  {!presetTouched && <p className="hint">✨ We matched a starter theme to your business type. Change it in the next step.</p>}
                </div>
                <div className="field">
                  <span className="label">Logo</span>
                  <div className="ob-logo">
                    <span className="ob-logo-mark" style={{ background: form.branding.primaryColor }}>
                      {form.branding.logo ? <img src={form.branding.logo} alt="" className="img-cover" /> : (form.businessName || 'S').charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => logoRef.current?.click()}><IconUpload size={16} /> {form.branding.logo ? 'Change logo' : 'Upload logo'}</button>
                      {form.branding.logo && <button type="button" className="btn btn-sm" style={{ background: 'none', color: 'var(--muted)' }} onClick={() => setForm((f) => ({ ...f, branding: { ...f.branding, logo: '' } }))}>Remove</button>}
                      <div className="hint">Square PNG/JPG. We can build your palette from it in “Style”.</div>
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" hidden onChange={onLogo} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <input aria-label="Logo image URL" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Or paste an image URL" style={{ width: 220, maxWidth: '100%', padding: '7px 9px', border: '1px solid #cbd5e1', borderRadius: 7 }} />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={onLogoUrl}>Use URL</button>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="desc">Short description</label>
                  <textarea className="input" id="desc" maxLength={300} placeholder="What makes your store special?" value={form.description} onChange={(e) => set({ description: e.target.value })} />
                  <div className="hint" style={{ textAlign: 'right' }}>{form.description.length}/300</div>
                </div>
                <div className="ob-two">
                  <div className="field">
                    <label className="label" htmlFor="ce">Contact email</label>
                    <input className="input" id="ce" type="email" value={form.contact.email} onChange={(e) => setContact({ email: e.target.value })} />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="cp">Phone</label>
                    <input className="input" id="cp" placeholder="+91 98765 43210" value={form.contact.phone} onChange={(e) => setContact({ phone: e.target.value })} />
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="ca">City / address</label>
                  <input className="input" id="ca" placeholder="Mathura, Uttar Pradesh" value={form.contact.address} onChange={(e) => setContact({ address: e.target.value })} />
                </div>
              </>
            )}
            {id === 'theme' && <ThemePanel form={form} update={update} />}
            {id === 'style' && <StylePanel form={form} update={update} />}
            {id === 'layout' && <LayoutPanel form={form} update={update} />}
            {id === 'sections' && <SectionsPanel form={form} update={update} focus={sectionFocus} />}
            {id === 'settings' && <SettingsPanel form={form} update={update} />}
            {isLaunch && (
              <div className="ob-summary">
                <div className="ob-sum-head">
                  <span className="ob-logo-mark" style={{ background: form.branding.primaryColor }}>
                    {form.branding.logo ? <img src={form.branding.logo} alt="" className="img-cover" /> : (form.businessName || 'S').charAt(0).toUpperCase()}
                  </span>
                  <div><strong>{previewStore.businessName}</strong><span>minuto.me/store/{previewStore.slug}</span></div>
                </div>
                <ul>
                  <li><span>Theme</span><b>{PRESETS.find((p) => p.id === form.theme.preset)?.name || 'Custom'} · {TEMPLATES.find((x) => x.id === t.template)?.name}</b><button type="button" onClick={() => go(1)}>Edit</button></li>
                  <li><span>Colors</span><b className="ob-dots">{['primaryColor', 'secondaryColor', 'accentColor'].map((k) => <i key={k} style={{ background: form.branding[k] }} />)} {t.mode}</b><button type="button" onClick={() => go(2)}>Edit</button></li>
                  <li><span>Fonts</span><b style={{ fontFamily: FONTS[t.font].heading }}>{FONTS[t.font].label}</b><button type="button" onClick={() => go(2)}>Edit</button></li>
                  <li><span>Hero</span><b>{t.heroLayout} · {t.heroHeight}</b><button type="button" onClick={() => go(3)}>Edit</button></li>
                  <li><span>Sections</span><b>{t.sections.filter((s) => s.on).length} live</b><button type="button" onClick={() => go(4)}>Edit</button></li>
                  <li><span>Currency</span><b>{form.currency}</b><button type="button" onClick={() => go(5)}>Edit</button></li>
                </ul>
                <p className="hint">Sample products are shown in the preview. Your real products replace them as soon as you add them in the dashboard.</p>
              </div>
            )}

            {error && <div className="error-box" style={{ marginTop: 16 }}>{error}</div>}
          </div>
          <div className="ob-nav">
            {step > 0 ? <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>Back</button> : <span />}
            <button type="button" className="btn btn-ghost ob-preview-btn" onClick={() => setMobilePreview(true)}><IconEye size={16} /> Preview</button>
            {isLaunch ? (
              <button type="button" className="btn btn-primary" onClick={publish} disabled={busy}>{busy ? 'Publishing…' : 'Publish my store'} <IconArrow size={16} /></button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => go(step + 1)}>{step === STEPS.length - 2 ? 'Review & launch' : 'Continue'} <IconArrow size={16} /></button>
            )}
          </div>
        </section>

        <section className="ob-preview">
          <StudioPreview
            key={isLaunch ? 'launch' : 'edit'}
            store={previewStore}
            products={products}
            defaultMode={isLaunch ? '3d' : 'desktop'}
            onSectionPick={onSectionPick}
            activeSection={sectionFocus?.key}
            url={`minuto.me/store/${previewStore.slug}`}
          />
        </section>
      </div>

      {mobilePreview && (
        <div className="ob-sheet" role="dialog" aria-label="Store preview">
          <StudioPreview store={previewStore} products={products} defaultMode="mobile" onClose={() => setMobilePreview(false)} onSectionPick={onSectionPick} activeSection={sectionFocus?.key} />
        </div>
      )}
    </div>
  );
}

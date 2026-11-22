// Editor panels shared by onboarding (CreateStore) and the dashboard (Store settings).
// Each panel receives the full store-shaped `form` + an `update(fn)` that returns the next form.
import { useEffect, useRef, useState } from 'react';
import { applyPreset, BANNERS, FONTS, OPTIONS, PALETTES, PRESETS, resolveTheme, SECTIONS, TEMPLATES, isLight } from '../../theme/themeConfig';
import { useFonts } from '../../hooks/useStoreTheme';
import { IconCheck, IconChevronDown, IconChevronUp, IconFacebook, IconInstagram, IconShuffle, IconTwitter, IconUpload, IconWhatsapp, IconYoutube } from '../common/Icons';
import { downscaleImage, extractBrandColors } from './imageTools';

const ALL_FONTS = Object.keys(FONTS);

/* ---------- small building blocks ---------- */
export function Seg({ value, options, onChange }) {
  return (
    <div className="st-seg">
      {options.map(([v, label]) => (
        <button type="button" key={String(v)} className={value === v ? 'on' : ''} onClick={() => onChange(v)} aria-pressed={value === v}>{label}</button>
      ))}
    </div>
  );
}
const Group = ({ title, hint, right, children }) => (
  <div className="st-group">
    <h3 className="st-h">{title}{right}</h3>
    {hint && <p className="st-help">{hint}</p>}
    {children}
  </div>
);
const Tick = () => <span className="st-check"><IconCheck size={12} /></span>;

/* helpers to patch nested parts of the form */
export const patchTheme = (update, patch) => update((f) => ({ ...f, theme: { ...f.theme, ...patch, preset: patch.preset ?? 'custom' } }));
const patchContent = (update, patch) => update((f) => ({ ...f, theme: { ...f.theme, content: { ...(f.theme?.content || {}), ...patch } } }));
const patchBranding = (update, patch) => update((f) => ({ ...f, branding: { ...f.branding, ...patch } }));

/* ===================== THEME: presets + templates ===================== */
export function ThemePanel({ form, update }) {
  useFonts(ALL_FONTS);
  const surprise = () => {
    const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    const font = ALL_FONTS[Math.floor(Math.random() * ALL_FONTS.length)];
    const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)].id;
    const rnd = (k) => OPTIONS[k][Math.floor(Math.random() * OPTIONS[k].length)][0];
    update((f) => ({
      ...applyPreset(f, p),
      template: tpl,
      branding: { ...f.branding, primaryColor: pal[1], secondaryColor: pal[2], accentColor: pal[3] },
      theme: { ...f.theme, ...p.theme, preset: 'custom', font, buttonStyle: rnd('buttonStyle'), cardStyle: rnd('cardStyle'), heroLayout: rnd('heroLayout'), pattern: rnd('pattern'), radius: rnd('radius') },
    }));
  };
  const t = resolveTheme(form);
  return (
    <div className="st-panel">
      <Group
        title={<span>Complete themes <small>· {PRESETS.length} looks</small></span>}
        hint="One click sets the template, colors, fonts, shapes and hero. Fine-tune everything in the next steps."
        right={<button type="button" className="btn btn-ghost btn-sm st-surprise" onClick={surprise}><IconShuffle size={14} /> Surprise me</button>}
      >
        <div className="st-presets">
          {PRESETS.map((p) => {
            const [pr, bg, ac] = p.colors;
            const dark = p.theme.mode === 'dark';
            const page = dark ? (isLight(bg) ? '#0f0f17' : bg) : p.theme.mode === 'tinted' ? bg : '#ffffff';
            const ink = dark ? '#f4f4f7' : '#0f172a';
            const f = FONTS[p.theme.font];
            const r = { sharp: 0, soft: 6, round: 10, pill: 20 }[p.theme.radius];
            return (
              <button type="button" key={p.id} className={`st-tile st-preset${form.theme?.preset === p.id ? ' on' : ''}`} onClick={() => update((fm) => applyPreset(fm, p))}>
                <span className="st-preset-art" style={{ background: page, color: ink }}>
                  <span className="pa-nav" style={{ fontFamily: f.heading }}><i style={{ background: pr }} />{(form.businessName || 'Store').slice(0, 14)}</span>
                  <span className="pa-title" style={{ fontFamily: f.heading, fontWeight: ['cormorant', 'dmserif', 'playfair'].includes(p.theme.font) ? 500 : 800 }}>{p.name}</span>
                  <span className="pa-btn" style={{ background: p.theme.buttonStyle === 'outline' ? 'transparent' : p.theme.buttonStyle === 'gradient' ? `linear-gradient(90deg, ${pr}, ${ac})` : pr, color: isLight(pr) && p.theme.buttonStyle !== 'outline' ? '#111' : p.theme.buttonStyle === 'outline' ? pr : '#fff', border: `1.5px solid ${pr}`, borderRadius: r }}>Shop now</span>
                  <span className="pa-row">
                    <span style={{ background: pr, borderRadius: r / 2 }} />
                    <span style={{ background: ac, borderRadius: r / 2, height: 34 }} />
                    <span style={{ background: dark ? '#ffffff22' : '#0f172a14', borderRadius: r / 2 }} />
                  </span>
                </span>
                <span className="st-preset-meta"><strong>{p.name}</strong><em>{p.tag}</em></span>
                {form.theme?.preset === p.id && <Tick />}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Template" hint="The structure & personality: typography, section styling and decorations.">
        <div className="st-tile-grid four">
          {TEMPLATES.map((tp) => (
            <button type="button" key={tp.id} className={`st-tile${t.template === tp.id ? ' on' : ''}`} onClick={() => update((f) => ({ ...f, template: tp.id, theme: { ...f.theme, preset: 'custom' } }))} title={tp.text}>
              <span className={`st-tpl-art tpl-${tp.id}`}><b>{tp.name}<br />Store</b><i /><i /><i /></span>
              <strong>{tp.name}</strong>
              <small>{tp.text}</small>
            </button>
          ))}
        </div>
      </Group>
    </div>
  );
}

/* ===================== STYLE: colors, mode, fonts, shapes ===================== */
export function StylePanel({ form, update }) {
  useFonts(ALL_FONTS);
  const t = resolveTheme(form);
  const b = form.branding || {};
  const [logoMsg, setLogoMsg] = useState('');

  const fromLogo = async () => {
    if (!b.logo) return setLogoMsg('Upload a logo first (Business step or below)');
    const cols = await extractBrandColors(b.logo);
    if (!cols) return setLogoMsg('Could not read colors from this logo');
    patchBranding(update, { primaryColor: cols.primary, secondaryColor: cols.soft, accentColor: cols.accent });
    setLogoMsg('Palette generated from your logo ✨');
  };

  return (
    <div className="st-panel">
      <Group title="Color palette" right={<button type="button" className="btn btn-ghost btn-sm" onClick={fromLogo}>🎨 From my logo</button>}>
        {logoMsg && <p className="st-help" style={{ margin: 0 }}>{logoMsg}</p>}
        <div className="st-palettes">
          {PALETTES.map(([name, p, s, a]) => (
            <button type="button" key={name} title={name} className={b.primaryColor === p && b.accentColor === a ? 'on' : ''} onClick={() => patchBranding(update, { primaryColor: p, secondaryColor: s, accentColor: a })}>
              <i style={{ background: p }} /><i style={{ background: s }} /><i style={{ background: a }} />
            </button>
          ))}
        </div>
        <div className="st-colors">
          {[['primaryColor', 'Brand'], ['secondaryColor', 'Background'], ['accentColor', 'Accent']].map(([k, l]) => (
            <label key={k} className="st-color">
              <input type="color" value={b[k] || '#000000'} onChange={(e) => patchBranding(update, { [k]: e.target.value })} />
              <span><strong>{l}</strong>{b[k]}</span>
            </label>
          ))}
        </div>
      </Group>

      <Group title="Mode" hint="Tinted uses your background color across the whole page.">
        <Seg value={t.mode} options={[['light', '☀️ Light'], ['tinted', '🎨 Tinted'], ['dark', '🌙 Dark']]} onChange={(v) => patchTheme(update, { mode: v })} />
      </Group>

      <Group title={<span>Typography <small>· {ALL_FONTS.length} pairings</small></span>}>
        <div className="st-fonts">
          {ALL_FONTS.map((k) => (
            <button type="button" key={k} className={`st-tile st-font${t.font === k ? ' on' : ''}`} onClick={() => patchTheme(update, { font: k })}>
              <span className="aa" style={{ fontFamily: FONTS[k].heading }}>Aa</span>
              <strong style={{ fontFamily: FONTS[k].heading }}>{FONTS[k].label}</strong>
              <small style={{ fontFamily: FONTS[k].body }}>{FONTS[k].vibe}</small>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Corners">
        <Seg value={t.radius} options={OPTIONS.radius} onChange={(v) => patchTheme(update, { radius: v })} />
      </Group>

      <Group title="Buttons">
        <div className="st-tile-grid">
          {OPTIONS.buttonStyle.map(([k, l]) => {
            const p = b.primaryColor;
            const st = {
              solid: { background: p, color: isLight(p) ? '#111' : '#fff' },
              gradient: { background: `linear-gradient(90deg, ${p}, ${b.accentColor})`, color: '#fff' },
              outline: { background: 'transparent', color: p, borderColor: p },
              soft: { background: b.secondaryColor, color: p },
              glass: { background: `${p}33`, color: '#0f172a', borderColor: `${p}88`, boxShadow: `0 0 12px -2px ${p}aa` },
              brutal: { background: p, color: isLight(p) ? '#111' : '#fff', borderColor: '#0f172a', boxShadow: '3px 3px 0 #0f172a' },
            }[k];
            const radius = { sharp: 0, soft: 8, round: 12, pill: 99 }[t.radius];
            return (
              <button type="button" key={k} className={`st-tile${t.buttonStyle === k ? ' on' : ''}`} onClick={() => patchTheme(update, { buttonStyle: k })}>
                <span className="st-sample-btn" style={{ ...st, borderRadius: radius }}>Shop now</span>
                <strong>{l}</strong>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Product cards">
        <div className="st-tile-grid">
          {OPTIONS.cardStyle.map(([k, l]) => {
            const s = {
              clean: {}, bordered: { background: '#fff', boxShadow: 'inset 0 0 0 1.5px #cbd5e1' }, shadow: { background: '#fff', boxShadow: '0 8px 18px -8px rgba(15,23,42,.35)' },
              glass: { background: 'rgba(99,102,241,.08)', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,.35)' }, polaroid: { background: '#fff', transform: 'rotate(-3deg)', boxShadow: '0 6px 14px -6px rgba(0,0,0,.4)' },
              overlay: { background: 'linear-gradient(180deg, #c7d2fe 50%, #1e1b4b)' },
            }[k];
            return (
              <button type="button" key={k} className={`st-tile${t.cardStyle === k ? ' on' : ''}`} onClick={() => patchTheme(update, { cardStyle: k })}>
                <span className="st-card-art"><span style={{ ...s, padding: 3 }} /></span>
                <strong>{l}</strong>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Background pattern">
        <Seg value={t.pattern} options={OPTIONS.pattern} onChange={(v) => patchTheme(update, { pattern: v })} />
      </Group>

      <Group title="Motion" hint="Scroll-in animations on your live store.">
        <Seg value={t.animation} options={OPTIONS.animation} onChange={(v) => patchTheme(update, { animation: v })} />
      </Group>
    </div>
  );
}

/* ===================== LAYOUT: hero, banners, nav, grid ===================== */
export function LayoutPanel({ form, update }) {
  const t = resolveTheme(form);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const banners = form.branding?.banners || [];
  const custom = banners.filter((x) => x.startsWith('data:'));
  const multi = t.heroLayout === 'slider';

  const toggleBanner = (src) => {
    if (!multi) return patchBranding(update, { banners: [src, ...banners.filter((x) => x !== src)].slice(0, 5) });
    const on = banners.includes(src);
    const next = on ? banners.filter((x) => x !== src) : [...banners, src].slice(-5);
    patchBranding(update, { banners: next.length ? next : [src] });
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setErr('Please choose an image file');
    if (custom.length >= 3) return setErr('You can upload up to 3 of your own banners');
    setBusy(true);
    setErr('');
    try {
      const data = await downscaleImage(file, { max: 1600, quality: 0.78 });
      patchBranding(update, { banners: multi ? [...banners, data].slice(-5) : [data, ...banners].slice(0, 5) });
    } catch {
      setErr('Could not read that image');
    } finally {
      setBusy(false);
    }
  };

  const gallery = [...custom, ...BANNERS];
  return (
    <div className="st-panel">
      <Group title="Hero style">
        <div className="st-tile-grid">
          {OPTIONS.heroLayout.map(([k, l]) => (
            <button type="button" key={k} className={`st-tile${t.heroLayout === k ? ' on' : ''}`} onClick={() => patchTheme(update, { heroLayout: k })}>
              <span className={`st-hero-art ha-${k}`} />
              <strong>{l}</strong>
            </button>
          ))}
        </div>
      </Group>
      <Group title="Hero height"><Seg value={t.heroHeight} options={OPTIONS.heroHeight} onChange={(v) => patchTheme(update, { heroHeight: v })} /></Group>

      <Group title={multi ? 'Slideshow images' : 'Banner image'} hint={multi ? 'Pick up to 5 images. They rotate every 5 seconds.' : ['split', 'image', 'centered'].includes(t.heroLayout) ? 'Shown in your hero. Upload your own for the best result.' : 'This hero style uses your product photos; the banner is also used in “Our story”.'}>
        <div className="st-banners">
          <button type="button" className="st-upload" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? '…' : <><IconUpload size={16} /> Upload</>}</button>
          {gallery.map((src, gi) => {
            const idx = banners.indexOf(src);
            return (
              <button type="button" key={src.startsWith('data:') ? `up-${gi}-${src.length}` : src} className={(multi ? idx >= 0 : idx === 0) ? 'on' : ''} style={{ backgroundImage: `url(${src.startsWith('data:') ? src : src.replace('w=1800', 'w=300')})` }} onClick={() => toggleBanner(src)} aria-label="Choose banner">
                {multi && idx >= 0 && <b>{idx + 1}</b>}
              </button>
            );
          })}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
        {err && <p className="st-help" style={{ color: '#dc2626' }}>{err}</p>}
      </Group>

      <Group title="Hero text" hint="Leave blank to use your store name and description.">
        <input className="input" maxLength={120} placeholder={form.businessName || 'Headline'} value={t.content.heroTitle} onChange={(e) => patchContent(update, { heroTitle: e.target.value })} aria-label="Hero headline" />
        <textarea className="input" maxLength={300} placeholder={form.description || t.content._fallbackSub} value={t.content.heroSubtitle} onChange={(e) => patchContent(update, { heroSubtitle: e.target.value })} aria-label="Hero subtitle" />
        <input className="input" maxLength={40} placeholder="Button text" value={t.content.ctaText} onChange={(e) => patchContent(update, { ctaText: e.target.value })} aria-label="Button text" />
      </Group>

      <Group title="Announcement bar">
        <div className="st-inline">
          <div><strong>Show a top bar</strong><span>Great for offers & shipping info</span></div>
          <button type="button" role="switch" aria-checked={t.showAnnouncement} aria-label="Announcement bar" className="switch" onClick={() => patchTheme(update, { showAnnouncement: !t.showAnnouncement })} />
        </div>
        {t.showAnnouncement && <input className="input" maxLength={160} value={t.content.announcement} onChange={(e) => patchContent(update, { announcement: e.target.value })} aria-label="Announcement text" />}
      </Group>

      <Group title="Navigation">
        <Seg value={t.navStyle} options={OPTIONS.navStyle} onChange={(v) => patchTheme(update, { navStyle: v })} />
        <div className="st-inline">
          <div><strong>Sticky header</strong><span>Stays visible while scrolling</span></div>
          <button type="button" role="switch" aria-checked={t.stickyNav} aria-label="Sticky header" className="switch" onClick={() => patchTheme(update, { stickyNav: !t.stickyNav })} />
        </div>
      </Group>

      <Group title="Product grid">
        <div className="st-two">
          <div><p className="st-help" style={{ margin: '0 0 6px' }}>Desktop columns</p><Seg value={t.gridColumns} options={[[2, '2'], [3, '3'], [4, '4'], [5, '5']]} onChange={(v) => patchTheme(update, { gridColumns: v })} /></div>
          <div><p className="st-help" style={{ margin: '0 0 6px' }}>Mobile columns</p><Seg value={t.mobileColumns} options={[[1, '1'], [2, '2']]} onChange={(v) => patchTheme(update, { mobileColumns: v })} /></div>
        </div>
        <p className="st-help" style={{ margin: '4px 0 -4px' }}>Image shape</p>
        <Seg value={t.imageRatio} options={OPTIONS.imageRatio} onChange={(v) => patchTheme(update, { imageRatio: v })} />
      </Group>
    </div>
  );
}

/* ===================== SECTIONS: toggle, reorder, edit copy ===================== */
export function SectionsPanel({ form, update, focus }) {
  const t = resolveTheme(form);
  const [open, setOpen] = useState(null);
  const [flash, setFlash] = useState(null);
  const refs = useRef({});

  useEffect(() => {
    if (!focus?.key || !SECTIONS[focus.key]) return undefined;
    setFlash(focus.key);
    if (['marquee', 'promo', 'about', 'newsletter', 'testimonials'].includes(focus.key)) setOpen(focus.key);
    refs.current[focus.key]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const id = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(id);
  }, [focus]);

  const setSections = (list) => patchTheme(update, { sections: list.map(({ key, on }) => ({ key, on })), preset: form.theme?.preset });
  const move = (i, d) => {
    const list = [...t.sections];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setSections(list);
  };
  const toggle = (key) => setSections(t.sections.map((s) => (s.key === key && !SECTIONS[key].locked ? { ...s, on: !s.on } : s)));
  const c = t.content;
  const quotes = c.testimonials || [];
  const setQuote = (i, patch) => patchContent(update, { testimonials: quotes.map((q, n) => (n === i ? { ...q, ...patch } : q)) });

  const editors = {
    marquee: <input className="input" maxLength={200} value={c.marquee} onChange={(e) => patchContent(update, { marquee: e.target.value })} placeholder="Separate messages with •" aria-label="Ticker text" />,
    promo: (
      <>
        <input className="input" maxLength={100} value={c.promoTitle} onChange={(e) => patchContent(update, { promoTitle: e.target.value })} aria-label="Sale title" />
        <textarea className="input" maxLength={240} value={c.promoText} onChange={(e) => patchContent(update, { promoText: e.target.value })} aria-label="Sale text" />
        <p className="st-help">The product and % shown are your real biggest discount.</p>
      </>
    ),
    about: (
      <>
        <input className="input" maxLength={100} value={c.aboutTitle} onChange={(e) => patchContent(update, { aboutTitle: e.target.value })} aria-label="Story title" />
        <textarea className="input" maxLength={1200} rows={5} value={c.aboutText} onChange={(e) => patchContent(update, { aboutText: e.target.value })} aria-label="Story text" />
        <p className="st-help">Uses your 2nd banner image (or the 1st).</p>
      </>
    ),
    newsletter: (
      <>
        <input className="input" maxLength={100} value={c.newsletterTitle} onChange={(e) => patchContent(update, { newsletterTitle: e.target.value })} aria-label="Newsletter title" />
        <p className="st-help">Sign-ups are saved to your store for real.</p>
      </>
    ),
    testimonials: (
      <>
        {quotes.map((q, i) => (
          <div key={i} className="st-quote-edit">
            <input className="input" maxLength={60} value={q.name} onChange={(e) => setQuote(i, { name: e.target.value })} aria-label="Customer name" />
            <select className="input" value={q.rating} onChange={(e) => setQuote(i, { rating: +e.target.value })} aria-label="Rating">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}★</option>)}</select>
            <textarea className="input" maxLength={400} value={q.text} onChange={(e) => setQuote(i, { text: e.target.value })} aria-label="Quote" />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          {quotes.length < 6 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => patchContent(update, { testimonials: [...quotes, { name: 'Customer', text: '', rating: 5 }] })}>+ Add quote</button>}
          {quotes.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => patchContent(update, { testimonials: quotes.slice(0, -1) })}>Remove last</button>}
        </div>
      </>
    ),
  };

  return (
    <div className="st-panel">
      <Group title={<span>Page sections <small>· {t.sections.filter((s) => s.on).length} on</small></span>} hint="Switch sections on, drag them into order with the arrows, and edit their text. Tip: in the 3D layers view, click a layer to jump here.">
        <div className="st-secs">
          {t.sections.map((s, i) => {
            const def = SECTIONS[s.key];
            return (
              <div key={s.key} ref={(el) => { refs.current[s.key] = el; }} className={`st-sec${s.on ? '' : ' off'}${flash === s.key ? ' flash' : ''}`}>
                <div className="st-sec-row">
                  <div className="st-move">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${def.label} up`}><IconChevronUp size={14} /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === t.sections.length - 1} aria-label={`Move ${def.label} down`}><IconChevronDown size={14} /></button>
                  </div>
                  <span className="st-sec-ico">{def.icon}</span>
                  <div><strong>{def.label}</strong><small>{def.text}</small></div>
                  {editors[s.key] && <button type="button" className="st-edit" onClick={() => setOpen(open === s.key ? null : s.key)} aria-expanded={open === s.key} aria-label={`Edit ${def.label}`}>✎</button>}
                  <button type="button" role="switch" aria-checked={s.on} aria-label={def.label} className="switch" disabled={def.locked} style={def.locked ? { opacity: 0.5 } : undefined} onClick={() => toggle(s.key)} />
                </div>
                {open === s.key && editors[s.key] && <div className="st-sec-body">{editors[s.key]}</div>}
              </div>
            );
          })}
        </div>
      </Group>
    </div>
  );
}

/* ===================== SETTINGS: currency, features, social ===================== */
export const CURRENCIES = [['INR', '₹ Indian Rupee'], ['USD', '$ US Dollar'], ['EUR', '€ Euro'], ['GBP', '£ British Pound'], ['AED', 'د.إ UAE Dirham'], ['AUD', 'A$ Australian Dollar'], ['CAD', 'C$ Canadian Dollar'], ['SGD', 'S$ Singapore Dollar'], ['JPY', '¥ Japanese Yen']];
const FEATURES = [
  ['payments', 'Online payments', 'Accept cards & UPI (sandbox) alongside cash on delivery'],
  ['reviews', 'Star ratings', 'Show ratings on product cards and pages'],
  ['wishlist', 'Wishlist', 'Shoppers can heart products and filter by them'],
  ['coupons', 'Coupons', 'Discount codes at checkout'],
];
const SOCIAL = [['instagram', IconInstagram, '@yourbrand'], ['facebook', IconFacebook, 'facebook.com/yourbrand'], ['twitter', IconTwitter, '@yourbrand'], ['youtube', IconYoutube, '@yourchannel'], ['whatsapp', IconWhatsapp, '+91 98765 43210']];

export function SettingsPanel({ form, update }) {
  return (
    <div className="st-panel">
      <Group title="Currency">
        <select className="input" value={form.currency} onChange={(e) => update((f) => ({ ...f, currency: e.target.value }))} aria-label="Currency">
          {CURRENCIES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
        </select>
      </Group>
      <Group title="Features">
        {FEATURES.map(([k, title, text]) => (
          <div key={k} className="st-inline">
            <div><strong>{title}</strong><span>{text}</span></div>
            <button type="button" role="switch" aria-checked={!!form.features?.[k]} aria-label={title} className="switch" onClick={() => update((f) => ({ ...f, features: { ...f.features, [k]: !f.features?.[k] } }))} />
          </div>
        ))}
      </Group>
      <Group title="Social links" hint="Shown as icons in your store footer.">
        <div className="st-social">
          {SOCIAL.map(([k, Icon, ph]) => (
            <label key={k}>
              <Icon size={17} />
              <input value={form.social?.[k] || ''} maxLength={200} placeholder={ph} onChange={(e) => update((f) => ({ ...f, social: { ...(f.social || {}), [k]: e.target.value } }))} aria-label={k} />
            </label>
          ))}
        </div>
      </Group>
    </div>
  );
}

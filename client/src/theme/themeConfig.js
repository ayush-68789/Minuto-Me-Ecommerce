// Owner: M2/M3 -- single source of truth for every storefront design option.
// The studio (onboarding + dashboard) edits these, the storefront renders them, the server stores them.

const u = (id, w = 1800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const FONTS = {
  jakarta: { label: 'Jakarta', vibe: 'Friendly modern', heading: 'Plus Jakarta Sans', body: 'Plus Jakarta Sans', families: ['Plus Jakarta Sans:wght@400;500;600;700;800'] },
  inter: { label: 'Inter', vibe: 'Clean & neutral', heading: 'Inter', body: 'Inter', families: ['Inter:wght@400;500;600;700;800'] },
  poppins: { label: 'Poppins', vibe: 'Round & bubbly', heading: 'Poppins', body: 'Poppins', families: ['Poppins:wght@400;500;600;700;800'] },
  grotesk: { label: 'Space Grotesk', vibe: 'Techy', heading: 'Space Grotesk', body: 'Space Grotesk', families: ['Space Grotesk:wght@400;500;600;700'] },
  outfit: { label: 'Outfit', vibe: 'Geometric', heading: 'Outfit', body: 'Outfit', families: ['Outfit:wght@400;500;600;700;800'] },
  playfair: { label: 'Playfair', vibe: 'Elegant serif', heading: 'Playfair Display', body: 'Inter', families: ['Playfair Display:wght@500;600;700;800', 'Inter:wght@400;500;600;700'] },
  dmserif: { label: 'DM Serif', vibe: 'Editorial', heading: 'DM Serif Display', body: 'DM Sans', families: ['DM Serif Display', 'DM Sans:wght@400;500;600;700'] },
  cormorant: { label: 'Cormorant', vibe: 'Luxury', heading: 'Cormorant Garamond', body: 'Montserrat', families: ['Cormorant Garamond:wght@500;600;700', 'Montserrat:wght@400;500;600;700'] },
  fraunces: { label: 'Fraunces', vibe: 'Warm & crafted', heading: 'Fraunces', body: 'Nunito Sans', families: ['Fraunces:wght@500;600;700;800', 'Nunito Sans:wght@400;600;700;800'] },
  syne: { label: 'Syne', vibe: 'Avant-garde', heading: 'Syne', body: 'Inter', families: ['Syne:wght@500;600;700;800', 'Inter:wght@400;500;600;700'] },
  unbounded: { label: 'Unbounded', vibe: 'Futuristic', heading: 'Unbounded', body: 'Manrope', families: ['Unbounded:wght@500;600;700;800', 'Manrope:wght@400;500;600;700;800'] },
  fredoka: { label: 'Fredoka', vibe: 'Playful', heading: 'Fredoka', body: 'Nunito', families: ['Fredoka:wght@500;600;700', 'Nunito:wght@400;600;700;800'] },
  bricolage: { label: 'Bricolage', vibe: 'Quirky bold', heading: 'Bricolage Grotesque', body: 'Inter', families: ['Bricolage Grotesque:wght@500;600;700;800', 'Inter:wght@400;500;600;700'] },
};

export const TEMPLATES = [
  { id: 'modern', name: 'Modern', text: 'Image hero, brand glow, rounded cards' },
  { id: 'bold', name: 'Bold', text: 'Huge uppercase type, high contrast' },
  { id: 'minimal', name: 'Minimal', text: 'Airy, quiet, product-first' },
  { id: 'luxe', name: 'Luxe', text: 'Thin serif type, wide spacing, gold lines' },
  { id: 'playful', name: 'Playful', text: 'Wobbly shapes, stickers, bouncy hovers' },
  { id: 'neon', name: 'Neon', text: 'Glowing edges, glass, cyber vibes' },
  { id: 'editorial', name: 'Editorial', text: 'Magazine grid, rules and big serifs' },
  { id: 'organic', name: 'Organic', text: 'Soft blobs, earthy, handcrafted feel' },
];

export const OPTIONS = {
  mode: [['light', 'Light'], ['tinted', 'Tinted'], ['dark', 'Dark']],
  radius: [['sharp', 'Sharp'], ['soft', 'Soft'], ['round', 'Round'], ['pill', 'Pill']],
  buttonStyle: [['solid', 'Solid'], ['gradient', 'Gradient'], ['outline', 'Outline'], ['soft', 'Soft'], ['glass', 'Glass'], ['brutal', 'Brutal']],
  cardStyle: [['clean', 'Clean'], ['bordered', 'Bordered'], ['shadow', 'Floating'], ['glass', 'Glass'], ['polaroid', 'Polaroid'], ['overlay', 'Overlay']],
  heroLayout: [['image', 'Full image'], ['split', 'Split'], ['centered', 'Centered'], ['gradient', 'Gradient mesh'], ['slider', 'Slideshow'], ['3d', '3D showcase']],
  heroHeight: [['compact', 'Compact'], ['standard', 'Standard'], ['tall', 'Tall']],
  navStyle: [['left', 'Logo left'], ['center', 'Logo center']],
  imageRatio: [['square', 'Square'], ['portrait', 'Portrait'], ['landscape', 'Landscape']],
  animation: [['none', 'Off'], ['subtle', 'Subtle'], ['lively', 'Lively']],
  pattern: [['none', 'None'], ['dots', 'Dots'], ['grid', 'Grid'], ['waves', 'Waves'], ['noise', 'Grain']],
};

export const SECTIONS = {
  hero: { label: 'Hero banner', icon: '🖼️', text: 'Headline, banner image and main button' },
  marquee: { label: 'Scrolling ticker', icon: '📣', text: 'Moving strip of short messages' },
  perks: { label: 'Store perks', icon: '🚚', text: 'Delivery, secure checkout, payments' },
  categories: { label: 'Shop by category', icon: '🗂️', text: 'Tiles built from your product categories' },
  featured: { label: 'Trending carousel', icon: '🔥', text: 'Swipeable row of your best deals' },
  products: { label: 'All products', icon: '🛍️', text: 'Search, filters and product grid (always on)', locked: true },
  promo: { label: 'Sale banner', icon: '🏷️', text: 'Highlights your biggest real discount' },
  testimonials: { label: 'Testimonials', icon: '💬', text: 'Quotes from your customers' },
  about: { label: 'Our story', icon: '📖', text: 'Your brand story with an image' },
  newsletter: { label: 'Newsletter', icon: '✉️', text: 'Collect real email sign-ups' },
};
export const SECTION_ORDER = ['hero', 'marquee', 'perks', 'categories', 'featured', 'products', 'promo', 'testimonials', 'about', 'newsletter'];
const DEFAULT_ON = new Set(['hero', 'perks', 'categories', 'featured', 'products', 'testimonials', 'newsletter']);

export const BANNERS = [
  '1441986300917-64674bd600d8', '1483985988355-763728e1935b', '1472851294608-062f824d29cc', '1555529669-e69e7aa0ba9a',
  '1556228453-efd6c1ff04f6', '1586023492125-27b2c045efd7', '1490481651871-ab68de25d43d', '1607082348824-0a96f2a4b9da',
  '1505740420928-5e560c06d30e', '1542838132-92c53300491e', '1511556532299-8f662fc26c06', '1515886657613-9f3515b0c78f',
].map((id) => u(id));

export const PALETTES = [
  ['Indigo', '#4f46e5', '#eef2ff', '#f97316'], ['Midnight', '#0f172a', '#f1f5f9', '#22d3ee'], ['Rose', '#db2777', '#fdf2f8', '#f59e0b'],
  ['Forest', '#15803d', '#f0fdf4', '#eab308'], ['Ocean', '#0369a1', '#f0f9ff', '#f43f5e'], ['Sunset', '#ea580c', '#fff7ed', '#7c3aed'],
  ['Gold', '#a16207', '#fefce8', '#1c1917'], ['Lime', '#65a30d', '#f7fee7', '#0ea5e9'], ['Grape', '#7c3aed', '#f5f3ff', '#10b981'],
  ['Cherry', '#be123c', '#fff1f2', '#0f172a'], ['Teal', '#0f766e', '#f0fdfa', '#f97316'], ['Coffee', '#78350f', '#fdf8f3', '#65a30d'],
];

// Full looks: one click sets template + colors + type + shapes + layout
export const PRESETS = [
  { id: 'aurora', name: 'Aurora', tag: 'Most popular', template: 'modern', colors: ['#4f46e5', '#eef2ff', '#f97316'], theme: { mode: 'light', font: 'jakarta', radius: 'round', buttonStyle: 'gradient', cardStyle: 'shadow', heroLayout: 'image', pattern: 'none', navStyle: 'left' } },
  { id: 'noir', name: 'Noir Luxe', tag: 'Luxury', template: 'luxe', colors: ['#c9a227', '#1a1712', '#e7d9a8'], theme: { mode: 'dark', font: 'cormorant', radius: 'sharp', buttonStyle: 'outline', cardStyle: 'clean', heroLayout: 'centered', pattern: 'noise', navStyle: 'center' } },
  { id: 'bloom', name: 'Bloom', tag: 'Beauty', template: 'playful', colors: ['#ec4899', '#fdf2f8', '#8b5cf6'], theme: { mode: 'tinted', font: 'fredoka', radius: 'pill', buttonStyle: 'solid', cardStyle: 'polaroid', heroLayout: 'split', pattern: 'dots', navStyle: 'left' } },
  { id: 'cyber', name: 'Cyber Neon', tag: 'Gaming & tech', template: 'neon', colors: ['#22d3ee', '#0b1020', '#a3e635'], theme: { mode: 'dark', font: 'unbounded', radius: 'soft', buttonStyle: 'glass', cardStyle: 'glass', heroLayout: '3d', pattern: 'grid', navStyle: 'left' } },
  { id: 'paper', name: 'Paper', tag: 'Editorial', template: 'editorial', colors: ['#111827', '#f5f1ea', '#dc2626'], theme: { mode: 'tinted', font: 'dmserif', radius: 'sharp', buttonStyle: 'solid', cardStyle: 'bordered', heroLayout: 'split', pattern: 'none', navStyle: 'center' } },
  { id: 'terra', name: 'Terra', tag: 'Handmade', template: 'organic', colors: ['#7c5c3b', '#f5efe6', '#6b8e23'], theme: { mode: 'tinted', font: 'fraunces', radius: 'round', buttonStyle: 'soft', cardStyle: 'clean', heroLayout: 'image', pattern: 'waves', navStyle: 'left' } },
  { id: 'breeze', name: 'Breeze', tag: 'Fresh', template: 'modern', colors: ['#0369a1', '#f0f9ff', '#f43f5e'], theme: { mode: 'light', font: 'outfit', radius: 'soft', buttonStyle: 'solid', cardStyle: 'shadow', heroLayout: 'gradient', pattern: 'none', navStyle: 'left' } },
  { id: 'midnight', name: 'Midnight', tag: 'Electronics', template: 'bold', colors: ['#6366f1', '#0f0f1a', '#22d3ee'], theme: { mode: 'dark', font: 'grotesk', radius: 'soft', buttonStyle: 'gradient', cardStyle: 'glass', heroLayout: '3d', pattern: 'dots', navStyle: 'left' } },
  { id: 'citrus', name: 'Citrus Pop', tag: 'Food & fun', template: 'playful', colors: ['#f97316', '#fff7ed', '#16a34a'], theme: { mode: 'light', font: 'poppins', radius: 'pill', buttonStyle: 'brutal', cardStyle: 'bordered', heroLayout: 'centered', pattern: 'dots', navStyle: 'center' } },
  { id: 'mono', name: 'Mono', tag: 'Minimal', template: 'minimal', colors: ['#18181b', '#fafafa', '#18181b'], theme: { mode: 'light', font: 'inter', radius: 'sharp', buttonStyle: 'outline', cardStyle: 'clean', heroLayout: 'split', pattern: 'none', navStyle: 'center' } },
  { id: 'forest', name: 'Forest', tag: 'Wellness', template: 'organic', colors: ['#166534', '#f0fdf4', '#ca8a04'], theme: { mode: 'tinted', font: 'bricolage', radius: 'round', buttonStyle: 'solid', cardStyle: 'shadow', heroLayout: 'slider', pattern: 'none', navStyle: 'left' } },
  { id: 'velvet', name: 'Royal Velvet', tag: 'Premium', template: 'luxe', colors: ['#7c3aed', '#140b24', '#fbbf24'], theme: { mode: 'dark', font: 'playfair', radius: 'soft', buttonStyle: 'gradient', cardStyle: 'overlay', heroLayout: 'slider', pattern: 'noise', navStyle: 'center' } },
  { id: 'street', name: 'Streetwear', tag: 'Fashion', template: 'bold', colors: ['#e11d48', '#fafafa', '#111827'], theme: { mode: 'light', font: 'syne', radius: 'sharp', buttonStyle: 'brutal', cardStyle: 'overlay', heroLayout: 'centered', pattern: 'grid', navStyle: 'left' } },
  { id: 'lagoon', name: 'Lagoon', tag: 'Travel & outdoor', template: 'modern', colors: ['#0f766e', '#f0fdfa', '#f59e0b'], theme: { mode: 'light', font: 'outfit', radius: 'round', buttonStyle: 'soft', cardStyle: 'polaroid', heroLayout: 'slider', pattern: 'waves', navStyle: 'left' } },
];

const CATEGORY_COPY = {
  Fashion: ['New season, new you', 'Statement pieces and everyday essentials, curated for how you really live.'],
  Electronics: ['Tech that just works', 'The latest gadgets, honest prices and fast delivery to your door.'],
  Beauty: ['Glow, naturally', 'Clean beauty and self-care rituals made with ingredients you can trust.'],
  'Food & Grocery': ['Fresh from the source', 'Farm-fresh produce and pantry staples delivered the same day.'],
  'Home & Living': ['Make home yours', 'Thoughtful furniture and décor for spaces that feel like you.'],
  Books: ['Stories worth keeping', 'Hand-picked reads, timeless classics and tomorrow’s favourites.'],
  Sports: ['Built to move', 'Performance gear for every goal, from first steps to finish lines.'],
};

export function defaultContent(store = {}) {
  const [title, sub] = CATEGORY_COPY[store.category] || ['Discover our collection', 'Handpicked products, fair prices and fast delivery.'];
  const name = store.businessName || 'our store';
  return {
    heroTitle: '',
    heroSubtitle: '',
    ctaText: 'Shop the collection',
    announcement: '✨ Free shipping on every order · Easy 7-day returns',
    marquee: 'New arrivals every week • Free shipping • Secure checkout • Loved by thousands',
    promoTitle: 'The sale is on',
    promoText: 'Limited-time prices on some of our best sellers — while stocks last.',
    aboutTitle: `The story of ${name}`,
    aboutText: store.description || `${name} started with a simple idea: great products should be easy to find and a joy to own. Every item is picked by hand, checked for quality and shipped with care.`,
    newsletterTitle: 'Get 10% off your first order',
    testimonials: [
      { name: 'Riya S.', text: 'Absolutely love what I ordered — great quality and it arrived a day early!', rating: 5 },
      { name: 'Arjun M.', text: 'Smooth checkout and lovely packaging. Already planning my next order.', rating: 5 },
      { name: 'Sneha G.', text: 'Customer support was super helpful. Highly recommend this store.', rating: 4 },
    ],
    _fallbackTitle: title,
    _fallbackSub: sub,
  };
}

export const DEFAULT_THEME = {
  preset: 'aurora', mode: 'light', font: 'jakarta', radius: 'soft', buttonStyle: 'solid', cardStyle: 'clean',
  heroLayout: 'image', heroHeight: 'standard', navStyle: 'left', imageRatio: 'square', animation: 'subtle', pattern: 'none',
  gridColumns: 4, mobileColumns: 2, showAnnouncement: false, stickyNav: true,
};

const pick = (v, list, d) => (list.some(([k]) => k === v) ? v : d);

/** Merge whatever the store has saved with defaults, so old stores and unknown values always render. */
export function resolveTheme(store = {}) {
  const t = { ...DEFAULT_THEME, ...(store.theme || {}) };
  for (const k of Object.keys(OPTIONS)) t[k] = pick(t[k], OPTIONS[k], DEFAULT_THEME[k]);
  if (!FONTS[t.font]) t.font = DEFAULT_THEME.font;
  t.gridColumns = Math.min(5, Math.max(2, Number(t.gridColumns) || 4));
  t.mobileColumns = Number(t.mobileColumns) === 1 ? 1 : 2;

  const saved = Array.isArray(store.theme?.sections) ? store.theme.sections.filter((s) => SECTIONS[s?.key]) : [];
  const seen = new Set(saved.map((s) => s.key));
  t.sections = [...saved.map((s) => ({ key: s.key, on: s.key === 'products' ? true : !!s.on })), ...SECTION_ORDER.filter((k) => !seen.has(k)).map((key) => ({ key, on: !saved.length && DEFAULT_ON.has(key) }))];

  const defaults = defaultContent(store);
  const c = store.theme?.content || {};
  t.content = { ...defaults };
  for (const [k, v] of Object.entries(c)) if (v !== undefined && v !== null && (typeof v !== 'string' || v.trim() !== '' || k === 'heroTitle' || k === 'heroSubtitle')) t.content[k] = v;
  if (!Array.isArray(t.content.testimonials) || !t.content.testimonials.length) t.content.testimonials = defaults.testimonials;
  t.template = TEMPLATES.some((x) => x.id === store.template) ? store.template : 'modern';
  return t;
}

export function applyPreset(form, preset) {
  const [p, s, a] = preset.colors;
  return {
    ...form,
    template: preset.template,
    branding: { ...form.branding, primaryColor: p, secondaryColor: s, accentColor: a },
    theme: { ...form.theme, ...preset.theme, preset: preset.id },
  };
}

/* ---------------- color helpers ---------------- */
export const hexToRgbArr = (hex) => {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const m = /^([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [79, 70, 229];
};
const lum = (hex) => {
  const [r, g, b] = hexToRgbArr(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const isLight = (hex) => lum(hex) > 0.45;
const mix = (a, b, t) => {
  const A = hexToRgbArr(a);
  const B = hexToRgbArr(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
};

const RADIUS = { sharp: ['0px', '0px', '0px'], soft: ['14px', '12px', '10px'], round: ['24px', '16px', '14px'], pill: ['28px', '999px', '18px'] };
const HERO_H = { compact: '380px', standard: '540px', tall: '720px' };
const RATIO = { square: '1 / 1', portrait: '4 / 5', landscape: '4 / 3' };

/** All CSS custom properties for one store. Used by the live storefront and every studio preview. */
export function storeThemeVars(store = {}) {
  const t = resolveTheme(store);
  const b = store.branding || {};
  const primary = /^#[\da-f]{6}$/i.test(b.primaryColor || '') ? b.primaryColor : '#4f46e5';
  const secondary = /^#[\da-f]{6}$/i.test(b.secondaryColor || '') ? b.secondaryColor : '#f5f3ff';
  const accent = /^#[\da-f]{6}$/i.test(b.accentColor || '') ? b.accentColor : '#f97316';
  const font = FONTS[t.font];

  let bg = '#ffffff';
  let surface = '#ffffff';
  let surface2 = '#f8fafc';
  let text = '#0f172a';
  let muted = '#64748b';
  let line = '#e9edf3';
  let soft = isLight(secondary) ? secondary : mix(primary, '#ffffff', 0.9);
  if (t.mode === 'tinted') {
    bg = isLight(secondary) ? secondary : mix(primary, '#ffffff', 0.93);
    surface = mix(bg, '#ffffff', 0.6);
    surface2 = mix(bg, primary, 0.05);
    line = mix(bg, '#0f172a', 0.1);
    soft = mix(bg, primary, 0.1);
  } else if (t.mode === 'dark') {
    bg = isLight(secondary) ? mix('#0b0b12', primary, 0.08) : secondary;
    surface = mix(bg, '#ffffff', 0.05);
    surface2 = mix(bg, '#ffffff', 0.09);
    text = '#f4f4f7';
    muted = '#a1a1b5';
    line = mix(bg, '#ffffff', 0.12);
    soft = mix(bg, primary, 0.2);
  }
  // keep the brand color readable on the chosen background (e.g. black primary in dark mode)
  const ink = t.mode === 'dark' && lum(primary) < 0.06 ? mix(primary, '#ffffff', 0.75) : primary;
  const [r1, r2, r3] = RADIUS[t.radius];
  return {
    '--s-primary': primary,
    '--s-primary-rgb': hexToRgbArr(primary).join(', '),
    '--s-ink': ink,
    '--s-on-primary': isLight(primary) ? '#111827' : '#ffffff',
    '--s-accent': accent,
    '--s-accent-rgb': hexToRgbArr(accent).join(', '),
    '--s-on-accent': isLight(accent) ? '#111827' : '#ffffff',
    '--s-soft': soft,
    '--s-bg': bg,
    '--s-surface': surface,
    '--s-surface-2': surface2,
    '--s-text': text,
    '--s-text-rgb': hexToRgbArr(text).join(', '),
    '--s-muted': muted,
    '--s-line': line,
    '--s-font-head': `'${font.heading}', system-ui, sans-serif`,
    '--s-font-body': `'${font.body}', system-ui, sans-serif`,
    '--s-radius': r1,
    '--s-radius-btn': r2,
    '--s-radius-sm': r3,
    '--s-hero-h': HERO_H[t.heroHeight],
    '--s-cols': String(t.gridColumns),
    '--s-mcols': String(t.mobileColumns),
    '--s-ratio': RATIO[t.imageRatio],
  };
}

/** data-* attributes that switch template/variant CSS on the .sf root */
export function storeThemeAttrs(store = {}) {
  const t = resolveTheme(store);
  return {
    'data-template': t.template,
    'data-mode': t.mode,
    'data-btn': t.buttonStyle,
    'data-card': t.cardStyle,
    'data-hero': t.heroLayout,
    'data-nav': t.navStyle,
    'data-anim': t.animation,
    'data-pattern': t.pattern,
    'data-radius': t.radius,
  };
}

export const googleFontsHref = (keys) => {
  const fam = [...new Set(keys.flatMap((k) => FONTS[k]?.families || []))];
  return fam.length ? `https://fonts.googleapis.com/css2?${fam.map((f) => `family=${f.replace(/ /g, '+')}`).join('&')}&display=swap` : '';
};

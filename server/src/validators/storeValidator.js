// Owner: M2 -- whitelists + caps the store design fields (template, theme, social) before they reach Mongo.
// Unknown option values are passed through as short strings; the client falls back to defaults for anything it doesn't know.

const str = (v, max = 60) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : undefined;
};
const bool = (v) => (typeof v === 'boolean' ? v : undefined);

const THEME_STRINGS = ['preset', 'mode', 'font', 'radius', 'buttonStyle', 'cardStyle', 'heroLayout', 'heroHeight', 'navStyle', 'imageRatio', 'animation', 'pattern'];
const CONTENT_LIMITS = {
  heroTitle: 120, heroSubtitle: 300, ctaText: 40, announcement: 160, marquee: 200,
  promoTitle: 100, promoText: 240, aboutTitle: 100, aboutText: 1200, newsletterTitle: 100,
};
const SECTION_KEYS = ['hero', 'marquee', 'perks', 'categories', 'featured', 'products', 'promo', 'testimonials', 'about', 'newsletter'];
const SOCIAL_KEYS = ['instagram', 'facebook', 'twitter', 'youtube', 'whatsapp'];

const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export function sanitizeTheme(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const theme = {};
  for (const k of THEME_STRINGS) theme[k] = str(input[k], 30);
  theme.gridColumns = num(input.gridColumns, 2, 5);
  theme.mobileColumns = num(input.mobileColumns, 1, 2);
  theme.showAnnouncement = bool(input.showAnnouncement);
  theme.stickyNav = bool(input.stickyNav);

  if (Array.isArray(input.sections)) {
    const seen = new Set();
    theme.sections = input.sections
      .filter((s) => s && SECTION_KEYS.includes(s.key) && !seen.has(s.key) && seen.add(s.key))
      .map((s) => ({ key: s.key, on: s.key === 'products' ? true : Boolean(s.on) }));
  }

  if (input.content && typeof input.content === 'object') {
    const content = {};
    for (const [k, max] of Object.entries(CONTENT_LIMITS)) content[k] = str(input.content[k], max);
    if (Array.isArray(input.content.testimonials)) {
      content.testimonials = input.content.testimonials.slice(0, 6).map((t) => ({
        name: str(t?.name, 60) || 'Happy customer',
        text: str(t?.text, 400) || '',
        rating: num(t?.rating, 1, 5) || 5,
      }));
    }
    theme.content = clean(content);
  }
  return clean(theme);
}

export function sanitizeSocial(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  return clean(Object.fromEntries(SOCIAL_KEYS.map((k) => [k, str(input[k], 200)])));
}

export const isEmail = (v) => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

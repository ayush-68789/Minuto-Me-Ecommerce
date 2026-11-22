// Owner: Member 5 -- the editable "draft" the onboarding wizard and the studio work on.
// It has the same shape as a store from the API, so previews can render it directly.
import { BANNERS, DEFAULT_THEME, PRESETS, applyPreset, resolveTheme } from '../../theme/themeConfig';

export const CATEGORIES = ['Fashion', 'Electronics', 'Beauty', 'Food & Grocery', 'Home & Living', 'Books', 'Sports', 'General'];

export const CURRENCIES = [
  ['INR', '₹ Indian Rupee'],
  ['USD', '$ US Dollar'],
  ['EUR', '€ Euro'],
  ['GBP', '£ British Pound'],
  ['CAD', '$ Canadian Dollar'],
  ['AUD', '$ Australian Dollar'],
];

export const slugify = (text = '') =>
  String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

export function emptyDraft(user) {
  const base = {
    businessName: '',
    slug: '',
    description: '',
    category: 'Fashion',
    currency: 'INR',
    template: 'modern',
    branding: { logo: '', primaryColor: '#4f46e5', secondaryColor: '#eef2ff', accentColor: '#f97316', banners: [BANNERS[0]] },
    theme: { ...DEFAULT_THEME },
    contact: { email: user?.email || '', phone: '', address: '' },
    social: { instagram: '', facebook: '', twitter: '', youtube: '', whatsapp: '' },
    features: { wishlist: true, reviews: true, payments: false },
  };
  return applyPreset(base, PRESETS[0]);
}

/** Store from the API -> editable draft (fills gaps for stores created before the studio existed) */
export function draftFromStore(store) {
  const fresh = emptyDraft();
  const t = resolveTheme(store);
  return {
    _id: store._id,
    businessName: store.businessName || store.name || '',
    slug: store.slug || '',
    description: store.description || '',
    category: store.category || 'General',
    currency: store.currency || 'INR',
    template: t.template,
    branding: {
      ...fresh.branding,
      ...(store.branding || {}),
      logo: store.branding?.logo || store.logo || '',
      banners: store.branding?.banners?.length ? store.branding.banners : store.banner ? [store.banner] : fresh.branding.banners,
    },
    theme: { ...(store.theme || {}), preset: store.theme?.preset || '', sections: t.sections, content: { ...(store.theme?.content || {}) } },
    contact: {
      email: store.contact?.email || store.settings?.contactEmail || '',
      phone: store.contact?.phone || store.settings?.contactPhone || '',
      address: store.contact?.address || store.settings?.address || '',
    },
    social: { ...fresh.social, ...(store.social || {}) },
    features: { ...fresh.features, ...(store.features || {}) },
    createdAt: store.createdAt,
  };
}

/** Draft -> request body for POST/PUT /api/stores */
export function draftToPayload(draft) {
  const theme = { ...draft.theme };
  // keep only content the merchant actually typed; defaults are computed on render
  theme.content = Object.fromEntries(Object.entries(theme.content || {}).filter(([k, v]) => !k.startsWith('_') && v !== '' && v !== undefined));
  return {
    name: draft.businessName.trim(),
    businessName: draft.businessName.trim(),
    slug: draft.slug,
    description: draft.description.trim(),
    category: draft.category,
    currency: draft.currency,
    template: draft.template,
    branding: { ...draft.branding, banners: draft.branding.banners.filter(Boolean) },
    theme,
    contact: draft.contact,
    social: draft.social,
    features: draft.features,
    settings: {
      contactEmail: draft.contact.email,
      contactPhone: draft.contact.phone,
      address: draft.contact.address,
      theme: draft.template,
    },
  };
}

/** Immutable set by dotted path: setIn(draft, 'branding.primaryColor', '#000') */
export function setIn(obj, path, value) {
  const [head, ...rest] = path.split('.');
  return { ...obj, [head]: rest.length ? setIn(obj?.[head] || {}, rest.join('.'), value) : value };
}

export const getIn = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

/** Any manual design change means the draft no longer matches a preset exactly */
export const clearPreset = (draft) => setIn(draft, 'theme.preset', '');

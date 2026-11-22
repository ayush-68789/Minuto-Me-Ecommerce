// Demo mode: an in-browser fake of the Express API so the UI can be shared (e.g. on Vercel)
// without a backend. Enabled only when VITE_DEMO=true. Data lives in this viewer's localStorage.
import axios, { AxiosError } from 'axios';
import { seed } from './seedData';

const KEY = 'minuto_demo_db_v3'; // v3: stores carry theme/social/subscribers

const oid = () =>
  Array.from({ length: 24 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const legacyDemoUser = saved.users?.find((u) => u.email === 'demo@minuto.me');
      const legacyDemoStoreIds = new Set((saved.stores || []).filter((s) => s.slug === 'demo').map((s) => s._id));
      if (legacyDemoUser || legacyDemoStoreIds.size) {
        if (legacyDemoUser) {
          saved.users = saved.users.filter((u) => u !== legacyDemoUser);
          if (saved.session === legacyDemoUser._id) saved.session = null;
        }
        saved.stores = (saved.stores || []).filter((s) => !legacyDemoStoreIds.has(s._id));
        saved.products = (saved.products || []).filter((p) => !legacyDemoStoreIds.has(p.store));
        saved.orders = (saved.orders || []).filter((o) => !legacyDemoStoreIds.has(o.store));
        localStorage.setItem(KEY, JSON.stringify(saved));
      }
      return saved;
    }
  } catch {
    /* fall through to a fresh seed */
  }
  return seed();
}
let db = load();
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full / blocked: keep working in memory */
  }
};

const now = () => new Date().toISOString();
const me = () => db.users.find((u) => u._id === db.session) || null;
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, store: u.store });
let activeRequestStoreId = null;
const myStore = () => {
  const u = me();
  if (!u) return null;
  const owned = db.stores.filter((s) => s.owner === u._id);
  return (activeRequestStoreId && owned.find((s) => s._id === activeRequestStoreId)) || owned.find((s) => s._id === u.store) || owned[0] || null;
};
const storeSummary = (s) => ({ id: s._id, name: s.businessName, slug: s.slug, currency: s.currency });
// mirrors server/src/validators/storeValidator.js: theme/social are merged, never replaced wholesale
const mergeDesign = (s, b) => {
  if (b.theme && typeof b.theme === 'object') {
    const { content, ...rest } = b.theme;
    s.theme = { ...(s.theme || {}), ...rest, content: { ...(s.theme?.content || {}), ...(content || {}) } };
  }
  if (b.social && typeof b.social === 'object') s.social = { ...(s.social || {}), ...b.social };
};
const slugify = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
const need = (cond, status, message) => {
  if (!cond) throw new HttpError(status, message);
};
const requireUser = () => {
  const u = me();
  need(u, 401, 'Authentication required');
  return u;
};
const requireStore = () => {
  requireUser();
  const s = myStore();
  need(s, 404, 'No store found for this account');
  return s;
};

function priceCart(store, items) {
  const qty = new Map();
  for (const { productId, quantity } of items) qty.set(productId, (qty.get(productId) || 0) + Number(quantity));
  const lines = [];
  const issues = [];
  for (const [productId, quantity] of qty) {
    const p = db.products.find((x) => x._id === productId && x.store === store._id);
    if (!p || !p.isActive) {
      issues.push({ productId, message: 'This product is no longer available' });
      continue;
    }
    if (p.stock < quantity) {
      issues.push({ productId, message: `Only ${p.stock} left in stock`, available: p.stock });
      continue;
    }
    lines.push({ product: p._id, name: p.name, image: p.images[0] || '', price: p.price, quantity });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  return { lines, issues, subtotal, shippingFee: 0, total: subtotal };
}

const activeStoreBySlug = (slug) => {
  const s = db.stores.find((x) => x.slug === String(slug).toLowerCase() && x.status === 'active');
  need(s, 404, 'Store not found');
  return s;
};

const TRANSITIONS = { pending: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };

// [method, pattern, handler(params, body, query)]
const routes = [
  ['get', '/health', () => ({ success: true, demo: true })],

  // ---- auth
  ['post', '/auth/signup', (_, b) => {
    const email = String(b.email || '').trim().toLowerCase();
    need(b.name && email && b.password, 400, 'Name, email, and password are required');
    need(String(b.password).length >= 8, 400, 'Password must be at least 8 characters');
    need(!db.users.some((u) => u.email === email), 409, 'An account with this email already exists');
    const user = { _id: oid(), name: String(b.name).trim(), email, password: b.password, role: 'client', store: null };
    db.users.push(user);
    db.session = user._id;
    return [201, { user: publicUser(user) }];
  }],
  ['post', '/auth/login', (_, b) => {
    const email = String(b.email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email === email);
    need(user && user.password === b.password, 401, 'Invalid email or password');
    db.session = user._id;
    return { user: publicUser(user) };
  }],
  ['post', '/auth/logout', () => {
    db.session = null;
    return { message: 'Logged out', success: true };
  }],
  ['get', '/auth/me', () => ({ user: publicUser(requireUser()) })],

  // ---- stores (onboarding)
  ['get', '/stores', () => ({ stores: db.stores.filter((s) => s.owner === requireUser()._id) })],
  ['post', '/stores', (_, b) => {
    const u = requireUser();
    const slug = slugify(b.slug || b.businessName);
    need(b.businessName && b.category && slug, 400, 'Business name and category are required');
    need(!db.stores.some((s) => s.slug === slug), 409, 'This store URL is already in use');
    const base = {
      branding: { logo: '', primaryColor: '#4f46e5', secondaryColor: '#eef2ff', accentColor: '#f97316', banners: [] },
      features: { reviews: true, wishlist: true, coupons: false },
    };
    const store = {
      ...base,
      _id: oid(),
      owner: u._id,
      businessName: b.businessName,
      slug,
      category: b.category,
      description: b.description || '',
      currency: b.currency || 'INR',
      template: b.template || 'modern',
      branding: { ...base.branding, logo: '', banners: [], ...(b.branding || {}) },
      contact: { email: '', phone: '', address: '', ...(b.contact || {}) },
      features: { ...base.features, ...(b.features || {}) },
      theme: {},
      social: {},
      subscribers: [],
      status: b.status || 'active',
      createdAt: now(),
      updatedAt: now(),
    };
    mergeDesign(store, b);
    db.stores.push(store);
    if (!u.store) u.store = store._id;
    return [201, { store }];
  }],
  ['get', '/stores/me', () => ({ store: requireStore() })],
  ['patch', '/stores/me', (_, b) => {
    const s = requireStore();
    const { theme, social, ...rest } = b;
    Object.assign(s, rest, { branding: { ...s.branding, ...(b.branding || {}) }, features: { ...s.features, ...(b.features || {}) }, updatedAt: now() });
    mergeDesign(s, b);
    return { store: s };
  }],

  // ---- dashboard
  ['get', '/dashboard/stats', () => {
    const s = requireStore();
    const products = db.products.filter((p) => p.store === s._id);
    const orders = db.orders.filter((o) => o.store === s._id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      success: true,
      store: { id: s._id, businessName: s.businessName, slug: s.slug, category: s.category, description: s.description, branding: s.branding, currency: s.currency, contact: s.contact, features: s.features, status: s.status },
      stats: {
        totalProducts: products.length,
        activeProducts: products.filter((p) => p.isActive).length,
        inactiveProducts: products.filter((p) => !p.isActive).length,
        lowStockProducts: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
        outOfStockProducts: products.filter((p) => p.stock === 0).length,
        totalOrders: orders.length,
        totalRevenue: orders.filter((o) => o.status !== 'cancelled').reduce((n, o) => n + o.total, 0),
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
        categoryCount: new Set(products.map((p) => p.category)).size,
      },
      recentProducts: [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      recentOrders: orders.slice(0, 5),
    };
  }],
  ['get', '/dashboard/store', () => { const s = requireStore(); return { success: true, store: s, subscriberCount: (s.subscribers || []).length }; }],
  ['put', '/dashboard/store', (_, b) => {
    const s = requireStore();
    for (const k of ['businessName', 'category', 'description', 'currency', 'status', 'template']) if (b[k] !== undefined) s[k] = b[k];
    for (const k of ['branding', 'contact', 'features']) if (b[k]) s[k] = { ...s[k], ...b[k] };
    mergeDesign(s, b);
    s.updatedAt = now();
    return { success: true, message: 'Store settings updated successfully', store: s };
  }],

  // ---- products (owner)
  ['get', '/products', (_, __, q) => {
    const s = requireStore();
    let list = db.products.filter((p) => p.store === s._id);
    const categories = [...new Set(list.map((p) => p.category))];
    if (q.search) {
      const t = String(q.search).toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(t) || p.description.toLowerCase().includes(t));
    }
    if (q.category && q.category !== 'All') list = list.filter((p) => p.category === q.category);
    if (q.status === 'active') list = list.filter((p) => p.isActive);
    if (q.status === 'inactive') list = list.filter((p) => !p.isActive);
    const sorters = {
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      stock_asc: (a, b) => a.stock - b.stock,
      stock_desc: (a, b) => b.stock - a.stock,
      name_asc: (a, b) => a.name.localeCompare(b.name),
    };
    list.sort(sorters[q.sort] || ((a, b) => b.createdAt.localeCompare(a.createdAt)));
    const limit = Math.max(1, Number(q.limit) || 50);
    const page = Math.max(1, Number(q.page) || 1);
    return { success: true, products: list.slice((page - 1) * limit, page * limit), total: list.length, page, totalPages: Math.ceil(list.length / limit) || 1, categories };
  }],
  ['post', '/products', (_, b) => {
    const s = requireStore();
    need(b.name && b.price !== undefined && b.price !== '', 400, 'Name and price are required');
    const product = {
      _id: oid(),
      store: s._id,
      name: b.name,
      description: b.description || '',
      price: Number(b.price),
      comparePrice: b.comparePrice ? Number(b.comparePrice) : undefined,
      images: (b.images || []).filter(Boolean),
      category: b.category || 'General',
      stock: Number(b.stock) || 0,
      isActive: b.isActive !== false,
      createdAt: now(),
      updatedAt: now(),
    };
    db.products.push(product);
    return [201, { success: true, message: 'Product created successfully', product }];
  }],
  ['get', '/products/:id', ({ id }) => {
    const s = requireStore();
    const product = db.products.find((p) => p._id === id && p.store === s._id);
    need(product, 404, 'Product not found');
    return { success: true, product };
  }],
  ['put', '/products/:id', ({ id }, b) => {
    const s = requireStore();
    const product = db.products.find((p) => p._id === id && p.store === s._id);
    need(product, 404, 'Product not found or not owned by this store');
    for (const k of ['name', 'description', 'category', 'images', 'isActive']) if (b[k] !== undefined) product[k] = b[k];
    for (const k of ['price', 'comparePrice', 'stock']) if (b[k] !== undefined && b[k] !== '') product[k] = Number(b[k]);
    product.updatedAt = now();
    return { success: true, message: 'Product updated successfully', product };
  }],
  ['delete', '/products/:id', ({ id }) => {
    const s = requireStore();
    const before = db.products.length;
    db.products = db.products.filter((p) => !(p._id === id && p.store === s._id));
    need(db.products.length < before, 404, 'Product not found or not owned by this store');
    return { success: true, message: 'Product deleted successfully', deletedId: id };
  }],
  ['patch', '/products/:id/toggle-status', ({ id }) => {
    const s = requireStore();
    const product = db.products.find((p) => p._id === id && p.store === s._id);
    need(product, 404, 'Product not found');
    product.isActive = !product.isActive;
    return { success: true, message: `Product marked as ${product.isActive ? 'active' : 'inactive'}`, product };
  }],

  // ---- public storefront
  ['get', '/storefront/:slug', ({ slug }) => {
    const s = activeStoreBySlug(slug);
    const { owner, subscribers, ...store } = s;
    return { store, products: db.products.filter((p) => p.store === s._id && p.isActive) };
  }],

  ['post', '/storefront/:slug/subscribe', ({ slug }, b) => {
    const s = activeStoreBySlug(slug);
    const email = String(b.email || '').trim().toLowerCase();
    need(/^[^s@]+@[^s@]+.[^s@]+$/.test(email), 400, 'Please enter a valid email address');
    s.subscribers = s.subscribers || [];
    if (s.subscribers.some((x) => x.email === email)) return { success: true, message: 'You are already subscribed' };
    s.subscribers.push({ email, createdAt: now() });
    return [201, { success: true, message: 'Subscribed' }];
  }],

  // ---- cart & orders
  ['post', '/orders/quote', (_, b) => {
    const s = activeStoreBySlug(b.storeSlug);
    const { lines, issues, subtotal, shippingFee, total } = priceCart(s, b.items || []);
    const quoteHash = `mock_quote_${oid().slice(0, 16)}`;
    return { store: storeSummary(s), items: lines, issues, subtotal, shippingFee, total, quoteHash };
  }],
  ['post', '/orders', (_, b) => {
    need(me(), 401, 'Please sign in to place your order');
    const s = activeStoreBySlug(b.storeSlug);
    const ci = b.customerInfo || {};
    const sa = b.shippingAddress || {};
    need(ci.name && ci.email && ci.phone, 400, 'customerInfo: name, email and phone are required');
    need(sa.line1 && sa.city && sa.state && sa.postalCode, 400, 'shippingAddress: please complete the address');
    const { lines, issues, subtotal, shippingFee, total } = priceCart(s, b.items || []);
    if (issues.length) throw new HttpError(409, 'Some items in your cart need attention', { issues });
    for (const l of lines) db.products.find((p) => p._id === l.product).stock -= l.quantity;
    const order = {
      _id: oid(),
      store: s._id,
      customer: me()?._id || null,
      customerInfo: { ...ci, email: String(ci.email).toLowerCase() },
      shippingAddress: { line2: '', country: 'India', ...sa },
      items: lines,
      subtotal,
      shippingFee,
      total,
      status: 'confirmed',
      createdAt: now(),
      updatedAt: now(),
    };
    db.orders.push(order);
    return [201, { order, store: storeSummary(s) }];
  }],
  ['get', '/orders/track/:id', ({ id }, _, q) => {
    const order = db.orders.find((o) => o._id === id);
    need(order, 404, 'Order not found');
    const { customerInfo, shippingAddress, ...publicOrder } = order;
    return { order: publicOrder, store: storeSummary(db.stores.find((s) => s._id === order.store)) };
  }],
  ['get', '/orders/my', (_, __, q) => {
    const u = requireUser();
    const s = q.storeSlug ? activeStoreBySlug(q.storeSlug) : null;
    return { orders: db.orders.filter((o) => o.customer === u._id && (!s || o.store === s._id)) };
  }],
  ['get', '/orders/store', (_, __, q) => {
    const s = requireStore();
    let orders = db.orders.filter((o) => o.store === s._id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (q.status) orders = orders.filter((o) => o.status === q.status);
    return { orders, total: orders.length, page: 1, pages: 1 };
  }],
  ['patch', '/orders/:id/status', ({ id }, b) => {
    const s = requireStore();
    const order = db.orders.find((o) => o._id === id && o.store === s._id);
    need(order, 404, 'Order not found');
    need(TRANSITIONS[order.status].includes(b.status), 400, `Cannot change status from ${order.status} to ${b.status}`);
    order.status = b.status;
    order.updatedAt = now();
    return { order };
  }],
];

const compiled = routes.map(([method, pattern, handler]) => {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)'))}/?$`);
  return { method, re, keys, handler };
});

async function demoAdapter(config) {
  const url = new URL((config.url || '').replace(/^https?:\/\/[^/]+/, ''), 'http://demo');
  const path = url.pathname.replace(/^\/api/, '');
  const query = { ...Object.fromEntries(url.searchParams), ...(config.params || {}) };
  let body = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const method = (config.method || 'get').toLowerCase();

  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180)); // feel like a network

  const response = (status, data) => ({ data, status, statusText: String(status), headers: {}, config, request: {} });
  const route = compiled.find((r) => r.method === method && r.re.test(path));
  try {
    need(route, 404, `Demo API: no handler for ${method.toUpperCase()} ${path}`);
    const m = path.match(route.re);
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    activeRequestStoreId = config.headers?.get?.('x-store-id') || config.headers?.['x-store-id'] || null;
    const out = route.handler(params, body || {}, query);
    activeRequestStoreId = null;
    save();
    const [status, data] = Array.isArray(out) ? out : [200, out];
    return response(status, data);
  } catch (err) {
    if (!(err instanceof HttpError)) throw err;
    const res = response(err.status, { message: err.message, success: false, ...err.extra });
    throw new AxiosError(err.message, err.status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, {}, res);
  }
}

export const DEMO = import.meta.env.VITE_DEMO === 'true';
export function resetDemo() {
  db = seed();
  save();
}

// Must run before any module calls axios.create(), so instances inherit the adapter.
if (DEMO) axios.defaults.adapter = demoAdapter;

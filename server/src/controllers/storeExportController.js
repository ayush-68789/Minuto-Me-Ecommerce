import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createZipArchive } from '../utils/zipArchive.js';
import { HttpError } from '../middleware/errorHandler.js';

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
const bundledBackendFiles = [
  'server.js', 'package.json', '.env.example',
  'src/app.js',
  'src/config/rateLimitConfig.js', 'src/config/redisClient.js',
  'src/controllers/adminController.js', 'src/controllers/authController.js', 'src/controllers/healthController.js', 'src/controllers/orderController.js',
  'src/middleware/authMiddleware.js', 'src/middleware/errorHandler.js', 'src/middleware/roleMiddleware.js', 'src/middleware/tenantContext.js', 'src/middleware/tokenBucketRateLimit.js', 'src/middleware/validateRequest.js',
  'src/models/Order.js', 'src/models/Session.js', 'src/models/User.js', 'src/models/healthModel.js',
  'src/routes/adminRoutes.js', 'src/routes/authRoutes.js', 'src/routes/healthRoutes.js', 'src/routes/orderRoutes.js',
];

function safeSlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,47}$/.test(slug)) throw new HttpError(400, 'invalid_store_slug', 'Store URL must be 2–48 letters, numbers or hyphens');
  return slug;
}

function normalizeStore(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'invalid_store', 'A store configuration is required');
  const slug = safeSlug(body.slug);
  const accent = /^#[0-9a-fA-F]{6}$/.test(body.accent) ? body.accent : '#516b54';
  const products = Array.isArray(body.products) ? body.products.slice(0, 100).map((product, index) => ({
    id: `product-${index + 1}`,
    name: String(product?.name || '').slice(0, 100),
    price: Math.max(0, Number(product?.price) || 0),
    description: String(product?.description || '').slice(0, 600),
    stock: Math.max(0, Math.floor(Number(product?.stock) || 0)),
    imageUrl: /^https?:\/\//i.test(String(product?.imageUrl || '')) ? String(product.imageUrl).slice(0, 1000) : '',
  })) : [];
  return {
    storeName: String(body.storeName || 'My Store').trim().slice(0, 100), slug,
    logoUrl: /^https?:\/\//i.test(String(body.logoUrl || '')) ? String(body.logoUrl).slice(0, 1000) : '',
    category: String(body.category || 'Other').slice(0, 40), contactEmail: String(body.contactEmail || '').slice(0, 254),
    headline: String(body.headline || '').slice(0, 180), description: String(body.description || '').slice(0, 1000),
    accent, style: String(body.style || 'Natural').slice(0, 30), plan: ['Free', 'Basic', 'Plus', 'Pro'].includes(body.plan) ? body.plan : 'Free',
    features: { auth: body.features?.auth !== false, orders: body.features?.orders !== false }, products,
    generatedAt: new Date().toISOString(), backendCapabilities: ['health', 'auth-and-roles', 'owner-scoped-orders', 'admin-read-routes', 'redis-token-bucket-rate-limiting'],
    knownLimitations: ['in-memory-storage', 'no-product-crud-or-inventory', 'no-payment-or-idempotency', 'no-full-tenant-data-isolation', 'plan-selection-is-metadata-only'],
  };
}

function generatedFrontendFiles(store, root) {
  const config = JSON.stringify(store, null, 2);
  return [
    { path: `${root}/frontend/package.json`, content: JSON.stringify({ name: store.slug, private: true, version: '0.1.0', type: 'module', scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build', preview: 'vite preview' }, dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' }, devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^5.4.11' } }, null, 2) },
    { path: `${root}/frontend/index.html`, content: `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${store.storeName.replace(/[<>]/g, '')}</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>` },
    { path: `${root}/frontend/vite.config.js`, content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()], server: { proxy: { '/api': 'http://localhost:5000' } } });\n` },
    { path: `${root}/frontend/src/store-config.json`, content: config },
    { path: `${root}/frontend/src/main.jsx`, content: `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport Storefront from './Storefront.jsx';\nimport './styles.css';\ncreateRoot(document.getElementById('root')).render(<React.StrictMode><Storefront /></React.StrictMode>);\n` },
    { path: `${root}/frontend/src/Storefront.jsx`, content: storefrontTemplate },
    { path: `${root}/frontend/src/styles.css`, content: `${storefrontStyles(store.accent)}${storefrontTheme(store.style)}` },
    { path: `${root}/frontend/.env.example`, content: `VITE_API_BASE_URL=\n` },
  ];
}

const storefrontTemplate = `import { useEffect, useState } from 'react';
import store from './store-config.json';
const apiBase = import.meta.env.VITE_API_BASE_URL || '';

export default function Storefront() {
  const [token, setToken] = useState(localStorage.getItem('store-token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('Checking backend…');
  const [message, setMessage] = useState('');
  async function api(path, options = {}) {
    const response = await fetch(apiBase + path, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...options.headers } });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'Request failed');
    return data;
  }
  useEffect(() => { api('/api/health').then(() => setStatus('Backend connected')).catch(() => setStatus('Backend unavailable')); }, []);
  async function signIn(event) {
    event.preventDefault(); setMessage('');
    try { const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('store-token', data.token); setToken(data.token); setMessage('Signed in.'); }
    catch (error) { setMessage(error.message); }
  }
  async function signUp(event) {
    event.preventDefault(); setMessage('');
    try { const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }); localStorage.setItem('store-token', data.token); setToken(data.token); setMessage('Account created.'); }
    catch (error) { setMessage(error.message); }
  }
  async function loadOrders() {
    try { const data = await api('/api/orders'); setOrders(data.orders || []); setMessage('Order history loaded.'); }
    catch (error) { setMessage(error.message); }
  }
  async function placeDemoOrder(product) {
    try { await api('/api/orders', { method: 'POST', body: JSON.stringify({ items: [{ productId: product.id, quantity: 1 }] }) }); setMessage('Demo order placed. The current backend stores order lines in memory.'); await loadOrders(); }
    catch (error) { setMessage(error.message); }
  }
  async function signOut() {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* Clear the local token even if the API is offline. */ }
    localStorage.removeItem('store-token'); setToken(''); setOrders([]); setMessage('Signed out.');
  }
  return <div className={"store-shell theme-" + store.style.toLowerCase()} style={{ '--accent': store.accent }}>
    <div className="announcement">Thoughtful goods for everyday living · Free delivery on orders over $75</div>
    <header className="store-header"><a className="brand" href="#top">{store.logoUrl && <img className="brand-logo" src={store.logoUrl} alt=""/>}{store.storeName}</a><nav><a href="#collection">Shop</a>{store.features.orders && token && <button onClick={loadOrders}>My orders</button>}{store.features.auth && <a href="#account">Account</a>}</nav></header>
    <main id="top"><section className="hero"><div className="hero-copy"><p className="eyebrow">{store.category} · MADE WITH INTENTION</p><h1>{store.headline || 'A good thing for every day.'}</h1><p className="hero-description">{store.description}</p><a className="cta" href="#collection">Shop the collection <span>→</span></a></div><div className="hero-art"><div className="art-shape art-shape-one"></div><div className="art-shape art-shape-two"></div><span className="art-caption">THE EVERYDAY EDIT<br/>VOL. 01</span></div></section>
      <section id="collection" className="collection"><div className="section-heading"><div><p className="eyebrow">CURATED FOR YOU</p><h2>The collection</h2></div><span>{store.products.length} pieces</span></div><div className="product-grid">{store.products.map((product, index) => <article className="product" key={product.id}><div className={'product-image tone-' + (index % 4)}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name}/> : <span>{(product.name || 'P').slice(0, 1)}</span>}</div><div className="product-info"><div><h3>{product.name || 'New product'}</h3><p>{product.description}</p></div><strong>\${Number(product.price || 0).toFixed(2)}</strong></div>{store.features.orders && <button className="add-button" onClick={() => placeDemoOrder(product)}>Place demo order</button>}</article>)}</div></section>
      {store.features.auth && <section id="account" className="account"><div><p className="eyebrow">YOUR ACCOUNT</p><h2>{token ? 'Welcome back.' : 'Good to have you here.'}</h2><p>Sign in or create an account to use the demo commerce API.</p>{token ? <button className="cta" onClick={signOut}>Sign out</button> : <form className="account-form"><input placeholder="Your name (for registration)" value={name} onChange={e => setName(e.target.value)}/><input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}/><input type="password" placeholder="Password (8+ characters)" value={password} onChange={e => setPassword(e.target.value)}/><div className="form-actions"><button className="cta" onClick={signIn}>Sign in</button><button className="outline-button" onClick={signUp}>Create account</button></div></form>}{message && <p className="message" role="status">{message}</p>}{orders.length > 0 && <div className="orders"><h3>Your orders</h3>{orders.map(order => <p key={order.id}>Order #{order.id} · {order.status} · {order.items.length} item(s)</p>)}</div>}</div><div className="account-note"><span className="note-mark">✓</span><h3>Built on a protected foundation.</h3><p>Authentication, order ownership checks and Redis-backed request protection are included in the backend starter.</p><span className="api-status">● {status}</span></div></section>}
    </main><footer className="store-footer"><span>{store.storeName}</span><span>{store.contactEmail}</span><span>Powered by CommerceForge</span></footer>
  </div>;
}
`;

function storefrontStyles(accent) {
  return `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');\n:root{font-family:'DM Sans',sans-serif;color:#20271f;background:#fdfcf8;font-synthesis:none;text-rendering:optimizeLegibility;--accent:${accent}}*{box-sizing:border-box}body{margin:0}.store-shell{max-width:1440px;margin:auto}.announcement{text-align:center;background:#e9ede5;padding:9px 16px;font-size:10px;letter-spacing:.04em;color:#4d5e4e}.store-header{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 7%;border-bottom:1px solid #ecece7}.brand{display:flex;align-items:center;gap:10px;font-family:Manrope,sans-serif;font-weight:700;font-size:20px;color:var(--accent);text-decoration:none}.brand-logo{max-width:72px;max-height:38px;object-fit:contain}.store-header nav{display:flex;gap:28px}.store-header nav a,.store-header nav button,.bag{border:0;background:none;color:#4a514a;text-decoration:none;font-size:12px;cursor:pointer}.hero{padding:58px 7% 72px;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:8%}.eyebrow{font-size:10px;font-weight:700;letter-spacing:.18em;color:var(--accent)}.hero h1,.section-heading h2,.account h2{font-family:Manrope,sans-serif;font-size:clamp(36px,5vw,62px);line-height:1.07;letter-spacing:-.05em;font-weight:500;max-width:550px;margin:18px 0}.hero-description{font-size:14px;line-height:1.8;color:#747a71;max-width:400px}.cta,.outline-button{display:inline-flex;gap:24px;align-items:center;margin-top:18px;padding:14px 20px;border:0;border-radius:3px;background:var(--accent);color:white;text-decoration:none;font-weight:600;font-size:11px;cursor:pointer}.hero-art{height:390px;position:relative;overflow:hidden;background:#e4e1d5;border-radius:3px}.art-shape{position:absolute;border-radius:48% 52% 40% 60%;background:#a6b19b;transform:rotate(-18deg)}.art-shape-one{height:330px;width:220px;left:22%;top:13%;background:#9da88e}.art-shape-two{height:280px;width:230px;right:10%;top:37%;background:#d1b99f;transform:rotate(24deg)}.art-caption{position:absolute;right:16px;bottom:16px;font-size:9px;line-height:1.8;letter-spacing:.15em;color:#374239}.collection{padding:30px 7% 80px}.section-heading{display:flex;align-items:end;justify-content:space-between;margin-bottom:22px}.section-heading h2,.account h2{font-size:30px;margin:8px 0}.section-heading span{font-size:11px;color:#899087}.product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.product-image{position:relative;aspect-ratio:.82;display:grid;place-items:center;overflow:hidden}.product-image img{width:100%;height:100%;object-fit:cover}.product-image>span{font-family:Manrope,sans-serif;font-size:56px;color:#ffffffa6}.tone-0{background:#e7e0d6}.tone-1{background:#dfe7dc}.tone-2{background:#e8d9ce}.tone-3{background:#e5e6e8}.heart{position:absolute;right:12px;top:12px;width:32px;height:32px;border:0;border-radius:50%;background:#ffffffd9}.product-info{display:flex;justify-content:space-between;gap:8px;padding:12px 0}.product-info h3{font-size:12px;margin:0}.product-info p{font-size:10px;line-height:1.6;color:#858980;max-width:230px}.product-info strong{font-size:11px;white-space:nowrap}.add-button{width:100%;padding:11px;border:1px solid #dfe3dc;background:transparent;color:var(--accent);font-size:10px;cursor:pointer}.account{padding:64px 7%;background:#f0f1eb;display:grid;grid-template-columns:1fr 1fr;gap:10%;align-items:center}.account>div>p:not(.eyebrow){font-size:12px;color:#777e74;line-height:1.7}.account-form{display:grid;gap:10px;max-width:390px}.account-form input{padding:12px 14px;border:1px solid #dfe2da;background:#fff;font:inherit;font-size:12px}.form-actions{display:flex;gap:10px}.form-actions .cta,.outline-button{margin-top:4px}.outline-button{background:transparent;border:1px solid #cbd3c8;color:var(--accent)}.message{font-size:11px;color:var(--accent)}.orders{margin-top:20px;font-size:11px}.orders h3{font-size:13px}.orders p{border-top:1px solid #dfe2da;padding-top:8px}.account-note{padding:30px;background:#fff;border:1px solid #e6e8e1}.note-mark{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#e9efe7;color:var(--accent)}.account-note h3{font-family:Manrope,sans-serif;font-weight:600}.account-note p{font-size:12px;line-height:1.8;color:#7a8178}.api-status{font-size:10px;color:var(--accent)}.store-footer{padding:25px 7%;display:flex;justify-content:space-between;font-size:10px;color:#7c8279}@media(max-width:760px){.store-header{padding:0 5%}.store-header nav{gap:12px}.hero{grid-template-columns:1fr;padding:40px 6%;gap:30px}.hero-art{height:270px}.collection{padding:20px 6% 50px}.product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 12px}.account{grid-template-columns:1fr;padding:45px 6%;gap:25px}.store-footer{padding:22px 6%;gap:12px;flex-wrap:wrap}}\n`;
}

function storefrontTheme(style) {
  const themes = {
    Modern: '.theme-modern{background:#f4f6f5}.theme-modern .hero-art{background:#d9e3df}.theme-modern .announcement{background:#e4ece8}',
    Luxury: '.theme-luxury{background:#fbf7f1;color:#30231e;font-family:Georgia,serif}.theme-luxury .hero-art{background:#e6d9cb}.theme-luxury .announcement{background:#efe6dc;color:#675347}',
    Colorful: '.theme-colorful{background:#fff9e9}.theme-colorful .hero-art{background:#f0d77e}.theme-colorful .announcement{background:#f5e6ac;color:#5d4b16}',
    Professional: '.theme-professional{background:#f6f8f7}.theme-professional .hero-art{background:#dbe4e1}.theme-professional .announcement{background:#e7edeb}',
    Dark: '.theme-dark{background:#202522;color:#f5f3ed}.theme-dark .announcement{background:#323a34;color:#d3ddd3}.theme-dark .store-header{border-color:#3d4540}.theme-dark .store-header nav a,.theme-dark .store-header nav button,.theme-dark .bag{color:#e2e7e0}.theme-dark .hero-description,.theme-dark .section-heading span,.theme-dark .product-info p,.theme-dark .store-footer{color:#bcc3bc}.theme-dark .hero-art{background:#3d4940}.theme-dark .account{background:#2b332d}.theme-dark .account-note{background:#353d37;border-color:#485148}.theme-dark .account-note p,.theme-dark .account>div>p:not(.eyebrow){color:#c0c8c0}.theme-dark .account-form input{background:#252c27;border-color:#4a554b;color:white}.theme-dark .outline-button{color:white;border-color:#68736a}',
  };
  return `\n${themes[style] || ''}\n`;
}

function rootReadme(store) {
  return `# ${store.storeName}\n\nThis ZIP contains the configured storefront and the current CommerceForge demo backend.\n\n## Run the backend\n\n1. Install Node.js 20 or newer and Redis 7.\n2. In \`backend/\`, copy \`.env.example\` to \`.env\`. Set unique \`ADMIN_EMAIL\` and \`ADMIN_PASSWORD\` values.\n3. Start Redis, then run \`npm install\` and \`npm run dev\` in \`backend/\`. The API listens on port 5000.\n4. In a second terminal run \`npm install\` and \`npm run dev\` in \`frontend/\`. Open http://localhost:5173.\n\n## Included today\n\n- Health, liveness and readiness endpoints.\n- Registration, login, logout, role-based authorization.\n- In-memory orders with owner-scoped create/read endpoints.\n- Admin-only user/order read routes.\n- Redis token-bucket request limits and 429 responses.\n- A responsive configured storefront with the products and brand choices in \`store-config.json\`.\n\n## Demo boundaries\n\nThe backend stores records in memory, so they reset on restart. Product rows are storefront configuration only; there is no product API, inventory reservation, or stock enforcement. Payment processing and idempotent checkout are not included. The tenant header is validated for request context, but the current code does not provide tenant data isolation. The selected plan is configuration metadata only: billing, quotas and plan gating are not enforced. Do not deploy this demo as a production commerce service.\n`;
}

export async function exportStore(req, res, next) {
  try {
    const store = normalizeStore(req.body);
    const root = `commerceforge-${store.slug}`;
    const entries = [
      { path: `${root}/README.md`, content: rootReadme(store) },
      { path: `${root}/store-config.json`, content: JSON.stringify(store, null, 2) },
      ...generatedFrontendFiles(store, root),
    ];
    const sourceEntries = await Promise.all(bundledBackendFiles.map(async (file) => {
      let content = await readFile(path.join(projectRoot, 'server', file));
      if (file === 'src/app.js') {
        content = content.toString('utf8')
          .replace(/^import storeExportRoutes.*\r?\n/m, '')
          .replace(/^\/\/ Platform store configuration\/export[^\r\n]*\r?\napp\.use\('\/api\/store-builder', storeExportRoutes\);\r?\n/m, '');
      }
      return { path: `${root}/backend/${file}`, content };
    }));
    entries.push(...sourceEntries);
    entries.push({ path: `${root}/backend/compose.yaml`, content: await readFile(path.join(projectRoot, 'compose.yaml')) });
    entries.push({ path: `${root}/backend/README.md`, content: 'See the project README for run instructions and demo limitations. This backend is the current shared CommerceForge prototype.\n' });
    const archive = createZipArchive(entries);
    res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${store.slug}.zip"`, 'Content-Length': archive.length });
    return res.status(200).send(archive);
  } catch (error) {
    if (error.code === 'ENOENT') return next(new HttpError(500, 'export_source_missing', 'A backend template file is missing from the project'));
    return next(error);
  }
}

import { lazy, Suspense, useState } from 'react';
import { useBuilder } from '../../shared/context/BuilderContext.jsx';
import { downloadStoreZip } from '../../shared/api/storeExport.js';
import { getPlan, plans, planFeatureRows } from './planCatalog.js';

const PreviewPane = lazy(() => import('./components/PreviewPane.jsx'));
const categories = ['Clothing', 'Electronics', 'Stationery', 'Groceries', 'Beauty', 'Furniture', 'Home goods', 'Other'];
const styles = [
  { name: 'Natural', color: '#e7e3d9', note: 'Soft, warm and considered' },
  { name: 'Modern', color: '#dae5e0', note: 'Clean lines and calm tones' },
  { name: 'Luxury', color: '#e8d8c9', note: 'Refined, editorial and quiet' },
  { name: 'Colorful', color: '#efd77e', note: 'Bright and full of character' },
  { name: 'Professional', color: '#dce5e1', note: 'Clear, confident and focused' },
  { name: 'Dark', color: '#313b34', note: 'A bold, high contrast look' },
];
const layouts = [
  { name: 'Editorial', note: 'A generous hero and curated product rows', symbol: '▱' },
  { name: 'Grid', note: 'Put products front and center', symbol: '▦' },
  { name: 'Showcase', note: 'Large imagery with a focused collection', symbol: '▤' },
  { name: 'Minimal', note: 'A quiet, simple shopping experience', symbol: '▥' },
];
const optionalFeatures = [
  { id: 'auth', title: 'Customer account section', copy: 'Show or hide sign-in and registration on the generated storefront.', included: 'Available in every plan' },
  { id: 'orders', title: 'Customer order history', copy: 'Show or hide the order history action in the generated storefront.', included: 'Available in every plan' },
  { id: 'adminReports', title: 'Admin reports', copy: 'Give admins user and order reporting APIs.', plan: 'Basic' },
  { id: 'inventory', title: 'Concurrency-safe inventory', copy: 'Reserve stock atomically and return expired reservations.', plan: 'Plus' },
  { id: 'checkout', title: 'Idempotent checkout and webhooks', copy: 'Prevent duplicate checkout requests and verify payment events.', plan: 'Pro' },
  { id: 'attackDemo', title: 'Concurrency attack demo', copy: 'Compare naive and protected purchase behavior in development.', plan: 'Pro' },
];

function Field({ label, value, onChange, type = 'text', placeholder, hint }) {
  return <label className="studio-field"><span>{label}</span><input type={type} value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>;
}

function PageFooter({ title, detail, onClick }) {
  return <button className="page-footer-next" onClick={onClick}><span><small>CONTINUE</small><strong>{title}</strong><em>{detail}</em></span><i>→</i></button>;
}

function BrandPage() {
  const { store, update } = useBuilder();
  return <div className="studio-page">
    <PageHeading eyebrow="BRAND IDENTITY" title="Make it feel like your brand." copy="Add the details customers will see in the header, homepage and generated store files." />
    <div className="form-layout"><section className="panel form-panel"><div className="panel-heading"><div><span className="eyebrow">THE BASICS</span><h3>Store information</h3></div><span className="step-chip">01 / 04</span></div>
      <div className="field-grid"><Field label="Store name" value={store.storeName} placeholder="e.g. Sunday Supply" onChange={(value) => update('storeName', value)} /><Field label="Store URL slug" value={store.slug} placeholder="your-store" hint="Used as the generated project and ZIP name." onChange={(value) => update('slug', value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} /><label className="studio-field"><span>Business category</span><select value={store.category} onChange={(event) => update('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><Field label="Contact email" value={store.contactEmail} type="email" placeholder="hello@yourstore.com" onChange={(value) => update('contactEmail', value)} /><div className="field-span"><Field label="Logo image URL" value={store.logoUrl} placeholder="https://your-site.com/logo.png" hint="Optional. Paste a public image URL." onChange={(value) => update('logoUrl', value)} /></div><div className="field-span"><Field label="Homepage headline" value={store.headline} placeholder="A line that says what your store is about" onChange={(value) => update('headline', value)} /></div><label className="studio-field field-span"><span>About your store</span><textarea rows="4" value={store.description} placeholder="Tell customers what makes your store special." onChange={(event) => update('description', event.target.value)} /><small>This appears below the main headline in your storefront.</small></label></div>
      </section><aside className="panel identity-panel"><span className="eyebrow">BRAND SNAPSHOT</span><div className="identity-mark" style={{ color: store.accent, backgroundColor: `${store.accent}18` }}>{store.logoUrl ? <img src={store.logoUrl} alt="" /> : (store.storeName || 'S').slice(0, 1).toUpperCase()}</div><h3>{store.storeName || 'Your store name'}</h3><span className="identity-slug">/{store.slug || 'your-store'}</span><p>{store.description || 'Your brand story will show here as you fill out your store details.'}</p><div className="identity-bottom"><span>BUSINESS TYPE</span><strong>{store.category}</strong></div></aside></div>
    <PageFooter title="Next up: Products" detail="Add the items you want to sell" onClick={() => { window.history.pushState({}, '', '/studio/products'); window.dispatchEvent(new PopStateEvent('popstate')); }} />
  </div>;
}

function ProductsPage() {
  const { store, updateProduct, addProduct, removeProduct } = useBuilder();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('added');
  const filtered = store.products
    .filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase()))
    .slice()
    .sort((left, right) => sort === 'name' ? left.name.localeCompare(right.name) : 0);
  const addAllowed = store.products.length < 100;
  return <div className="studio-page">
    <PageHeading eyebrow="PRODUCT CATALOG" title="Everything you want to sell." copy="Build your catalog here. Product CRUD is included in every plan and product details appear in the live storefront preview." action={<button className="studio-primary" onClick={addProduct} disabled={!addAllowed}>＋ Add product</button>} />
    <div className="catalog-toolbar"><div className="catalog-count"><strong>{store.products.length}</strong><span>products in this draft</span></div><label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your products" /></label><select className="catalog-select" aria-label="Product sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="added">Order added</option><option value="name">Name A–Z</option></select></div>
    {filtered.length ? <div className="product-editor-list">{filtered.map((product, index) => <article className="product-editor-card" key={product.id}><div className="product-editor-image">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>{(product.name || 'P').slice(0, 1).toUpperCase()}</span>}<small>{String(index + 1).padStart(2, '0')}</small></div><div className="product-editor-fields"><div className="product-row-top"><strong>{product.name || 'New product'}</strong><button className="quiet-danger" onClick={() => removeProduct(product.id)}>Remove</button></div><div className="field-grid compact"><Field label="Product name" value={product.name} placeholder="Product name" onChange={(value) => updateProduct(product.id, 'name', value)} /><Field label="Price" type="number" value={product.price} placeholder="0.00" onChange={(value) => updateProduct(product.id, 'price', value)} /><Field label="Quantity in stock" type="number" value={product.stock} placeholder="0" onChange={(value) => updateProduct(product.id, 'stock', value)} /><Field label="Image URL" value={product.imageUrl} placeholder="https://…" onChange={(value) => updateProduct(product.id, 'imageUrl', value)} /><label className="studio-field field-span"><span>Description</span><textarea rows="2" value={product.description} placeholder="A few details about this product" onChange={(event) => updateProduct(product.id, 'description', event.target.value)} /></label></div></div></article>)}</div> : <div className="empty-state"><span>▦</span><h3>No products match that search</h3><p>Try a different word, or add a new item to your catalog.</p><button className="studio-primary" onClick={addProduct}>Add a product</button></div>}
    <div className="catalog-note"><span>ⓘ</span><p>{store.products.length >= 100 ? 'This demo export supports up to 100 products.' : 'Product images use public URLs in this demo. Upload management is not connected yet.'} Product create, read, update and delete APIs ship in every plan.</p></div>
  </div>;
}

function DesignPage() {
  const { store, update } = useBuilder();
  const [viewport, setViewport] = useState('desktop');
  return <div className="studio-page">
    <PageHeading eyebrow="SITE DESIGN" title="See it come together." copy="Choose a structure and visual style. Your preview updates immediately as you make changes." />
    <div className="design-workbench"><section className="design-controls"><div className="design-section-heading"><div><span className="eyebrow">01 · PAGE LAYOUT</span><h3>Choose your starting layout</h3><p>Each layout uses the same products and plan features.</p></div></div><div className="layout-choice-list">{layouts.map((layout) => <button key={layout.name} onClick={() => update('layout', layout.name)} className={`layout-choice ${store.layout === layout.name ? 'selected' : ''}`} aria-pressed={store.layout === layout.name}><span className={`layout-thumb layout-thumb-${layout.name.toLowerCase()}`}><i/><i/><i/><i/></span><span className="layout-copy"><strong>{layout.name}</strong><small>{layout.note}</small></span><span className="choice-radio">{store.layout === layout.name ? '✓' : ''}</span></button>)}</div>
      <div className="design-section-heading theme-heading"><div><span className="eyebrow">02 · VISUAL STYLE</span><h3>Set the mood</h3><p>Pick a palette direction, then fine-tune your accent.</p></div></div><div className="theme-choice-grid">{styles.map((style) => <button key={style.name} className={`theme-choice ${store.style === style.name ? 'selected' : ''}`} onClick={() => update('style', style.name)} aria-pressed={store.style === style.name}><span className="theme-swatch" style={{ backgroundColor: style.color }}><i style={{ background: store.accent }} /></span><span><strong>{style.name}</strong><small>{style.note}</small></span><i className="theme-check">{store.style === style.name ? '✓' : ''}</i></button>)}</div>
      <div className="accent-picker"><span className="accent-dot" style={{ background: store.accent }} /><div><strong>Brand accent</strong><small>Used for buttons and highlights</small></div><input type="color" aria-label="Brand accent color" value={store.accent} onChange={(event) => update('accent', event.target.value)} /><code>{store.accent.toUpperCase()}</code></div>
      <div className="layout-note"><span>✦</span><p>Your selected layout is included in the generated storefront files.</p></div>
    </section><section className="preview-workspace"><div className="preview-toolbar"><div><span className="preview-live-dot"/> LIVE PREVIEW</div><div className="viewport-controls"><button className={viewport === 'desktop' ? 'active' : ''} aria-label="Desktop preview" onClick={() => setViewport('desktop')}>▣</button><button className={viewport === 'mobile' ? 'active' : ''} aria-label="Mobile preview" onClick={() => setViewport('mobile')}>▯</button><button className="open-preview" onClick={() => setViewport(viewport === 'desktop' ? 'mobile' : 'desktop')}>↗</button></div></div><div className={`preview-viewport ${viewport === 'mobile' ? 'mobile' : ''}`}><Suspense fallback={<div className="preview-loading">Rendering your storefront…</div>}><PreviewPane layoutMode={store.layout} viewport={viewport} /></Suspense></div><div className="preview-footer"><span>/{store.slug || 'your-store'}</span><span>Preview updates as you edit</span></div></section></div>
  </div>;
}

function PlansPage() {
  const { store, setPlan } = useBuilder();
  return <div className="studio-page">
    <PageHeading eyebrow="PLAN COMPARISON" title="Choose the features you need." copy="Plans control which implemented backend modules are included in your exported project. Choose a tier, then tune any optional features below." />
    <div className="pricing-grid">{plans.map((plan) => <article key={plan.name} className={`pricing-card ${plan.featured ? 'featured' : ''} ${store.plan === plan.name ? 'current' : ''}`}><div className="pricing-topline">{plan.featured ? <span className="popular-label">MOST POPULAR</span> : <span className="tier-label">{plan.name.toUpperCase()} PLAN</span>}{store.plan === plan.name && <span className="current-label">SELECTED</span>}</div><h3>{plan.name}</h3><p>{plan.description}</p><div className="plan-price"><strong>{plan.price}</strong><span>{plan.cadence}</span></div><small className="plan-tagline">{plan.line}</small><button className={store.plan === plan.name ? 'plan-selected-button' : 'plan-button'} onClick={() => setPlan(plan.name)}>{store.plan === plan.name ? 'Selected plan ✓' : `Choose ${plan.name}`}</button><div className="pricing-divider"/><div className="included-label">INCLUDES</div><div className="pricing-features">{plan.summary.map((feature) => <span key={feature}><i>✓</i>{feature}</span>)}</div></article>)}</div>
    <div className="comparison-heading"><div><span className="eyebrow">SIDE BY SIDE</span><h3>Compare plan capabilities</h3></div><span>All figures are demo pricing; billing is not connected.</span></div><div className="comparison-wrap"><table className="comparison-table"><thead><tr><th>FEATURE</th>{plans.map((plan) => <th key={plan.name} className={store.plan === plan.name ? 'selected-column' : ''}><strong>{plan.name}</strong><small>{plan.price}</small></th>)}</tr></thead><tbody>{planFeatureRows.map((feature) => <tr key={feature.label}><td>{feature.label}{feature.availability.unavailable && <small className="not-built">NOT AVAILABLE YET</small>}</td>{plans.map((plan) => <td key={plan.name} className={store.plan === plan.name ? 'selected-column' : ''}>{feature.availability[plan.name] ? <span className="included-check">✓</span> : <span className="not-included">—</span>}</td>)}</tr>)}</tbody></table></div>
    <div className="plan-disclaimer"><span>ⓘ</span><p>Plan selection configures the generated demo code only. Billing, hosted subscriptions and automatic upgrades are not implemented.</p></div>
  </div>;
}

function FeaturesPage() {
  const { store, setFeature } = useBuilder();
  const available = getPlan(store.plan).features;
  return <div className="studio-page">
    <PageHeading eyebrow="FEATURE CONFIGURATION" title="Your plan, your feature set." copy="Turn optional implemented modules on or off. Features unavailable on your selected tier stay locked, and the export enforces these choices on the server." />
    <div className="feature-plan-banner"><span className="feature-plan-mark">◇</span><span><small>ACTIVE PLAN</small><strong>{store.plan}</strong></span><button className="text-action" onClick={() => { window.history.pushState({}, '', '/studio/plans'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Change plan <span>→</span></button></div>
    <div className="feature-card-list">{optionalFeatures.map((feature) => {
      const tiered = Boolean(feature.plan);
      const locked = tiered && !available[feature.id];
      const checked = Boolean(store.features[feature.id]);
      return <article key={feature.id} className={`feature-card ${locked ? 'locked' : ''}`}><div className="feature-card-icon">{feature.id === 'inventory' ? '▦' : feature.id === 'checkout' ? '↗' : feature.id === 'attackDemo' ? '⌁' : feature.id === 'adminReports' ? '◫' : '✳'}</div><div className="feature-copy"><div className="feature-title-line"><h3>{feature.title}</h3>{tiered ? <span className="feature-tier">{feature.plan}</span> : <span className="included-tier">INCLUDED</span>}</div><p>{feature.copy}</p>{locked && <small className="locked-note">Choose {feature.plan} to add this feature to the export.</small>}</div><label className={`toggle ${locked ? 'disabled' : ''}`}><input type="checkbox" checked={checked} disabled={locked} onChange={(event) => setFeature(feature.id, event.target.checked)} /><span /></label></article>;
    })}</div>
    <div className="feature-foundation"><div><span className="eyebrow">SECURITY FOUNDATION</span><h3>Always included in every tier</h3><p>These safeguards are part of the generated API, whichever plan you select.</p></div><div className="foundation-tags">{['Health checks', 'Auth and role checks', 'Product CRUD', 'Redis rate limiting', 'Protected order access'].map((item) => <span key={item}><i>✓</i>{item}</span>)}</div></div>
  </div>;
}

function ReviewLivePreview({ store }) {
  const [viewport, setViewport] = useState('desktop');
  return <section className="review-live-preview"><div className="review-preview-heading"><div><span className="eyebrow">LIVE STOREFRONT PREVIEW</span><h3>See exactly what you're exporting</h3><p>This preview uses your current brand, layout, products and selected options.</p></div><div className="viewport-controls"><button className={viewport === 'desktop' ? 'active' : ''} aria-label="Desktop preview" onClick={() => setViewport('desktop')}>▣</button><button className={viewport === 'mobile' ? 'active' : ''} aria-label="Mobile preview" onClick={() => setViewport('mobile')}>▯</button></div></div><div className={`review-preview-frame ${viewport}`}><Suspense fallback={<div className="preview-loading">Loading the storefront preview…</div>}><PreviewPane layoutMode={store.layout} viewport={viewport} /></Suspense></div></section>;
}

function ReviewPage() {
  const { store } = useBuilder();
  const plan = getPlan(store.plan);
  const selected = optionalFeatures.filter((feature) => store.features[feature.id]);
  const [checkState, setCheckState] = useState({ status: 'idle', checks: [], archive: null, snapshot: '' });
  const currentSnapshot = JSON.stringify(store);
  const checkIsCurrent = checkState.snapshot === currentSnapshot;

  async function runChecks() {
    setCheckState({ status: 'running', checks: [], archive: null, snapshot: currentSnapshot });
    try {
      const { runPreExportChecks } = await import('./preExportChecks.js');
      const result = await runPreExportChecks(store);
      setCheckState({ ...result, status: result.passed ? 'passed' : 'failed', snapshot: currentSnapshot });
    } catch (error) {
      setCheckState({ status: 'failed', checks: [{ id: 'runner', title: 'Check runner', detail: error.message || 'Could not load the pre-export checks.', status: 'failed' }], archive: null, snapshot: currentSnapshot });
    }
  }

  return <div className="studio-page">
    <PageHeading eyebrow="FINAL REVIEW" title="A quick look before export." copy="Preview the live storefront, run plan-aware checks and review the exact project ZIP before downloading." />
    <div className="review-top-grid"><section className="review-store-card"><div className="review-brand-mark" style={{ background: `${store.accent}18`, color: store.accent }}>{store.logoUrl ? <img src={store.logoUrl} alt="" /> : (store.storeName || 'S')[0]}</div><div><span className="eyebrow">STORE PROJECT</span><h3>{store.storeName || 'Your store'}</h3><p>{store.category} · /{store.slug || 'your-store'}</p></div><span className="ready-badge"><i/> READY TO EXPORT</span><div className="review-meta"><span>PLAN<strong>{plan.name}</strong></span><span>LAYOUT<strong>{store.layout || 'Editorial'}</strong></span><span>PRODUCTS<strong>{store.products.length}</strong></span></div></section><section className="review-plan-card"><span className="eyebrow">SELECTED PLAN</span><div><h3>{plan.name}</h3><strong>{plan.price}<small> {plan.cadence}</small></strong></div><p>{plan.description}</p><button className="text-action" onClick={() => { window.history.pushState({}, '', '/studio/plans'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Change plan <span>→</span></button></section></div>
    <div className="review-columns"><section className="panel review-list-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR CONFIGURATION</span><h3>Included in this export</h3></div></div><div className="review-list">{[...plan.summary, ...selected.filter((feature) => feature.plan).map((feature) => feature.title), store.features.auth ? 'Customer account section shown' : 'Customer account section hidden', store.features.orders ? 'Order history shown' : 'Order history hidden'].filter((item, index, all) => all.indexOf(item) === index).map((item) => <span key={item}><i>✓</i>{item}</span>)}</div></section><section className="panel review-products-panel"><div className="panel-heading"><div><span className="eyebrow">CATALOG PREVIEW</span><h3>Products ({store.products.length})</h3></div></div>{store.products.length ? store.products.slice(0, 5).map((product) => <div className="review-product-row" key={product.id}><span>{(product.name || 'P')[0]}</span><strong>{product.name || 'Untitled product'}</strong><small>${Number(product.price || 0).toFixed(2)}</small></div>) : <p className="empty-products">Your storefront is ready for products. Add them from the Products page.</p>}</section></div>
    <ReviewLivePreview store={store} />
    <section className="pre-export-panel"><div className="pre-export-heading"><div><span className="eyebrow">PLAN-AWARE BUILD CHECKS</span><h3>Test this project before download</h3><p>We'll validate store details, the selected {plan.name} modules, backend availability and the generated ZIP structure.</p></div><button className="studio-primary" onClick={runChecks} disabled={checkState.status === 'running'}>{checkState.status === 'running' ? 'Running checks…' : checkState.status === 'passed' && checkIsCurrent ? 'Run checks again' : 'Run checks'} <span>✓</span></button></div><div className="check-plan-modules"><span className="check-plan-label">{plan.name} PLAN</span>{plan.summary.map((item) => <span key={item}><i>✓</i>{item}</span>)}</div>{checkState.checks.length > 0 && <div className="pre-export-results">{checkState.checks.map((item) => <div key={item.id} className={`check-row ${item.status}`}><i>{item.status === 'passed' ? '✓' : item.status === 'warning' ? '!' : '×'}</i><b>{item.title}</b><small>{item.detail}</small></div>)}</div>}{checkState.status === 'passed' && checkIsCurrent ? <div className="verified-export"><span><i>✓</i> Checks passed and the ZIP is ready.</span><button className="studio-primary" onClick={() => downloadStoreZip(checkState.archive)} disabled={!checkState.archive}>Download verified ZIP <span>↓</span></button></div> : checkState.status === 'passed' && !checkIsCurrent ? <p className="stale-check-note">Your store changed after these checks. Run them again before downloading.</p> : checkState.status === 'idle' ? <p className="check-idle-note">Checks load only when you run them. Export will run them automatically if you skip this step.</p> : null}</section>
    <section className="export-readiness"><span className="readiness-icon">✓</span><div><h3>Every tier exports a complete starter</h3><p>The verified ZIP includes the storefront, selected backend features, Docker services and setup instructions.</p></div><div className="readiness-actions"><span>Local demo package · no billing</span></div></section>
    <div className="review-boundaries"><strong>Demo boundaries</strong><p>Tenant provisioning, billing and production payment credentials are not included. Configure secrets and review deployment settings before using the generated project outside local development.</p></div>
  </div>;
}

function PageHeading({ eyebrow, title, copy, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div>{action}</div>;
}

export default function StudioPage({ route }) {
  if (route === 'brand') return <BrandPage />;
  if (route === 'products') return <ProductsPage />;
  if (route === 'design') return <DesignPage />;
  if (route === 'plans') return <PlansPage />;
  if (route === 'features') return <FeaturesPage />;
  if (route === 'review') return <ReviewPage />;
  return <FeaturesPage />;
}

export { PageHeading };

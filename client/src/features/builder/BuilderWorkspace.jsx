import { lazy, Suspense, useState } from 'react';
import { useBuilder } from '../../shared/context/BuilderContext.jsx';
import { exportStoreZip } from '../../shared/api/storeExport.js';
import { getPlan, plans, planFeatureRows } from './planCatalog.js';
const PreviewPane = lazy(() => import('./components/PreviewPane.jsx'));

const steps = [
  { id: 'details', title: 'Store details', hint: 'Your brand basics' },
  { id: 'products', title: 'Products', hint: 'Build your first catalog' },
  { id: 'design', title: 'Design', hint: 'Make it feel like you' },
  { id: 'plan', title: 'Choose a plan', hint: 'Compare what is included' },
  { id: 'features', title: 'Features', hint: 'Choose storefront options' },
  { id: 'review', title: 'Review & export', hint: 'Package your site' },
];

const categories = ['Clothing', 'Electronics', 'Stationery', 'Groceries', 'Beauty', 'Furniture', 'Home goods', 'Other'];
const implemented = [
  { id: 'auth', title: 'Customer accounts', copy: 'Register, sign in and keep a session.' },
  { id: 'orders', title: 'Order basics', copy: 'Create orders and view your own order history.' },
  { id: 'adminReports', title: 'Admin user/order reports', copy: 'Admin-only list APIs; unlocked in Basic and above.' },
  { id: 'inventory', title: 'Concurrency-safe inventory', copy: 'Atomic stock reservations, confirmation and expiry; unlocked in Plus and Pro.' },
  { id: 'checkout', title: 'Idempotent checkout and payments', copy: 'Payment-order creation, replay-safe checkout, and verified webhooks; unlocked in Pro.' },
  { id: 'attackDemo', title: 'Naive vs hardened demo', copy: 'Development-only concurrency attack comparison; unlocked in Pro.' },
];
const backendIncluded = [
  'Health and readiness endpoints',
  'Authentication, role checks and protected order APIs',
  'Admin-protected product CRUD (Free and above)',
  'Redis-backed IP, account, tenant and checkout rate limiting',
];

function StepHeading({ eyebrow, title, copy }) {
  return <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#718271]">{eyebrow}</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#1c2820]">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{copy}</p></div>;
}

function Field({ label, value, onChange, placeholder, type = 'text', note }) {
  return <label className="field-label">{label}<input className="field-input" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />{note && <span className="text-[11px] font-normal text-slate-400">{note}</span>}</label>;
}

function StoreDetails() {
  const { store, update } = useBuilder();
  return <><StepHeading eyebrow="Step 01 · Identity" title="Let's name your store." copy="Start with a few details. You can change them any time, and your preview updates as you go." />
    <div className="grid gap-5 sm:grid-cols-2"><Field label="Store name" value={store.storeName} placeholder="e.g. Sunday Supply" onChange={(value) => update('storeName', value)} /><Field label="Store URL" value={store.slug} placeholder="your-store" onChange={(value) => update('slug', value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} note="This becomes the name of your ZIP and project folder." />
      <label className="field-label">Business category<select className="field-input" value={store.category} onChange={(event) => update('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
      <Field label="Contact email" value={store.contactEmail} placeholder="hello@yourstore.com" type="email" onChange={(value) => update('contactEmail', value)} />
      <div className="sm:col-span-2"><Field label="Brand logo URL (optional)" value={store.logoUrl} placeholder="https://your-site.com/logo.png" onChange={(value) => update('logoUrl', value)} /></div>
      <div className="sm:col-span-2"><Field label="Homepage headline" value={store.headline} placeholder="A good line about your store" onChange={(value) => update('headline', value)} /></div>
      <label className="field-label sm:col-span-2">A short introduction<textarea className="field-input min-h-24 resize-y" value={store.description} onChange={(event) => update('description', event.target.value)} /></label>
    </div>
  </>;
}

function Products() {
  const { store, updateProduct, addProduct, removeProduct } = useBuilder();
  return <><StepHeading eyebrow="Step 02 · Catalog" title="Add your first products." copy="Add a few items to shape the storefront preview. Product management APIs are not part of this demo backend yet." />
    <div className="space-y-4">{store.products.map((product, index) => <div className="rounded-2xl border border-[#e6e8e1] bg-white p-4" key={product.id}><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-slate-800">Product {index + 1}</p><button className="text-xs font-semibold text-rose-600 hover:text-rose-800" onClick={() => removeProduct(product.id)}>Remove</button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Product name" value={product.name} placeholder="e.g. Canvas market tote" onChange={(value) => updateProduct(product.id, 'name', value)} /><Field label="Price" type="number" value={product.price} placeholder="0.00" onChange={(value) => updateProduct(product.id, 'price', value)} /><label className="field-label sm:col-span-2">Description<textarea className="field-input min-h-20 resize-y" value={product.description} placeholder="A short product detail" onChange={(event) => updateProduct(product.id, 'description', event.target.value)} /></label><Field label="Starting stock (preview only)" type="number" value={product.stock} placeholder="0" onChange={(value) => updateProduct(product.id, 'stock', value)} /><Field label="Image URL (optional)" value={product.imageUrl} placeholder="https://…" onChange={(value) => updateProduct(product.id, 'imageUrl', value)} /></div></div>)}
    </div><button className="secondary-button mt-4" onClick={addProduct}>＋ Add product</button>
  </>;
}

function Design() {
  const { store, update } = useBuilder();
  const styles = ['Natural', 'Modern', 'Luxury', 'Colorful', 'Professional', 'Dark'];
  return <><StepHeading eyebrow="Step 03 · Visual style" title="Set the mood." copy="Pick a direction and accent color. The starter storefront uses a simple responsive product layout." />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{styles.map((style, index) => <button key={style} onClick={() => update('style', style)} className={`rounded-2xl border p-4 text-left transition ${store.style === style ? 'border-[#516b54] bg-[#f0f3ed] ring-2 ring-[#516b54]/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}><div className={`mb-5 h-20 rounded-xl ${['bg-[#e4dccb]', 'bg-slate-200', 'bg-[#e8d5c6]', 'bg-[#f1d779]', 'bg-[#dce5df]', 'bg-slate-800'][index]}`} /><p className="text-sm font-semibold">{style}</p></button>)}</div>
    <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"><label className="text-sm font-semibold">Accent color</label><input aria-label="Accent color" className="h-10 w-14 cursor-pointer rounded border-0 bg-transparent" type="color" value={store.accent} onChange={(event) => update('accent', event.target.value)} /><span className="font-mono text-xs text-slate-500">{store.accent.toUpperCase()}</span></div>
  </>;
}

function Features() {
  const { store, setFeature } = useBuilder();
  const availableForPlan = getPlan(store.plan).features;
  const unavailable = ['Full tenant data isolation'];
  return <><StepHeading eyebrow="Step 05 · Storefront options" title="Turn features on or off." copy="These choices control the sections and API actions exposed in the generated storefront. Backend security foundations stay included." />
    <div className="space-y-3">{implemented.map((feature) => { const tierLocked = Object.hasOwn(availableForPlan, feature.id) && !availableForPlan[feature.id]; return <label key={feature.id} className={`flex items-start gap-4 rounded-2xl border p-5 ${tierLocked ? 'cursor-not-allowed border-slate-100 bg-slate-50' : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'}`}><input className="mt-1 h-4 w-4 accent-[#516b54]" type="checkbox" checked={Boolean(store.features[feature.id])} disabled={tierLocked} onChange={(event) => setFeature(feature.id, event.target.checked)} /><span><span className="block text-sm font-semibold text-slate-800">{feature.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{feature.copy}</span></span><span className={`ml-auto whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tierLocked ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700'}`}>{tierLocked ? 'Locked by plan' : 'Available'}</span></label>; })}</div>
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-slate-400">Unavailable until backend modules are added</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{unavailable.map((feature) => <label key={feature} className="flex items-center gap-3 text-xs text-slate-400"><input type="checkbox" disabled className="h-4 w-4 accent-slate-300" />{feature}<span className="ml-auto text-[9px] font-bold uppercase tracking-wide">Later</span></label>)}</div></div>
    <div className="mt-4 rounded-2xl bg-[#eef1eb] p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#516b54]">Always included in every plan</p><ul className="mt-3 space-y-2">{backendIncluded.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-700"><span className="text-[#516b54]">✓</span>{item}</li>)}</ul></div>
  </>;
}

function Plan() {
  const { store, setPlan } = useBuilder();
  return <><StepHeading eyebrow="Step 04 · Compare plans" title="Choose the right starting plan." copy="Compare the capabilities that will be included in the exported demo package." />
    <div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="min-w-[760px] w-full border-collapse text-left text-xs"><thead><tr className="bg-[#f7f8f5]"><th className="w-[34%] px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Included capability</th>{plans.map((plan) => <th key={plan.name} className={`px-3 py-4 text-center ${store.plan === plan.name ? 'bg-[#edf2eb]' : ''}`}><button className="w-full rounded-xl px-2 py-1.5 text-center" onClick={() => setPlan(plan.name)} aria-pressed={store.plan === plan.name}><span className="block text-sm font-bold text-slate-800">{plan.name}</span><span className="mt-1 block text-[10px] font-medium text-[#516b54]">{plan.price}</span><span className="mt-1 block text-[9px] leading-4 text-slate-400">{plan.line}</span>{store.plan === plan.name && <span className="mt-2 block text-[9px] font-bold uppercase tracking-wide text-[#516b54]">Selected</span>}</button></th>)}</tr></thead><tbody>{planFeatureRows.map((feature) => <tr className={`border-t border-slate-100 ${feature.availability.unavailable ? 'bg-slate-50/70' : ''}`} key={feature.label}><td className="px-4 py-3.5 font-medium text-slate-700">{feature.label}{feature.availability.unavailable && <span className="ml-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">Not implemented</span>}</td>{plans.map((plan) => <td className={`px-3 py-3.5 text-center ${store.plan === plan.name ? 'bg-[#f7faf6]' : ''}`} key={plan.name}>{feature.availability[plan.name] ? <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-50 font-bold text-emerald-700" aria-label={`Included in ${plan.name}`}>✓</span> : <span className="text-slate-300">—</span>}</td>)}</tr>)}</tbody></table></div>
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">Free includes the product CRUD API. Basic adds admin reports, Plus enables concurrency-safe inventory, and Pro adds idempotent payment checkout and the attack demo. Tier pricing/quotas are demo labels; billing is not active. Full tenant data isolation is still unavailable.</div>
  </>;
}

function Review() {
  const { store } = useBuilder();
  const selectedFeatures = [store.features.auth && 'Customer accounts', store.features.orders && 'Order basics', store.features.adminReports && 'Admin reports', store.features.inventory && 'Concurrency inventory', store.features.checkout && 'Idempotent payments', store.features.attackDemo && 'Concurrency attack demo'].filter(Boolean);
  return <><StepHeading eyebrow="Step 06 · Ready to export" title="Your store is taking shape." copy="Review your plan, storefront options, products, and included backend before downloading the ZIP." />
    <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xl font-semibold text-slate-900">{store.storeName || 'Your new store'}</p><p className="mt-1 text-sm text-slate-500">{store.category} · {store.plan} demo tier</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Ready to package</span></div><div className="my-5 h-px bg-slate-100" /><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Storefront</p><p className="mt-2 text-sm">Brand details, theme, {store.products.length} catalog item(s)</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Backend source</p><p className="mt-2 text-sm">Auth, protected orders, admin read routes, health, Redis rate limiting</p></div></div></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected storefront features</p><div className="mt-3 flex flex-wrap gap-2">{selectedFeatures.length ? selectedFeatures.map((feature) => <span key={feature} className="rounded-full bg-[#edf2eb] px-3 py-1.5 text-xs font-medium text-[#405a43]">{feature}</span>) : <span className="text-xs text-slate-400">No optional storefront features selected</span>}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Products in storefront</p><ul className="mt-3 space-y-2">{store.products.map((product) => <li key={product.id} className="flex justify-between gap-3 text-xs"><span className="truncate">{product.name || 'Untitled product'}</span><span className="shrink-0 text-slate-500">${Number(product.price || 0).toFixed(2)}</span></li>)}</ul></div></div>
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-semibold">Current demo boundaries</p><p className="mt-2 text-xs leading-5 text-slate-500">Records use the database/in-memory models shown in this export. Full tenant data isolation, production deployment and production payment credentials are not provided by this demo.</p></div>
  </>;
}

const contentByStep = { details: StoreDetails, products: Products, design: Design, plan: Plan, features: Features, review: Review };

export default function BuilderWorkspace() {
  const [currentStep, setCurrentStep] = useState(0);
  const [exportState, setExportState] = useState({ busy: false, error: '' });
  const { store } = useBuilder();
  const activeStep = steps[currentStep];
  const StepContent = contentByStep[activeStep.id];

  async function handleExport() {
    setExportState({ busy: true, error: '' });
    try { await exportStoreZip(store); }
    catch (error) { setExportState({ busy: false, error: `${error.message}. Start the API server and Redis, then try again.` }); return; }
    setExportState({ busy: false, error: '' });
  }

  return <div className="min-h-screen bg-[#f7f7f3] text-[#1e2a22]">
    <header className="sticky top-0 z-20 border-b border-[#e8e9e2] bg-[#fbfbf8]/95 backdrop-blur"><div className="mx-auto flex h-[70px] max-w-[1500px] items-center justify-between px-5 lg:px-8"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#516b54] text-sm font-bold text-white">C</div><div><p className="font-display text-base font-semibold leading-tight">CommerceForge</p><p className="text-[10px] font-medium uppercase tracking-[.15em] text-slate-400">Store studio</p></div></div><div className="flex items-center gap-3"><span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 sm:inline-flex">Draft saves automatically</span><button className="primary-button" onClick={handleExport} disabled={exportState.busy}>{exportState.busy ? 'Preparing ZIP…' : 'Export ZIP'} <span aria-hidden="true">↗</span></button></div></div></header>
    <main className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8 lg:py-8"><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#718271]">Your first store</p><h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Build a store that’s ready for real commerce.</h1></div><div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Local draft · {store.products.length} products</div></div>
      <div className="grid items-start gap-6 xl:grid-cols-[220px_minmax(440px,1fr)_minmax(350px,.9fr)]">
        <aside className="rounded-2xl border border-[#e7e8e1] bg-white p-3"><p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Setup guide</p><nav aria-label="Store setup steps" className="flex gap-1 overflow-x-auto xl:flex-col">{steps.map((step, index) => <button key={step.id} onClick={() => setCurrentStep(index)} className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-left transition xl:w-full ${currentStep === index ? 'bg-[#edf1eb]' : 'hover:bg-slate-50'}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${currentStep === index ? 'bg-[#516b54] text-white' : index < currentStep ? 'bg-[#e0e8df] text-[#516b54]' : 'bg-slate-100 text-slate-500'}`}>{index < currentStep ? '✓' : `0${index + 1}`}</span><span><span className={`block text-xs font-semibold ${currentStep === index ? 'text-[#334d37]' : 'text-slate-700'}`}>{step.title}</span><span className="mt-0.5 hidden text-[10px] text-slate-400 xl:block">{step.hint}</span></span></button>)}</nav><div className="mt-5 hidden rounded-xl bg-[#f7f7f3] p-3 xl:block"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick note</p><p className="mt-2 text-[11px] leading-5 text-slate-500">Your draft stays in this browser until you export.</p></div></aside>
        <section className="min-h-[570px] rounded-2xl border border-[#e7e8e1] bg-white p-5 sm:p-7"><StepContent /><div className="mt-9 flex items-center justify-between border-t border-slate-100 pt-5"><button className="secondary-button" onClick={() => setCurrentStep((value) => Math.max(0, value - 1))} disabled={currentStep === 0}>← Back</button><span className="text-[11px] font-medium text-slate-400">Step {currentStep + 1} of {steps.length}</span><button className="primary-button" onClick={() => currentStep === steps.length - 1 ? handleExport() : setCurrentStep((value) => Math.min(steps.length - 1, value + 1))}>{currentStep === steps.length - 1 ? 'Download store ZIP' : 'Continue'} {currentStep < steps.length - 1 && <span>→</span>}</button></div>{exportState.error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">{exportState.error}</p>}</section>
        <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-400">Loading storefront preview…</div>}><PreviewPane /></Suspense>
      </div>
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#e8e9e2] py-5 text-[11px] text-slate-400"><span>CommerceForge · From prompt to protected commerce</span><span>Prototype export · No billing, quotas or deployment yet</span></footer>
    </main>
  </div>;
}

import { useEffect, useMemo, useState } from 'react';
import { useBuilder } from '../../shared/context/BuilderContext.jsx';
import { downloadStoreZip } from '../../shared/api/storeExport.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';
import StudioPage from './StudioPage.jsx';
import { getPlan } from './planCatalog.js';

const navigation = [
  { id: 'overview', label: 'Overview', icon: '◫', group: 'workspace' },
  { id: 'brand', label: 'Brand setup', icon: '✳', group: 'workspace' },
  { id: 'products', label: 'Products', icon: '▦', group: 'workspace' },
  { id: 'design', label: 'Design & layout', icon: '▧', group: 'website' },
  { id: 'plans', label: 'Plans & features', icon: '◇', group: 'website' },
  { id: 'features', label: 'Feature settings', icon: '☷', group: 'website' },
  { id: 'review', label: 'Review & export', icon: '↗', group: 'website' },
];

const titles = {
  overview: ['Good morning', 'Your store, at a glance'],
  brand: ['Website setup', 'Tell your brand story'],
  products: ['Store catalog', 'Manage your products'],
  design: ['Site design', 'Choose a layout and make it yours'],
  plans: ['Plans & features', 'Choose the backend your store needs'],
  features: ['Feature settings', 'Tune what goes into your export'],
  review: ['Ready when you are', 'Review your store and export'],
};

function Icon({ children }) { return <span className="studio-icon" aria-hidden="true">{children}</span>; }

function useStudioRoute() {
  const readRoute = () => window.location.pathname.split('/').filter(Boolean).at(-1) || 'overview';
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const navigate = (next) => {
    if (!titles[next]) return;
    window.history.pushState({}, '', `/studio/${next}`);
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return [titles[route] ? route : 'overview', navigate];
}

function Sidebar({ route, navigate, store }) {
  const { user, logout } = useAuth();
  return <aside className="studio-sidebar">
    <a className="studio-logo" href="/studio/overview" onClick={(event) => { event.preventDefault(); navigate('overview'); }}><span className="studio-logo-mark">M</span><span><strong>Minuto Mein Ecommerce</strong><small>STORE STUDIO</small></span></a>
    {['workspace', 'website'].map((group) => <div className="nav-group" key={group}><p className="nav-caption">{group === 'workspace' ? 'BUILD' : 'WEBSITE'}</p><nav aria-label={group === 'workspace' ? 'Workspace' : 'Website'}>{navigation.filter((item) => item.group === group).map((item) => <button key={item.id} onClick={() => navigate(item.id)} className={`side-link ${route === item.id ? 'active' : ''}`} aria-current={route === item.id ? 'page' : undefined}><Icon>{item.icon}</Icon><span>{item.label}</span>{item.id === 'products' && <small className="nav-count">{store.products.length}</small>}</button>)}</nav></div>)}
    <div className="sidebar-bottom"><div className="help-card"><span className="help-spark">✦</span><strong>Need a hand?</strong><p>Follow the steps to turn your store idea into a working starter.</p><button onClick={() => navigate('review')}>View checklist <span>→</span></button></div><div className="profile-row"><span className="profile-avatar">{String(user?.name || 'M').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="profile-name"><strong>{user?.name || 'Store owner'}</strong><small>{user?.email || 'Workspace admin'}</small></span><button className="signout-button" title="Log out" aria-label="Log out" onClick={async () => { await logout(); window.location.assign('/'); }}>↗</button></div></div>
  </aside>;
}

function Topbar({ route, navigate, store, onExport, busy }) {
  const [, pageTitle] = titles[route];
  return <header className="studio-topbar"><div className="topbar-breadcrumb"><span>My websites</span><span>/</span><strong>{store.storeName || 'Untitled store'}</strong><span>/</span><strong>{pageTitle}</strong></div><div className="topbar-actions"><span className="save-status"><i /> All changes saved</span><button className="topbar-preview" onClick={() => navigate('design')}>◉ <span>Preview</span></button><button className="studio-primary small" onClick={onExport} disabled={busy}>{busy ? 'Preparing…' : 'Export website'} <span>↗</span></button></div></header>;
}

function Overview({ store, navigate }) {
  const plan = getPlan(store.plan);
  const tasks = [
    ['Add your brand details', Boolean(store.storeName && store.headline), 'brand'],
    ['Add products to your catalog', store.products.some((product) => product.name), 'products'],
    ['Choose a website layout', Boolean(store.layoutConfirmed), 'design'],
    ['Review plan features', Boolean(store.planConfirmed), 'plans'],
  ];
  const complete = tasks.filter((task) => task[1]).length;
  return <div className="studio-page overview-page">
    <div className="welcome-banner"><div><div className="welcome-kicker"><span>✦</span> YOUR STORE IS IN GOOD HANDS</div><h2>Make your next big idea<br /><em>feel like a real business.</em></h2><p>Build the storefront, add your products, then export a backend starter with the features you choose.</p><button className="studio-primary" onClick={() => navigate('brand')}>Continue building <span>→</span></button></div><div className="welcome-art"><div className="art-sun"/><div className="art-arch"><div/><span>{store.storeName || 'YOUR BRAND'}</span></div><div className="art-label">EST. 2026<br/>MADE FOR WHAT'S NEXT</div></div></div>
    <div className="stats-grid"><div className="stat-card"><span className="stat-icon green">▦</span><span><small>Catalog items</small><strong>{store.products.length.toString().padStart(2, '0')}</strong><em>Products in your store</em></span></div><div className="stat-card"><span className="stat-icon peach">◇</span><span><small>Current plan</small><strong className="stat-plan">{plan.name}</strong><em>{plan.price} {plan.cadence}</em></span></div><div className="stat-card"><span className="stat-icon blue">◫</span><span><small>Site layout</small><strong className="stat-plan">{store.layout || 'Editorial'}</strong><em>{store.style} style</em></span></div></div>
    <div className="overview-columns"><section className="panel setup-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR NEXT STEPS</span><h3>Let’s get your store ready</h3></div><span className="completion-count">{complete} of {tasks.length} complete</span></div><div className="progress-track"><span style={{ width: `${(complete / tasks.length) * 100}%` }}/></div><div className="task-list">{tasks.map(([label, done, target], index) => <button className="task-row" key={label} onClick={() => navigate(target)}><span className={`task-check ${done ? 'done' : ''}`}>{done ? '✓' : String(index + 1).padStart(2, '0')}</span><span className={done ? 'task-done' : ''}>{label}</span><span className="task-arrow">→</span></button>)}</div></section>
      <section className="panel plan-summary"><div className="panel-heading"><div><span className="eyebrow">YOUR PLAN</span><h3>{plan.name} store</h3></div><span className="plan-badge">{plan.price}</span></div><p>{plan.description}</p><div className="plan-feature-list">{plan.summary.slice(0, 4).map((item) => <span key={item}><i>✓</i>{item}</span>)}</div><button className="text-action" onClick={() => navigate('plans')}>Explore all plans <span>→</span></button></section></div>
    <div className="section-line"><div><span className="eyebrow">A GOOD PLACE TO START</span><h3>Bring your storefront together</h3></div><button className="text-action" onClick={() => navigate('design')}>Open site design <span>→</span></button></div>
    <div className="quick-cards"><button onClick={() => navigate('brand')}><span className="quick-icon sand">✳</span><strong>Set up your brand</strong><small>Names, colors and story</small><i>→</i></button><button onClick={() => navigate('products')}><span className="quick-icon mint">▦</span><strong>Build your catalog</strong><small>Products and descriptions</small><i>→</i></button><button onClick={() => navigate('design')}><span className="quick-icon lavender">▧</span><strong>Choose a layout</strong><small>See your changes live</small><i>→</i></button></div>
  </div>;
}

function PageHeading({ eyebrow, title, copy, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div>{action}</div>;
}

export default function BuilderWorkspace() {
  const [route, navigate] = useStudioRoute();
  const [exportState, setExportState] = useState({ busy: false, error: '', checks: [] });
  const { store } = useBuilder();
  const goExport = async () => {
    setExportState({ busy: true, error: '', checks: [] });
    try {
      const { runPreExportChecks } = await import('./preExportChecks.js');
      const result = await runPreExportChecks(store);
      setExportState({ busy: false, error: result.passed ? '' : 'Export paused. Fix the failed checks and try again.', checks: result.checks });
      if (!result.passed) { navigate('review'); return; }
      downloadStoreZip(result.archive);
    } catch (error) {
      setExportState({ busy: false, error: `${error.message}. Check that the API server and Redis are running, then try again.`, checks: [] });
    }
  };
  const content = useMemo(() => route === 'overview' ? <Overview store={store} navigate={navigate} /> : <StudioPage route={route} onNavigate={navigate} />, [route, store, navigate]);
  return <div className="studio-shell">
    <Sidebar route={route} navigate={navigate} store={store} />
    <div className="studio-main"><Topbar route={route} navigate={navigate} store={store} onExport={goExport} busy={exportState.busy} />
      <main className="studio-content"><div className="workspace-title"><div><span className="eyebrow">{titles[route][0]}</span><h1>{titles[route][1]}</h1></div><span className="draft-indicator"><i/> Draft · {store.products.length} products</span></div>
        {content}
        {exportState.error && <p role="alert" className="export-error">{exportState.error}</p>}
        {exportState.checks.length > 0 && <div className="export-check-results" role="status"><strong>Export checks</strong>{exportState.checks.map((item) => <span key={item.id} className={`check-row ${item.status}`}><i>{item.status === 'passed' ? '✓' : item.status === 'warning' ? '!' : '×'}</i><b>{item.title}</b><small>{item.detail}</small></span>)}</div>}
        <footer className="studio-footer"><span>Minuto Mein Ecommerce Studio</span><span>Build confidently · Export intentionally</span></footer>
      </main>
    </div>
  </div>;
}

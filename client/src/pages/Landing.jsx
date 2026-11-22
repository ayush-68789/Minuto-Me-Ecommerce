// Owner: Member 4 -- Public home page at "/"
import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Logo from '../components/common/Logo';
import {
  IconAdmin, IconArrow, IconBox, IconBrush, IconCart, IconChart, IconCheck, IconShield, IconStore, IconTruck, IconUser,
} from '../components/common/Icons';
import './Landing.css';

const Hero3D = lazy(() => import('../components/three/Hero3D'));
const img = (id, w = 600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

const STEPS = [
  ['Sign up / Log in', 'Create your free account in seconds and get your own store workspace.'],
  ['Customize your store', 'Business details, logo, colors, store type, currency and the features you need.'],
  ['We save your config', 'The backend validates your choices and stores them safely in MongoDB.'],
  ['Your store is generated', 'A reusable template + your saved configuration = a unique storefront.'],
  ['Preview & publish', 'Review the design, tweak anything, then go live with one click.'],
  ['Manage & sell', 'Products, inventory, cart, orders and customers — all in one dashboard.'],
];

const MODULES = [
  [IconUser, 'User Module', 'Registration, login, roles (Customer / Store Owner / Admin) and profile settings.', '#eef2ff', '#4f46e5'],
  [IconBrush, 'Store Builder', 'Pick a template, set theme colors, upload your logo and banners.', '#fdf2f8', '#db2777'],
  [IconBox, 'Product Management', 'Add, edit and delete products with categories, stock, pricing and images.', '#ecfeff', '#0891b2'],
  [IconStore, 'Storefront', 'A public, branded store page per owner with search, filters and product pages.', '#f0fdf4', '#16a34a'],
  [IconCart, 'Cart & Checkout', 'Add to cart, order summary and secure (sandbox) payment flow.', '#fff7ed', '#ea580c'],
  [IconTruck, 'Order Management', 'Order history, live status tracking from pending to delivered.', '#f5f3ff', '#7c3aed'],
  [IconAdmin, 'Admin Panel', 'Monitor users and stores, moderate content and view platform analytics.', '#fef2f2', '#dc2626'],
];

const SHOWCASE = [
  { name: 'Nova Lifestyle', tag: 'Fashion · Modern', color: '#4f46e5', hero: '1441986300917-64674bd600d8', items: ['1542291026-7eec264c27ff', '1523275335684-37898b6baf30', '1572635196237-14b3f281503f'], to: '/store/demo' },
  { name: 'Pulse Electronics', tag: 'Tech · Bold', color: '#0f172a', hero: '1472851294608-062f824d29cc', items: ['1505740420928-5e560c06d30e', '1546868871-7041f2a55e12', '1526170375885-4d8ecf77b99f'], to: '/store/demo' },
  { name: 'Bloom Beauty', tag: 'Beauty · Minimal', color: '#db2777', hero: '1607082348824-0a96f2a4b9da', items: ['1585386959984-a4155224a1ad', '1553062407-98eeb64c6a62', '1600185365483-26d7a4cc7519'], to: '/store/demo' },
];

const ROLES = [
  ['Customer', 'Browse stores, add to cart, checkout and track every order.', ['Guest or account checkout', 'Order tracking by email', 'Wishlist & reviews'], '#22d3ee'],
  ['Store Owner', 'Build a branded store and run the whole business from one dashboard.', ['Visual store customization', 'Products & inventory', 'Orders & revenue stats'], '#a855f7'],
  ['Admin', 'Keep the platform healthy and every storefront trustworthy.', ['Manage users & stores', 'Handle reports & disputes', 'Platform-wide analytics'], '#f97316'],
];

const TECH = ['MongoDB', 'Express.js', 'React', 'Node.js', 'JWT Auth', 'bcrypt', 'Cloudinary', 'Razorpay / Stripe', 'three.js'];

export default function Landing() {
  const { user, logout } = useAuth();
  const primary = user ? { to: user.store ? '/dashboard' : '/create-store', label: user.store ? 'Open dashboard' : 'Finish store setup' } : { to: '/signup', label: 'Create your store — free' };

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <header className="hero">
        <div className="container">
          <nav className="hero-nav">
            <Logo dark />
            <div className="hero-nav-links">
              <a href="#how" className="hide-sm">How it works</a>
              <a href="#modules" className="hide-sm">Features</a>
              <Link to="/store/demo" className="hide-sm" style={{ color: 'rgba(255,255,255,.75)', textDecoration: 'none' }}>Demo store</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="btn btn-light btn-sm">Dashboard</Link>
                  <button onClick={logout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login">Log in</Link>
                  <Link to="/signup" className="btn btn-light btn-sm">Get started</Link>
                </>
              )}
            </div>
          </nav>

          <div className="hero-grid">
            <div>
              <span className="hero-pill fade-up"><b>NEW</b> Build a store with zero code</span>
              <h1 className="fade-up d1">
                One platform.<br />
                <span className="grad-text">Infinite storefronts.</span>
              </h1>
              <p className="hero-sub fade-up d2">
                Minuto Me lets anyone launch a fully branded online store in minutes — your logo, your colors, your products —
                powered by one secure, shared MERN backend.
              </p>
              <div className="hero-ctas fade-up d3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to={primary.to} className="btn btn-primary btn-lg">{primary.label} <IconArrow size={18} /></Link>
                <Link to="/store/demo" className="btn btn-glass btn-lg">View live demo store</Link>
              </div>
              <div className="hero-stats fade-up d4">
                <div><strong>3</strong><span>User roles</span></div>
                <div><strong>7</strong><span>Core modules</span></div>
                <div><strong>1</strong><span>Shared backend</span></div>
                <div><strong>∞</strong><span>Custom stores</span></div>
              </div>
            </div>

            <div className="hero-canvas">
              <Suspense fallback={null}>
                <Hero3D />
              </Suspense>
              <div className="hero-float" style={{ top: '12%', right: '2%' }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>₹1,24,580</div>
                <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 12 }}>Revenue this month · <span style={{ color: '#4ade80' }}>+32%</span></div>
              </div>
              <div className="hero-float" style={{ bottom: '10%', left: '0%', animationDelay: '1.5s' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#22d3ee,#6366f1)', display: 'grid', placeItems: 'center' }}><IconCart size={18} /></span>
                <div>
                  <div style={{ fontWeight: 700 }}>New order #A9F3</div>
                  <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 12 }}>Velocity Red Runner · just now</div>
                </div>
              </div></div>
            </div>
          </div>
        </div>
      </header>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...Array(2)].flatMap((_, k) =>
            ['Fashion', 'Electronics', 'Beauty', 'Home & Living', 'Grocery', 'Books', 'Sneakers', 'Handmade', 'Jewellery', 'Sports'].map((c) => (
              <span key={`${k}-${c}`}>✦ {c} stores</span>
            ))
          )}
        </div>
      </div>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="section">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h2 className="section-title">From sign-up to first sale in six steps</h2>
          <p className="section-sub">No developers, no plugins. Fill in a form, preview your store, and publish.</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: 44 }}>
            {STEPS.map(([title, text], i) => (
              <div key={title} className="card step lift">
                <div className="step-num">{i + 1}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SHOWCASE ---------- */}
      <section className="section showcase">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <span className="eyebrow">Templates</span>
              <h2 className="section-title">Same engine, totally different stores</h2>
              <p className="section-sub">Every store is rendered from its own saved theme — colors, logo, banners and layout.</p>
            </div>
            <Link to="/store/demo" className="btn btn-dark">Open demo store <IconArrow size={16} /></Link>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', marginTop: 44 }}>
            {SHOWCASE.map((s) => (
              <Link key={s.name} to={s.to} className="mini-store lift" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="mini-store-bar"><i /><i /><i /></div>
                <div className="mini-store-hero" style={{ backgroundImage: `linear-gradient(180deg, transparent 20%, ${s.color}ee), url(${img(s.hero, 700)})` }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{s.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>{s.tag}</div>
                  </div>
                </div>
                <div className="mini-store-grid">
                  {s.items.map((p) => <div key={p} style={{ backgroundImage: `url(${img(p, 300)})` }} />)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- MODULES ---------- */}
      <section id="modules" className="section">
        <div className="container">
          <span className="eyebrow">System modules</span>
          <h2 className="section-title">Everything a store needs, built in</h2>
          <p className="section-sub">Seven modules on one scalable, multi-tenant backend.</p>
          <div className="grid grid-auto" style={{ marginTop: 44 }}>
            {MODULES.map(([Icon, title, text, bg, fg]) => (
              <div key={title} className="card module lift">
                <div className="module-icon" style={{ background: bg, color: fg }}><Icon size={22} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
            <div className="card module" style={{ background: 'var(--grad)', color: '#fff', border: 'none' }}>
              <div className="module-icon" style={{ background: 'rgba(255,255,255,.18)' }}><IconChart size={22} /></div>
              <h3>Coming next</h3>
              <p style={{ color: 'rgba(255,255,255,.85)' }}>AI product recommendations, drag-and-drop builder, multi-language and sales analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ROLES ---------- */}
      <section className="section roles">
        <div className="container" style={{ position: 'relative' }}>
          <span className="eyebrow" style={{ color: '#c4b5fd' }}>Role-based access</span>
          <h2 className="section-title">Built for three kinds of people</h2>
          <p className="section-sub" style={{ color: 'rgba(255,255,255,.65)' }}>Secure JWT authentication with bcrypt-hashed passwords and per-role permissions.</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: 44 }}>
            {ROLES.map(([title, text, points, color]) => (
              <div key={title} className="role-card">
                <div style={{ width: 12, height: 12, borderRadius: 4, background: color, boxShadow: `0 0 24px ${color}` }} />
                <h3 style={{ fontSize: 22, margin: '18px 0 8px' }}>{title}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,.65)', fontSize: 14, lineHeight: 1.6 }}>{text}</p>
                <ul>
                  {points.map((p) => (
                    <li key={p}><span style={{ color }}><IconCheck size={18} /></span>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- TECH ---------- */}
      <section className="section" style={{ paddingBottom: 40 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="eyebrow">Tech stack</span>
          <h2 className="section-title">Powered by the MERN stack</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 28 }}>
            {TECH.map((t) => (
              <span key={t} className="tech-chip"><IconShield size={16} style={{ color: 'var(--brand)' }} />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="cta-band">
            <h2 style={{ fontSize: 'clamp(28px, 4.4vw, 48px)', letterSpacing: '-.03em', lineHeight: 1.08, margin: 0, maxWidth: 640 }}>
              Your store could be live before your coffee gets cold.
            </h2>
            <p style={{ fontSize: 17, opacity: 0.88, maxWidth: 520, margin: '16px 0 30px' }}>Sign up, customize, publish. It really is that quick.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={primary.to} className="btn btn-light btn-lg">{primary.label} <IconArrow size={18} /></Link>
              <Link to="/login" className="btn btn-glass btn-lg">Try the demo account</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 340 }}>
              <Logo dark />
              <p style={{ marginTop: 14, lineHeight: 1.6 }}>A MERN-stack multi-tenant e-commerce platform that lets anyone design and launch their own customizable storefront.</p>
            </div>
            <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                <strong style={{ color: '#fff' }}>Product</strong>
                <a href="#how">How it works</a>
                <a href="#modules">Features</a>
                <Link to="/store/demo">Demo store</Link>
              </div>
              <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                <strong style={{ color: '#fff' }}>Account</strong>
                <Link to="/signup">Sign up</Link>
                <Link to="/login">Log in</Link>
                <Link to="/dashboard">Dashboard</Link>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', marginTop: 40, paddingTop: 22, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
            <span>© 2026 Minuto Me · B.Tech CSE Project, GLA University, Mathura</span>
            <span>Amritansh Rai · Ankit Saraswat · Anushka Tiwari · Yashi Tiwari · Ayush Chaurasia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

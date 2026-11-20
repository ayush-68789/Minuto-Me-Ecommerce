// Owner: M3 -- every storefront section. The order + on/off comes from store.theme.sections,
// so the live store, the studio previews and the 3D "layers" view all render the exact same thing.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { resolveTheme, SECTIONS, storeThemeVars } from '../../theme/themeConfig';
import { subscribeNewsletter } from '../../api/storefrontApi';
import useWishlist from '../../hooks/useWishlist';
import formatCurrency from '../../utils/formatCurrency';
import HeroBanner from './HeroBanner';
import ProductGrid from './ProductGrid';
import ProductCard from './ProductCard';
import { IconArrow, IconCard, IconCheck, IconChevronLeft, IconChevronRight, IconHeart, IconSearch, IconShield, IconStar, IconTruck, IconMail } from '../common/Icons';

/* Scroll-reveal wrapper (skipped in previews and when the store turns motion off) */
export function Reveal({ as: Tag = 'section', anim, preview, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(preview || anim === 'none');
  useEffect(() => {
    if (shown || !ref.current || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), io.disconnect()), { rootMargin: '0px 0px -8% 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [shown]);
  return <Tag ref={ref} className={`${className} sf-reveal${shown ? ' in' : ''}`} {...rest}>{children}</Tag>;
}

function SectionHead({ eyebrow, title, action }) {
  return (
    <div className="sf-sec-head">
      <div>
        {eyebrow && <span className="sf-eyebrow">{eyebrow}</span>}
        <h2 className="sf-sec-title">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Marquee({ t }) {
  const items = (t.content.marquee || '').split('•').map((s) => s.trim()).filter(Boolean);
  if (!items.length) return null;
  const row = [...items, ...items, ...items];
  return (
    <div className="sf-marquee" aria-label={items.join(', ')}>
      <div className="sf-marquee-track">
        {[0, 1].map((k) => (
          <span key={k} aria-hidden={k === 1}>{row.map((s, i) => <em key={i}>{s}<b>✦</b></em>)}</span>
        ))}
      </div>
    </div>
  );
}

export function Perks({ store }) {
  return (
    <div className="sf-perks">
      <div className="container">
        <div className="sf-perk"><span className="sf-perk-icon"><IconTruck size={19} /></span><div><strong>Free delivery</strong>On every order</div></div>
        <div className="sf-perk"><span className="sf-perk-icon"><IconShield size={19} /></span><div><strong>Secure checkout</strong>Your data stays safe</div></div>
        <div className="sf-perk"><span className="sf-perk-icon"><IconCard size={19} /></span><div><strong>{store.features?.payments ? 'Pay online or COD' : 'Cash on delivery'}</strong>Flexible payments</div></div>
        <div className="sf-perk"><span className="sf-perk-icon"><IconCheck size={19} /></span><div><strong>Easy returns</strong>7-day hassle-free</div></div>
      </div>
    </div>
  );
}

function Categories({ store, products, onPick }) {
  const cats = useMemo(() => {
    const m = new Map();
    for (const p of products) {
      if (!p.category) continue;
      const c = m.get(p.category) || { name: p.category, count: 0, img: null };
      c.count += 1;
      if (!c.img && p.images?.[0]) c.img = p.images[0];
      m.set(p.category, c);
    }
    return [...m.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [products]);
  if (!cats.length) return null;
  return (
    <div className="container">
      <SectionHead eyebrow="Browse" title="Shop by category" />
      <div className="sf-cats">
        {cats.map((c, i) => (
          <button type="button" key={c.name} className={`sf-cat${i === 0 && cats.length > 2 ? ' big' : ''}`} onClick={() => onPick(c.name)}>
            {c.img ? <img src={c.img} alt="" loading="lazy" /> : <span className="img-fallback" />}
            <span className="sf-cat-label"><strong>{c.name}</strong><small>{c.count} item{c.count === 1 ? '' : 's'}</small></span>
            <span className="sf-cat-go"><IconArrow size={16} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Featured({ store, products, onAdd, preview }) {
  const ref = useRef(null);
  const list = useMemo(() => {
    const inStock = products.filter((p) => p.stock !== 0);
    const disc = (p) => (p.comparePrice > p.price ? 1 - p.price / p.comparePrice : 0);
    return [...inStock].sort((a, b) => disc(b) - disc(a) || String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 10);
  }, [products]);
  if (list.length < 2) return null;
  const by = (d) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <div className="container">
      <SectionHead
        eyebrow="Hot right now"
        title="Trending deals"
        action={
          <div className="sf-arrows">
            <button type="button" onClick={() => by(-1)} aria-label="Previous"><IconChevronLeft size={18} /></button>
            <button type="button" onClick={() => by(1)} aria-label="Next"><IconChevronRight size={18} /></button>
          </div>
        }
      />
      <div className="sf-rail" ref={ref}>
        {list.map((p, i) => <ProductCard key={p._id} product={p} store={store} onAdd={onAdd} preview={preview} index={i} />)}
      </div>
    </div>
  );
}

export function ProductsSection({ store, products, onAdd, preview, category, setCategory }) {
  const [params, setParams] = useSearchParams();
  const wish = useWishlist(store.slug);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('featured');
  const [inStock, setInStock] = useState(false);
  const wishOnly = !preview && params.get('wishlist') === '1';

  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category).filter(Boolean))], [products]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    let l = products.filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        (!term || p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term)) &&
        (!inStock || p.stock !== 0) &&
        (!wishOnly || wish.has(p._id))
    );
    if (sort === 'low') l = [...l].sort((a, b) => a.price - b.price);
    if (sort === 'high') l = [...l].sort((a, b) => b.price - a.price);
    if (sort === 'new') l = [...l].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    if (sort === 'deal') l = [...l].sort((a, b) => (b.comparePrice ? 1 - b.price / b.comparePrice : 0) - (a.comparePrice ? 1 - a.price / a.comparePrice : 0));
    return l;
  }, [products, category, q, sort, inStock, wishOnly, wish.ids]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container">
      <div className="sf-toolbar">
        <div style={{ minWidth: 0 }}>
          <SectionHead eyebrow={`${products.length} products`} title={wishOnly ? 'Your wishlist' : 'Shop all products'} />
          <div className="sf-chips">
            {categories.map((c) => (
              <button key={c} type="button" className={`sf-chip${c === category ? ' on' : ''}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
            {store.features?.wishlist && !preview && (
              <button type="button" className={`sf-chip${wishOnly ? ' on' : ''}`} onClick={() => setParams(wishOnly ? {} : { wishlist: '1' }, { replace: true })}>
                <IconHeart size={13} fill={wishOnly ? 'currentColor' : 'none'} /> Wishlist ({wish.count})
              </button>
            )}
          </div>
        </div>
        <div className="sf-filters">
          <label className="sf-search">
            <IconSearch size={17} />
            <input className="input" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
          </label>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="featured">Featured</option>
            <option value="new">Newest</option>
            <option value="deal">Biggest discount</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
          <label className="sf-check">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock
          </label>
        </div>
      </div>
      <ProductGrid products={preview ? list.slice(0, 8) : list} store={store} onAdd={onAdd} preview={preview} emptyText={wishOnly ? 'Tap the heart on any product to save it here.' : undefined} />
    </div>
  );
}

function Promo({ store, t, products, onShop }) {
  const best = useMemo(
    () => products.filter((p) => p.comparePrice > p.price && p.stock !== 0).sort((a, b) => (1 - b.price / b.comparePrice) - (1 - a.price / a.comparePrice))[0],
    [products]
  );
  const pct = best ? Math.round((1 - best.price / best.comparePrice) * 100) : 0;
  return (
    <div className="container">
      <div className="sf-promo">
        <div className="sf-promo-text">
          <span className="sf-eyebrow light">{pct ? `Save up to ${pct}%` : 'Limited time'}</span>
          <h2>{t.content.promoTitle}</h2>
          <p>{t.content.promoText}</p>
          <button type="button" className="sf-btn sf-btn-light" onClick={onShop}>Shop the sale <IconArrow size={16} /></button>
        </div>
        {best && (
          <div className="sf-promo-product">
            {best.images?.[0] && <img src={best.images[0]} alt={best.name} />}
            <span className="sf-promo-pct">-{pct}%</span>
            <div><strong>{best.name}</strong><span>{formatCurrency(best.price, store.currency)} <s>{formatCurrency(best.comparePrice, store.currency)}</s></span></div>
          </div>
        )}
      </div>
    </div>
  );
}

function Testimonials({ t }) {
  const list = (t.content.testimonials || []).filter((x) => x.text);
  if (!list.length) return null;
  return (
    <div className="container">
      <SectionHead eyebrow="Reviews" title="What our customers say" />
      <div className="sf-quotes">
        {list.map((q, i) => (
          <figure key={i} className="sf-quote">
            <div className="sf-stars">{[1, 2, 3, 4, 5].map((n) => <IconStar key={n} size={15} fill={n <= q.rating ? 'currentColor' : 'none'} />)}</div>
            <blockquote>“{q.text}”</blockquote>
            <figcaption><i>{(q.name || '?').charAt(0)}</i>{q.name}<small>Verified buyer</small></figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function About({ store, t }) {
  const img = store.branding?.banners?.[1] || store.branding?.banners?.[0];
  return (
    <div className="container">
      <div className="sf-about">
        <div className="sf-about-img" style={img ? { backgroundImage: `url(${img})` } : undefined}>
          <span className="sf-about-badge">Since {new Date(store.createdAt || Date.now()).getFullYear()}</span>
        </div>
        <div>
          <span className="sf-eyebrow">Our story</span>
          <h2 className="sf-sec-title">{t.content.aboutTitle}</h2>
          {String(t.content.aboutText).split(/\n+/).map((p, i) => <p key={i} className="sf-about-p">{p}</p>)}
          {(store.contact?.email || store.contact?.address) && (
            <p className="sf-about-meta">{[store.contact.address, store.contact.email].filter(Boolean).join(' · ')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Newsletter({ store, t, preview }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', msg: '' });
  const submit = async (e) => {
    e.preventDefault();
    if (preview) return;
    setState({ status: 'busy', msg: '' });
    try {
      const r = await subscribeNewsletter(store.slug, email.trim());
      setState({ status: 'done', msg: r?.message === 'Subscribed' ? 'You’re in! Check your inbox soon.' : r?.message || 'Subscribed' });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', msg: err?.response?.data?.message || 'Could not subscribe right now' });
    }
  };
  return (
    <div className="container">
      <div className="sf-news">
        <span className="sf-news-icon"><IconMail size={22} /></span>
        <h2 className="sf-sec-title">{t.content.newsletterTitle}</h2>
        <p>Join the {store.businessName} list for new drops, restocks and members-only offers.</p>
        {state.status === 'done' ? (
          <p className="sf-news-ok"><IconCheck size={18} /> {state.msg}</p>
        ) : (
          <form className="sf-news-form" onSubmit={submit}>
            <input className="input" type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
            <button type="submit" className="sf-btn" disabled={state.status === 'busy'}>{state.status === 'busy' ? 'Joining…' : 'Subscribe'}</button>
          </form>
        )}
        {state.status === 'error' && <p className="sf-news-err">{state.msg}</p>}
      </div>
    </div>
  );
}

/** Build the ordered list of enabled sections: [{ key, label, node }] */
export function useStoreSections({ store, products, onAdd, preview = false }) {
  const t = resolveTheme(store);
  const [category, setCategory] = useState('All');
  const scrollToProducts = () => document.getElementById(preview ? '' : 'sf-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const pickCategory = (c) => {
    setCategory(c);
    scrollToProducts();
  };

  const render = {
    hero: () => <HeroBanner store={store} products={products} onShop={scrollToProducts} preview={preview} />,
    marquee: () => <Marquee t={t} />,
    perks: () => <Perks store={store} />,
    categories: () => <Categories store={store} products={products} onPick={pickCategory} />,
    featured: () => <Featured store={store} products={products} onAdd={onAdd} preview={preview} />,
    products: () => <ProductsSection store={store} products={products} onAdd={onAdd} preview={preview} category={category} setCategory={setCategory} />,
    promo: () => <Promo store={store} t={t} products={products} onShop={() => { setCategory('All'); scrollToProducts(); }} />,
    testimonials: () => <Testimonials t={t} />,
    about: () => <About store={store} t={t} />,
    newsletter: () => <Newsletter store={store} t={t} preview={preview} />,
  };
  return t.sections.filter((s) => s.on).map((s) => ({ key: s.key, label: SECTIONS[s.key].label, node: render[s.key]() }));
}

const FLUSH = new Set(['hero', 'marquee', 'perks']);
export function StoreSections({ store, products, onAdd, preview }) {
  const t = resolveTheme(store);
  const list = useStoreSections({ store, products, onAdd, preview });
  return list.map((s) => (
    <Reveal key={s.key} id={preview ? undefined : `sf-${s.key}`} anim={t.animation} preview={preview} className={`sf-sec sf-sec-${s.key}${FLUSH.has(s.key) ? ' flush' : ''}`}>
      {s.node}
    </Reveal>
  ));
}

/* Toast is portalled to <body> (the .sf root is a CSS container, which would trap position:fixed) */
export function AddedToast({ item, store, onClose }) {
  if (!item || typeof document === 'undefined') return null;
  return createPortal(
    <div className="sf-toast" role="status" style={storeThemeVars(store)}>
      <IconCheck size={18} color="#4ade80" /> {item.name} added
      <Link to={`/store/${store.slug}/cart`} onClick={onClose}>View cart →</Link>
    </div>,
    document.body
  );
}

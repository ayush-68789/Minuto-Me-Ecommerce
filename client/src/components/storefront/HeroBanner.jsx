// Owner: M3 -- hero in 6 layouts: image | split | centered | gradient | slider | 3d
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import formatCurrency from '../../utils/formatCurrency';
import { resolveTheme } from '../../theme/themeConfig';
import { IconArrow, IconStar } from '../common/Icons';

const Showcase3D = lazy(() => import('../three/Showcase3D'));

export const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80';

function HeroText({ store, t, onShop, products }) {
  const title = t.content.heroTitle || store.businessName || 'Your store name';
  const sub = t.content.heroSubtitle || store.description || t.content._fallbackSub;
  const deal = products.reduce((m, p) => Math.max(m, p.comparePrice > p.price ? Math.round((1 - p.price / p.comparePrice) * 100) : 0), 0);
  return (
    <div className="sf-hero-text">
      <span className="sf-tag">{store.category || 'New collection'}</span>
      <h1 className="sf-hero-title">{title}</h1>
      <p className="sf-hero-sub">{sub}</p>
      <div className="sf-hero-ctas">
        <button type="button" className="sf-btn sf-btn-lg" onClick={onShop}>
          {t.content.ctaText || 'Shop now'} <IconArrow size={16} />
        </button>
        {deal > 0 && <span className="sf-hero-deal">Up to <b>{deal}% off</b></span>}
      </div>
      {products.length > 0 && (
        <div className="sf-hero-proof">
          <span className="sf-avatars">
            {products.filter((p) => p.images?.[0]).slice(0, 3).map((p) => <i key={p._id} style={{ backgroundImage: `url(${p.images[0]})` }} />)}
          </span>
          <span>
            <IconStar size={13} fill="currentColor" /> {products.length} products · {new Set(products.map((p) => p.category)).size} categories
          </span>
        </div>
      )}
    </div>
  );
}

function FloatingProduct({ product, store, className }) {
  if (!product) return null;
  return (
    <div className={`sf-float-card ${className || ''}`}>
      {product.images?.[0] && <img src={product.images[0]} alt="" />}
      <div>
        <strong>{product.name}</strong>
        <span>{formatCurrency(product.price, store.currency)}</span>
      </div>
    </div>
  );
}

export default function HeroBanner({ store, products = [], onShop, preview = false }) {
  const t = resolveTheme(store);
  const layout = t.heroLayout;
  const banners = store.branding?.banners?.filter(Boolean) || [];
  const banner = banners[0] || DEFAULT_BANNER;
  const withImg = useMemo(() => products.filter((p) => p.images?.[0]), [products]);
  const slides = useMemo(() => {
    const s = [...banners];
    for (const p of withImg) if (s.length < 3) s.push(p.images[0].replace('w=900', 'w=1800'));
    return s.length ? s : [DEFAULT_BANNER];
  }, [banners.join('|'), withImg]); // eslint-disable-line react-hooks/exhaustive-deps
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (layout !== 'slider' || slides.length < 2) return undefined;
    const id = setInterval(() => setSlide((n) => (n + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [layout, slides.length]);

  const text = <HeroText store={store} t={t} onShop={onShop} products={products} />;

  if (layout === 'split' || layout === '3d') {
    return (
      <section className="sf-hero sf-hero-split" data-layout={layout}>
        <div className="container sf-split-grid">
          {text}
          <div className="sf-split-media">
            {layout === '3d' ? (
              <div className="sf-3d-stage">
                <Suspense fallback={<div className="sf-3d-fallback" />}>
                  <Showcase3D
                    images={withImg.slice(0, 7).map((p) => p.images[0])}
                    primary={store.branding?.primaryColor || '#6366f1'}
                    accent={store.branding?.accentColor || '#f97316'}
                    dark={t.mode === 'dark'}
                    interactive={!preview}
                  />
                </Suspense>
                <span className="sf-3d-hint">{preview ? '3D product showcase' : 'Drag to spin ↔'}</span>
              </div>
            ) : (
              <>
                <div className="sf-split-img" style={{ backgroundImage: `url(${banner})` }} />
                <FloatingProduct product={withImg[0]} store={store} className="a" />
                <FloatingProduct product={withImg[1]} store={store} className="b" />
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (layout === 'gradient') {
    return (
      <section className="sf-hero sf-hero-gradient">
        <div className="sf-mesh"><i /><i /><i /></div>
        <div className="container sf-split-grid">
          {text}
          <div className="sf-stack">
            {withImg.slice(0, 3).map((p, i) => (
              <div key={p._id} className={`sf-stack-card s${i}`}>
                <img src={p.images[0]} alt="" />
                <span>{formatCurrency(p.price, store.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (layout === 'slider') {
    return (
      <section className="sf-hero sf-hero-image sf-hero-slider">
        {slides.map((src, i) => (
          <div key={src + i} className={`sf-hero-bg${i === slide ? ' on' : ''}`} style={{ backgroundImage: `url(${src})` }} />
        ))}
        <div className="sf-hero-shade" />
        <div className="container">{text}</div>
        {slides.length > 1 && (
          <div className="sf-dots">
            {slides.map((s, i) => (
              <button type="button" key={s + i} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={`sf-hero sf-hero-image${layout === 'centered' ? ' sf-hero-centered' : ''}`}>
      <div className="sf-hero-bg on" style={{ backgroundImage: `url(${banner})` }} />
      <div className="sf-hero-shade" />
      <div className="container">{text}</div>
    </section>
  );
}

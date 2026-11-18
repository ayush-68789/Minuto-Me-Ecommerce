import { useBuilder } from '../../../shared/context/BuilderContext.jsx';

function ProductCard({ product, index, accent, layout }) {
  return <article className={`preview-product preview-product-${layout.toLowerCase()}`}>
    <div className={`preview-product-image image-tone-${index % 4}`}>
      {product.imageUrl ? <img src={product.imageUrl} alt={product.name || 'Store product'} /> : <span>{(product.name || 'P').slice(0, 1).toUpperCase()}</span>}
      <span className="preview-product-quick">＋</span>
    </div>
    <div className="preview-product-meta"><span>{product.name || 'Product name'}</span><strong>${Number(product.price || 0).toFixed(2)}</strong></div>
    <small>{product.description || 'A lovely detail about this product.'}</small>
    <i style={{ backgroundColor: accent }} />
  </article>;
}

export default function PreviewPane({ layoutMode, viewport = 'desktop' }) {
  const { store } = useBuilder();
  const layout = layoutMode || store.layout || 'Editorial';
  return <div className={`store-preview theme-${(store.style || 'Natural').toLowerCase()} layout-${layout.toLowerCase()} viewport-${viewport}`} style={{ '--preview-accent': store.accent }}>
    <div className="store-preview-announcement">A LITTLE SOMETHING GOOD, JUST FOR YOU <span>FREE SHIPPING OVER $75</span></div>
    <header className="store-preview-header"><div className="store-preview-brand">{store.logoUrl && <img src={store.logoUrl} alt="" />}{store.storeName || 'Your Store'}</div><nav><span>Shop</span><span>Our story</span><span>Contact</span></nav><button aria-label="Open menu">☰</button></header>
    <main>
      <section className="store-preview-hero"><div className="store-preview-copy"><small>{store.category || 'INDEPENDENT GOODS'} · THOUGHTFULLY CHOSEN</small><h2>{store.headline || 'Make room for something lovely.'}</h2><p>{store.description || 'A considered collection for everyday living. Find your new favorite.'}</p><button>Discover the collection <span>→</span></button></div><div className="store-preview-hero-art"><div className="hero-art-circle"/><div className="hero-art-orbit"/><span>THE<br/>GOOD<br/>THINGS</span><small>NO. 01 — 2026</small></div></section>
      <section className="store-preview-products"><div className="store-preview-section-title"><div><small>THE COLLECTION</small><h3>Find your new favorite</h3></div><span>VIEW ALL <b>↗</b></span></div><div className="store-preview-product-grid">{store.products.length ? store.products.slice(0, layout === 'Grid' ? 8 : 4).map((product, index) => <ProductCard key={product.id} product={product} index={index} accent={store.accent} layout={layout} />) : [0, 1, 2, 3].map((index) => <ProductCard key={index} product={{}} index={index} accent={store.accent} layout={layout} />)}</div></section>
      <section className="store-preview-story"><span>✳</span><div><small>A NOTE FROM OUR STUDIO</small><p>“The best things are the ones you reach for every day.”</p></div></section>
    </main><footer className="store-preview-footer"><span>{store.storeName || 'YOUR STORE'}</span><span>MADE WITH INTENTION · {store.contactEmail || 'HELLO@YOURSTORE.COM'}</span></footer>
  </div>;
}

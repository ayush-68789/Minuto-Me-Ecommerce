// Owner: M3
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import useCart from '../../hooks/useCart';
import formatCurrency from '../../utils/formatCurrency';
import ProductGrid from '../../components/storefront/ProductGrid';
import { fakeRating } from '../../components/storefront/ProductCard';
import { IconShield, IconStar, IconTruck } from '../../components/common/Icons';
import { AddedToast } from '../../components/storefront/sections';

export default function ProductDetails() {
  const { productId } = useParams();
  const { store, products } = useStore();
  const { addItem } = useCart(store.slug);
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [added, setAdded] = useState(null);
  const timer = useRef();
  const product = products.find((p) => p._id === productId);

  if (!product) {
    return (
      <div className="container sf-empty">
        <h2>Product not found</h2>
        <Link to={`/store/${store.slug}`} className="sf-btn">Back to shop</Link>
      </div>
    );
  }

  const out = product.stock === 0;
  const max = Math.min(product.stock, 99);
  const discount = product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;
  const rating = fakeRating(product._id);
  const related = products.filter((p) => p._id !== product._id && p.category === product.category).slice(0, 4);

  const add = () => {
    addItem(product, qty);
    setAdded(product);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(null), 2600);
  };

  return (
    <div className="container">
      <nav className="sf-crumbs">
        <Link to={`/store/${store.slug}`}>Shop</Link> / {product.category} / <span>{product.name}</span>
      </nav>
      <div className="sf-pd">
        <div className="sf-pd-gallery">
          <div className="sf-pd-img">{product.images?.[img] ? <img src={product.images[img]} alt={product.name} className="img-cover" /> : <div className="img-cover img-fallback" />}</div>
          {product.images?.length > 1 && (
            <div className="sf-pd-thumbs">
              {product.images.map((src, i) => (
                <button type="button" key={src + i} className={i === img ? 'on' : ''} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`}>
                  <img src={src} alt="" className="img-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ alignSelf: 'center' }}>
          <span className="sf-tag" style={{ background: 'var(--s-soft)', color: 'var(--s-primary)', border: 'none' }}>{product.category}</span>
          <h1 className="sf-pd-title">{product.name}</h1>
          {store.features?.reviews && (
            <div className="sf-stars" style={{ fontSize: 14 }}>
              {[1, 2, 3, 4, 5].map((i) => <IconStar key={i} size={16} fill={i <= Math.round(rating.stars) ? 'currentColor' : 'none'} />)}
              <span>{rating.stars.toFixed(1)} · {rating.count} reviews</span>
            </div>
          )}
          <div className="sf-price" style={{ fontSize: 30, margin: '18px 0' }}>
            {formatCurrency(product.price, store.currency)}
            {discount > 0 && <><s style={{ fontSize: 18 }}>{formatCurrency(product.comparePrice, store.currency)}</s><span className="badge" style={{ background: '#dcfce7', color: '#15803d' }}>Save {discount}%</span></>}
          </div>
          <p className="sf-pd-desc">{product.description}</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: out ? '#ef4444' : product.stock <= 5 ? '#f59e0b' : '#10b981' }}>
            {out ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left — order soon` : 'In stock, ready to ship'}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
            <div className="sf-qty">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(max || 1, qty + 1))} aria-label="Increase">+</button>
            </div>
            <button type="button" className="sf-btn" disabled={out} onClick={add} style={{ flex: 1, minWidth: 160 }}>Add to cart</button>
            <button type="button" className="sf-btn sf-btn-outline" disabled={out} onClick={() => { addItem(product, qty); navigate(`/store/${store.slug}/checkout`); }}>Buy now</button>
          </div>
          <div className="sf-pd-info">
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><IconTruck size={18} color="var(--s-primary)" /> Free delivery in 3–5 business days</span>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><IconShield size={18} color="var(--s-primary)" /> 7-day easy returns · secure checkout</span>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section style={{ paddingBottom: 72 }}>
          <h2 style={{ fontSize: 24, letterSpacing: '-.02em' }}>You may also like</h2>
          <ProductGrid products={related} store={store} onAdd={(p) => { addItem(p, 1); setAdded(p); }} />
        </section>
      )}
      <AddedToast item={added} store={store} onClose={() => setAdded(null)} />
    </div>
  );
}

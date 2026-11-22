// Owner: M3 -- one product tile; its look comes from the store's card style (data-card on .sf)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import formatCurrency from '../../utils/formatCurrency';
import useWishlist from '../../hooks/useWishlist';
import { IconCart, IconHeart, IconStar } from '../common/Icons';
import useAuth from '../../hooks/useAuth';

export default function ProductCard({ product, store, onAdd, preview = false, index = 0 }) {
  const wish = useWishlist(store.slug);
  const [broken, setBroken] = useState(false);
  const discount = product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;
  const out = product.stock === 0;
  const low = !out && product.stock > 0 && product.stock <= 5;
  const to = `/store/${store.slug}/product/${product._id}`;
  const { user } = useAuth();
  const navigate = useNavigate();
  const Wrap = preview ? 'div' : Link;
  const wrapProps = preview ? {} : { to };
  const liked = wish.has(product._id);
  const second = product.images?.[1];

  return (
    <article className="sf-card" style={{ '--i': index }}>
      <Wrap {...wrapProps} className="sf-card-img">
        {product.images?.[0] && !broken ? (
          <>
            <img src={product.images[0]} alt={product.name} className="img-cover main" loading="lazy" onError={() => setBroken(true)} />
            {second && <img src={second} alt="" className="img-cover alt" loading="lazy" />}
          </>
        ) : (
          <div className="img-cover img-fallback" />
        )}
        <span className="sf-badges">
          {out ? <span className="sf-badge dark">Sold out</span> : discount > 0 && <span className="sf-badge">-{discount}%</span>}
          {low && <span className="sf-badge warn">Only {product.stock} left</span>}
        </span>
      </Wrap>
      {onAdd && !out && (
        <button type="button" className="sf-quick" onClick={() => preview || user ? onAdd(product) : navigate(`/store/${store.slug}/login`, { state: { from: to } })} aria-label={`Quick add ${product.name}`}>
          <IconCart size={16} /> <span>Quick add</span>
        </button>
      )}
      {store.features?.wishlist && (
        <button type="button" className={`sf-heart${liked ? ' on' : ''}`} onClick={() => !preview && wish.toggle(product._id)} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={liked}>
          <IconHeart size={17} fill={liked ? 'currentColor' : 'none'} />
        </button>
      )}
      <div className="sf-card-body">
        <span className="sf-card-cat">{product.category}</span>
        <Wrap {...wrapProps} className="sf-card-name">{product.name}</Wrap>
        {store.features?.reviews && product.reviewCount > 0 && (
          <div className="sf-stars"><IconStar size={13} fill="currentColor" /> {Number(product.averageRating || 0).toFixed(1)}<span>({product.reviewCount})</span></div>
        )}
        <div className="sf-price">
          {formatCurrency(product.price, store.currency)}
          {discount > 0 && <s>{formatCurrency(product.comparePrice, store.currency)}</s>}
        </div>
        {onAdd && (
          <button type="button" className="sf-btn sf-btn-ghost sf-add" disabled={out} onClick={() => preview || user ? onAdd(product) : navigate(`/store/${store.slug}/login`, { state: { from: to } })}>
            {out ? 'Out of stock' : 'Add to cart'}
          </button>
        )}
      </div>
    </article>
  );
}

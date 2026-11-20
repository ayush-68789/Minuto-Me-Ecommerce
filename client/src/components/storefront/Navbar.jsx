// Owner: M3 -- announcement bar + store nav (logo left/center, sticky, mobile menu). `preview` renders inert links.
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { resolveTheme } from '../../theme/themeConfig';
import { IconCart, IconMenu, IconSearch, IconX, IconHeart } from '../common/Icons';

export function StoreLogo({ store, size }) {
  const logo = store?.branding?.logo;
  const s = size ? { width: size, height: size, fontSize: size * 0.42 } : undefined;
  return <span className="sf-logo" style={s}>{logo ? <img src={logo} alt="" className="img-cover" /> : (store?.businessName || 'S').charAt(0).toUpperCase()}</span>;
}

export function AnnouncementBar({ store }) {
  const t = resolveTheme(store);
  if (!t.showAnnouncement || !t.content.announcement) return null;
  return <div className="sf-announce">{t.content.announcement}</div>;
}

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function Navbar({ store, preview = false }) {
  const t = resolveTheme(store);
  const base = `/store/${store.slug}`;
  const { count } = useCart(store.slug);
  const [open, setOpen] = useState(false);
  const hasCats = t.sections.some((s) => s.key === 'categories' && s.on);
  const hasAbout = t.sections.some((s) => s.key === 'about' && s.on);

  // In previews every link is an inert span so clicks never leave the studio
  const A = ({ to, children, className, end, onClick }) =>
    preview ? <span className={className}>{children}</span> : onClick ? <button type="button" className={`sf-linkbtn ${className || ''}`} onClick={onClick}>{children}</button> : <NavLink to={to} end={end} className={className}>{children}</NavLink>;

  const links = (
    <>
      <A to={base} end>Shop</A>
      {hasCats && <A onClick={() => { setOpen(false); scrollTo('sf-categories'); }}>Categories</A>}
      {hasAbout && <A onClick={() => { setOpen(false); scrollTo('sf-about'); }}>About</A>}
      <A to={`${base}/orders`}>My orders</A>
    </>
  );

  const Brand = preview ? 'span' : Link;
  return (
    <>
      <AnnouncementBar store={store} />
      <nav className={`sf-nav${t.stickyNav && !preview ? ' sticky' : ''}`}>
        <div className="container sf-nav-row">
          <button type="button" className="sf-icon-btn sf-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <IconX size={20} /> : <IconMenu size={20} />}
          </button>
          <Brand {...(preview ? {} : { to: base })} className="sf-brand">
            <StoreLogo store={store} />
            <span className="sf-brand-name">{store.businessName || 'Your store'}</span>
          </Brand>
          <div className="sf-links">{links}</div>
          <div className="sf-actions">
            {!preview ? (
              <button type="button" className="sf-icon-btn hide-xs" aria-label="Search products" onClick={() => { scrollTo('sf-products'); setTimeout(() => document.querySelector('.sf-search input')?.focus(), 400); }}>
                <IconSearch size={19} />
              </button>
            ) : <span className="sf-icon-btn hide-xs"><IconSearch size={19} /></span>}
            {store.features?.wishlist && <span className="sf-icon-btn hide-xs" aria-hidden="true"><IconHeart size={19} /></span>}
            {preview ? (
              <span className="sf-cart"><IconCart size={19} /><b>2</b></span>
            ) : (
              <Link to={`${base}/cart`} className="sf-cart" aria-label={`Cart, ${count} items`}>
                <IconCart size={19} />
                {count > 0 && <b>{count}</b>}
              </Link>
            )}
          </div>
        </div>
        {open && <div className="sf-mobile-menu" onClick={(e) => e.target.tagName === 'A' && setOpen(false)}>{links}</div>}
      </nav>
    </>
  );
}

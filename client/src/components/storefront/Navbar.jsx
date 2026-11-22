// Owner: M3 -- announcement bar + store nav (logo left/center, sticky, mobile menu). `preview` renders inert links.
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { resolveTheme } from '../../theme/themeConfig';
import { IconCart, IconMenu, IconSearch, IconX, IconHeart } from '../common/Icons';
import useAuth from '../../hooks/useAuth';

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
  const navigate = useNavigate();
  // Homepage sections: scroll if we're on the homepage, otherwise go there first
  const goSection = (id) => {
    setOpen(false);
    if (document.getElementById(id)) return scrollTo(id);
    navigate(base);
    return setTimeout(() => scrollTo(id), 350);
  };
  const { count } = useCart(store.slug);
  const { user } = useAuth();
  const isStoreCustomer = user?.role === 'customer' && String(user.customerStore) === String(store?._id);
  const [open, setOpen] = useState(false);
  const hasCats = t.sections.some((s) => s.key === 'categories' && s.on);
  const hasAbout = t.sections.some((s) => s.key === 'about' && s.on);

  // In previews every link is an inert span so clicks never leave the studio
  const A = ({ to, children, className, end, onClick }) =>
    preview ? <span className={className}>{children}</span> : onClick ? <button type="button" className={`sf-linkbtn ${className || ''}`} onClick={onClick}>{children}</button> : <NavLink to={to} end={end} className={className}>{children}</NavLink>;

  const links = (
    <>
      <A to={base} end>Shop</A>
      <A to={`${base}/products`}>All products</A>
      {hasCats && <A onClick={() => goSection('sf-categories')}>Categories</A>}
      {hasAbout && <A onClick={() => goSection('sf-about')}>About</A>}
      {(!user || isStoreCustomer) ? <A to={`${base}/orders`}>My orders</A> : null}
      {!preview && (isStoreCustomer
        ? <A to={`${base}/account`}>Customer account</A>
        : user?.role === 'client'
          ? <A to="/dashboard">Store owner dashboard</A>
          : user?.role === 'customer' || !user ? <A to={`${base}/login`}>Customer sign in</A> : null)}
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
              <button type="button" className="sf-icon-btn hide-xs" aria-label="Search products" onClick={() => navigate(`${base}/products`, { state: { focusSearch: Date.now() } })}>
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

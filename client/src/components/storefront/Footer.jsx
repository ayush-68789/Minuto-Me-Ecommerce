// Owner: M3
import { Link } from 'react-router-dom';
import { StoreLogo } from './Navbar';
import { IconFacebook, IconInstagram, IconTwitter, IconWhatsapp, IconYoutube } from '../common/Icons';

const SOCIAL = [
  ['instagram', IconInstagram, (v) => (/^https?:/.test(v) ? v : `https://instagram.com/${v.replace(/^@/, '')}`)],
  ['facebook', IconFacebook, (v) => (/^https?:/.test(v) ? v : `https://facebook.com/${v}`)],
  ['twitter', IconTwitter, (v) => (/^https?:/.test(v) ? v : `https://x.com/${v.replace(/^@/, '')}`)],
  ['youtube', IconYoutube, (v) => (/^https?:/.test(v) ? v : `https://youtube.com/@${v.replace(/^@/, '')}`)],
  ['whatsapp', IconWhatsapp, (v) => `https://wa.me/${v.replace(/[^\d]/g, '')}`],
];

export default function Footer({ store, preview = false }) {
  const c = store.contact || {};
  const social = SOCIAL.filter(([k]) => store.social?.[k]);
  const base = `/store/${store.slug}`;
  const L = ({ to, children }) => (preview ? <span>{children}</span> : <Link to={to}>{children}</Link>);
  return (
    <footer className="sf-footer">
      <div className="container">
        <div className="sf-footer-grid">
          <div className="sf-footer-brand">
            <div className="sf-footer-logo"><StoreLogo store={store} /> {store.businessName || 'Your store'}</div>
            {store.description && <p>{store.description}</p>}
            {social.length > 0 && (
              <div className="sf-social">
                {social.map(([k, Icon, href]) =>
                  preview ? (
                    <span key={k}><Icon size={18} /></span>
                  ) : (
                    <a key={k} href={href(store.social[k])} target="_blank" rel="noopener noreferrer" aria-label={k}><Icon size={18} /></a>
                  )
                )}
              </div>
            )}
          </div>
          <div className="sf-footer-col">
            <strong>Shop</strong>
            <L to={base}>All products</L>
            <L to={`${base}/cart`}>Cart</L>
            <L to={`${base}/orders`}>Track orders</L>
          </div>
          <div className="sf-footer-col">
            <strong>Contact</strong>
            {c.email && (preview ? <span>{c.email}</span> : <a href={`mailto:${c.email}`}>{c.email}</a>)}
            {c.phone && (preview ? <span>{c.phone}</span> : <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>)}
            {c.address && <span>{c.address}</span>}
            {!c.email && !c.phone && !c.address && <span>We’d love to hear from you.</span>}
          </div>
        </div>
        <div className="sf-footer-bottom">
          <span>© {new Date().getFullYear()} {store.businessName}</span>
          <span>Powered by {preview ? 'Minuto Me' : <Link to="/">Minuto Me</Link>}</span>
        </div>
      </div>
    </footer>
  );
}

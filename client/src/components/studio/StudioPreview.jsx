// Owner: Member 5 -- live preview of a draft using the real storefront components (inert links, no network).
// The storefront CSS uses container queries, so the phone frame shows the real mobile layout.
import { useMemo } from 'react';
import useStoreTheme from '../../hooks/useStoreTheme';
import Navbar from '../storefront/Navbar';
import Footer from '../storefront/Footer';
import { StoreSections } from '../storefront/sections';
import { previewProducts } from '../../demo';
import '../storefront/storefront.css';

const noop = () => {};

export const DEVICES = [
  ['desktop', 'Desktop'],
  ['mobile', 'Phone'],
];

export function DeviceToggle({ device, onChange }) {
  return (
    <div className="st-seg st-seg-sm" role="radiogroup" aria-label="Preview size">
      {DEVICES.map(([id, label]) => (
        <button key={id} type="button" role="radio" aria-checked={device === id} className={device === id ? 'on' : ''} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function StudioPreview({ draft, products, device = 'desktop', compact = false }) {
  // Previews always have a slug so cart/wishlist hooks have a key; "preview" never collides with a real store
  const store = useMemo(() => ({ ...draft, slug: draft.slug || 'preview', createdAt: draft.createdAt || new Date().toISOString() }), [draft]);
  const items = previewProducts(products);
  const theme = useStoreTheme(store);

  return (
    <div className={`st-preview st-preview-${device}${compact ? ' compact' : ''}`}>
      <div className="st-browser">
        <div className="st-browser-bar" aria-hidden="true">
          <i /><i /><i />
          <span>{`minuto.me/store/${store.slug}`}</span>
        </div>
        <div className="st-browser-body">
          <div className="sf" {...theme.attrs} style={theme.style}>
            <Navbar store={store} preview />
            <main className="sf-body">
              <StoreSections store={store} products={items} onAdd={noop} preview />
            </main>
            <Footer store={store} preview />
          </div>
        </div>
      </div>
      {!products?.length && <p className="st-preview-note">Showing sample products until you add your own.</p>}
    </div>
  );
}

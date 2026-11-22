// Owner: Member 5 -- demo data entry point
import { DEMO_SLUG, DEMO_STORE } from './demoStore';
import { DEMO_PRODUCTS } from './demoProducts';

export { DEMO_SLUG, DEMO_STORE, DEMO_PRODUCTS };

export const isDemoSlug = (slug) => String(slug || '').toLowerCase() === DEMO_SLUG;

// Same shape as GET /api/storefront/:slug
export const getDemoStorefront = () => ({ store: DEMO_STORE, products: DEMO_PRODUCTS });

// Studio previews of a brand-new store show these until the merchant adds real products
export const previewProducts = (products) => (products?.length ? products : DEMO_PRODUCTS);

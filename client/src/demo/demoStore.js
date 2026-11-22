// Owner: Member 5 -- the built-in demo store. Rendered entirely on the client so /store/demo always works.
import { BANNERS } from '../theme/themeConfig';

export const DEMO_SLUG = 'demo';

export const DEMO_STORE = {
  _id: 'demo-store',
  isDemo: true,
  businessName: 'Nova Lifestyle',
  slug: DEMO_SLUG,
  description: 'Sneakers, tech and everyday accessories, picked by hand and shipped fast.',
  category: 'Fashion',
  currency: 'INR',
  status: 'active',
  template: 'modern',
  branding: {
    logo: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#eef2ff',
    accentColor: '#f97316',
    banners: [BANNERS[0], BANNERS[6]],
  },
  theme: {
    preset: 'aurora',
    mode: 'light',
    font: 'jakarta',
    radius: 'round',
    buttonStyle: 'gradient',
    cardStyle: 'shadow',
    heroLayout: 'image',
    showAnnouncement: true,
    sections: [
      { key: 'hero', on: true },
      { key: 'marquee', on: true },
      { key: 'perks', on: true },
      { key: 'categories', on: true },
      { key: 'featured', on: true },
      { key: 'products', on: true },
      { key: 'promo', on: true },
      { key: 'testimonials', on: true },
      { key: 'about', on: true },
      { key: 'newsletter', on: true },
    ],
    content: {
      heroTitle: 'Step into the new season',
      heroSubtitle: 'Sneakers, tech and everyday essentials, picked by hand and delivered fast.',
      ctaText: 'Shop the collection',
    },
  },
  contact: { email: 'hello@novalifestyle.demo', phone: '+91 98765 43210', address: 'Bengaluru, India' },
  social: { instagram: '@novalifestyle', twitter: '', facebook: '', youtube: '', whatsapp: '' },
  features: { wishlist: true, reviews: true, payments: false },
  createdAt: '2024-03-01T00:00:00.000Z',
};

export default DEMO_STORE;

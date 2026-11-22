// Owner: Member 5 -- products for the built-in demo store (/store/demo) and studio previews of empty stores
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;
const day = (n) => new Date(Date.UTC(2026, 9, 1) - n * 86400000).toISOString();

export const DEMO_PRODUCTS = [
  { _id: 'demo-p1', name: 'Air Runner Sneakers', category: 'Footwear', price: 3499, comparePrice: 4999, stock: 24, images: [img('1542291026-7eec264c27ff'), img('1600185365483-26d7a4cc7519')], description: 'Featherlight everyday runners with a cushioned sole and breathable knit upper.' },
  { _id: 'demo-p2', name: 'Classic Chrono Watch', category: 'Accessories', price: 5999, comparePrice: 7499, stock: 8, images: [img('1523275335684-37898b6baf30')], description: 'A minimal stainless steel chronograph that goes from desk to dinner.' },
  { _id: 'demo-p3', name: 'Retro Sunglasses', category: 'Accessories', price: 1299, comparePrice: 1999, stock: 40, images: [img('1572635196237-14b3f281503f')], description: 'UV400 lenses in a timeless round frame.' },
  { _id: 'demo-p4', name: 'Studio Wireless Headphones', category: 'Electronics', price: 7999, comparePrice: 9999, stock: 12, images: [img('1505740420928-5e560c06d30e')], description: 'Active noise cancelling, 40-hour battery and plush memory-foam cushions.' },
  { _id: 'demo-p5', name: 'Smart Fitness Watch', category: 'Electronics', price: 4499, comparePrice: 0, stock: 3, images: [img('1546868871-7041f2a55e12')], description: 'Heart rate, sleep and workout tracking with a week of battery life.' },
  { _id: 'demo-p6', name: 'Instant Film Camera', category: 'Electronics', price: 6499, comparePrice: 6999, stock: 0, images: [img('1526170375885-4d8ecf77b99f')], description: 'Print memories in seconds. Back in stock soon.' },
  { _id: 'demo-p7', name: 'Amber Eau de Parfum', category: 'Beauty', price: 2799, comparePrice: 3499, stock: 18, images: [img('1585386959984-a4155224a1ad')], description: 'Warm amber, vanilla and sandalwood. 50 ml.' },
  { _id: 'demo-p8', name: 'Everyday Canvas Backpack', category: 'Bags', price: 2199, comparePrice: 2999, stock: 15, images: [img('1553062407-98eeb64c6a62')], description: 'Water-resistant canvas with a padded 15" laptop sleeve.' },
  { _id: 'demo-p9', name: 'Court Low Sneakers', category: 'Footwear', price: 2999, comparePrice: 0, stock: 30, images: [img('1600185365483-26d7a4cc7519'), img('1542291026-7eec264c27ff')], description: 'Clean leather low-tops that go with everything.' },
].map((p, i) => ({ ...p, isActive: true, createdAt: day(i * 3) }));

export default DEMO_PRODUCTS;

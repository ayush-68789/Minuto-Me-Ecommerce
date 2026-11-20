// Sample products used to prefill new store setup and demo API data.
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;
const daysAgo = (d, h = 0) => new Date(Date.now() - (d * 24 + h) * 3600 * 1000).toISOString();

const STORE_ID = '64a000000000000000000002';

const P = (n, name, category, price, comparePrice, stock, photo, description, age, isActive = true) => ({
  _id: `64a0000000000000000001${String(n).padStart(2, '0')}`,
  store: STORE_ID,
  name,
  category,
  price,
  comparePrice,
  stock,
  images: [img(photo)],
  description,
  isActive,
  createdAt: daysAgo(age),
  updatedAt: daysAgo(age),
});

const products = [
  P(1, 'Velocity Red Runner', 'Footwear', 4499, 5999, 24, '1542291026-7eec264c27ff', 'Featherlight running shoe with a responsive foam midsole and breathable knit upper.', 1),
  P(2, 'Aurum Classic Watch', 'Accessories', 7999, 9999, 8, '1523275335684-37898b6baf30', 'Minimal analog watch with a brushed gold case and genuine leather strap.', 2),
  P(3, 'Pulse Wireless Headphones', 'Electronics', 5999, 7499, 15, '1505740420928-5e560c06d30e', 'Over-ear headphones with active noise cancelling and 40-hour battery life.', 3),
  P(4, 'Retro Instant Camera', 'Electronics', 6499, null, 4, '1526170375885-4d8ecf77b99f', 'Shoot, print and share — instant film camera with a built-in flash.', 4),
  P(5, 'Coastline Sunglasses', 'Accessories', 1899, 2499, 40, '1572635196237-14b3f281503f', 'Polarised UV400 lenses in a lightweight acetate frame.', 5),
  P(6, 'Street Low Sneakers', 'Footwear', 3299, null, 18, '1560343090-f0409e92791a', 'Everyday low-top sneakers with a cushioned insole and grippy outsole.', 6),
  P(7, 'Duo Tone Trainers', 'Footwear', 3899, 4599, 0, '1491553895911-0055eca6402d', 'Two-tone trainers built for all-day comfort, from gym to street.', 7),
  P(8, 'Noir Eau de Parfum', 'Beauty', 2799, 3499, 22, '1585386959984-a4155224a1ad', 'A warm, woody fragrance with notes of amber, vanilla and cedar. 100ml.', 8),
  P(9, 'Fit Smartwatch S2', 'Electronics', 8999, 10999, 12, '1546868871-7041f2a55e12', 'Track workouts, heart rate and sleep with a bright AMOLED display.', 9),
  P(10, 'Studio Pro Headset', 'Electronics', 4299, null, 3, '1583394838336-acd977736f90', 'Studio-grade sound with plush memory-foam ear cushions.', 10),
  P(11, 'Urban Daypack', 'Bags', 2499, 2999, 30, '1553062407-98eeb64c6a62', 'Water-resistant 22L backpack with a padded laptop sleeve.', 11),
  P(12, 'Cloud White Kicks', 'Footwear', 3599, null, 9, '1600185365483-26d7a4cc7519', 'Clean white leather sneakers that go with everything.', 12, false),
];

const order = (n, name, email, status, method, payStatus, items, age, city) => {
  const lines = items.map(([pn, quantity]) => {
    const p = products[pn - 1];
    return { product: p._id, name: p.name, image: p.images[0], price: p.price, quantity };
  });
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  return {
    _id: `64a0000000000000000002${String(n).padStart(2, '0')}`,
    store: STORE_ID,
    customer: null,
    customerInfo: { name, email, phone: '+91 98765 43210' },
    shippingAddress: { line1: '221 MG Road', line2: '', city, state: 'Uttar Pradesh', postalCode: '281406', country: 'India' },
    items: lines,
    subtotal,
    shippingFee: 0,
    total: subtotal,
    status,
    payment: { method, status: payStatus, transactionId: payStatus === 'paid' ? `SIM-${n}A9F3C21B7` : '' },
    createdAt: daysAgo(age, n),
    updatedAt: daysAgo(age, n),
  };
};

export function seed() {
  return {
    session: null,
    users: [],
    stores: [],
    products: products.map((p) => ({ ...p })),
    orders: [
      order(1, 'Riya Sharma', 'riya@example.com', 'pending', 'online', 'unpaid', [[1, 1], [5, 2]], 0, 'Mathura'),
      order(2, 'Arjun Mehta', 'arjun@example.com', 'confirmed', 'online', 'paid', [[3, 1]], 1, 'Agra'),
      order(3, 'Sneha Gupta', 'sneha@example.com', 'shipped', 'cod', 'unpaid', [[9, 1], [11, 1]], 2, 'Delhi'),
      order(4, 'Kabir Singh', 'kabir@example.com', 'delivered', 'online', 'paid', [[2, 1]], 4, 'Noida'),
      order(5, 'Ananya Rao', 'ananya@example.com', 'delivered', 'cod', 'unpaid', [[8, 2], [6, 1]], 6, 'Lucknow'),
      order(6, 'Vikram Das', 'vikram@example.com', 'cancelled', 'cod', 'unpaid', [[4, 1]], 8, 'Jaipur'),
    ],
  };
}

export const SAMPLE_PRODUCTS = products;

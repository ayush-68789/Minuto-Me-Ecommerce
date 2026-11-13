import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const BuilderContext = createContext(null);
const starterProducts = [
  { id: 'p-1', name: 'Everyday essential', price: '38', description: 'Made for the little moments that make your day.', stock: '24', imageUrl: '' },
  { id: 'p-2', name: 'The weekend set', price: '64', description: 'A considered favorite, ready to go anywhere.', stock: '12', imageUrl: '' },
];
const defaults = {
  storeName: 'Sunday Supply', slug: 'sunday-supply', logoUrl: '', category: 'Clothing', contactEmail: 'hello@sundaysupply.com',
  headline: 'Everyday goods, thoughtfully made.', description: 'A small collection of useful things, made to make every day feel a little better.',
  accent: '#516b54', style: 'Natural', plan: 'Free',
  products: starterProducts,
  features: { auth: true, orders: true },
};

function loadInitialState() {
  try {
    const saved = JSON.parse(localStorage.getItem('commerceforge-builder') || 'null');
    return saved ? { ...defaults, ...saved, products: Array.isArray(saved.products) ? saved.products : starterProducts } : defaults;
  } catch { return defaults; }
}

export function BuilderProvider({ children }) {
  const [store, setStore] = useState(loadInitialState);
  const update = useCallback((key, value) => setStore((current) => {
    const next = { ...current, [key]: value };
    try { localStorage.setItem('commerceforge-builder', JSON.stringify(next)); } catch { /* Keep the builder usable if storage is full. */ }
    return next;
  }), []);
  const updateProduct = useCallback((id, key, value) => setStore((current) => {
    const next = { ...current, products: current.products.map((product) => product.id === id ? { ...product, [key]: value } : product) };
    try { localStorage.setItem('commerceforge-builder', JSON.stringify(next)); } catch { /* Keep the builder usable if storage is full. */ }
    return next;
  }), []);
  const addProduct = useCallback(() => setStore((current) => {
    const next = { ...current, products: [...current.products, { id: `p-${Date.now()}`, name: '', price: '', description: '', stock: '0', imageUrl: '' }] };
    try { localStorage.setItem('commerceforge-builder', JSON.stringify(next)); } catch { /* Keep the builder usable if storage is full. */ }
    return next;
  }), []);
  const removeProduct = useCallback((id) => setStore((current) => {
    const next = { ...current, products: current.products.filter((product) => product.id !== id) };
    try { localStorage.setItem('commerceforge-builder', JSON.stringify(next)); } catch { /* Keep the builder usable if storage is full. */ }
    return next;
  }), []);
  const setFeature = useCallback((key, value) => setStore((current) => {
    let features = { ...current.features, [key]: value };
    if (key === 'auth' && !value) features.orders = false;
    if (key === 'orders' && value) features.auth = true;
    const next = { ...current, features };
    try { localStorage.setItem('commerceforge-builder', JSON.stringify(next)); } catch { /* Keep the builder usable if storage is full. */ }
    return next;
  }), []);
  const value = useMemo(() => ({ store, update, updateProduct, addProduct, removeProduct, setFeature }), [store, update, updateProduct, addProduct, removeProduct, setFeature]);
  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) throw new Error('useBuilder must be used inside BuilderProvider');
  return context;
}

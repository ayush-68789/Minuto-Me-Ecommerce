import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getPlan } from '../../features/builder/planCatalog.js';

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
  features: { auth: true, orders: true, adminReports: false, inventory: false, attackDemo: false, checkout: false },
};

function loadInitialState() {
  try {
    const saved = JSON.parse(localStorage.getItem('commerceforge-builder') || 'null');
    if (!saved) return defaults;
    const plan = getPlan(saved.plan);
    const features = { ...defaults.features, ...saved.features };
    for (const key of ['adminReports', 'inventory', 'attackDemo', 'checkout']) features[key] = Boolean(plan.features[key] && features[key]);
    return { ...defaults, ...saved, plan: plan.name, features, products: Array.isArray(saved.products) ? saved.products : starterProducts };
  } catch { return defaults; }
}

export function BuilderProvider({ children }) {
  const [store, setStore] = useState(loadInitialState);
  const update = useCallback((key, value) => setStore((current) => {
    const next = { ...current, [key]: value };
    try { localStorage.setItem('commerceforge-builder', JSON.stringify(next)); } catch { /* Keep the builder usable if storage is full. */ }
    return next;
  }), []);
  const setPlan = useCallback((planName) => setStore((current) => {
    const previousPlan = getPlan(current.plan);
    const nextPlan = getPlan(planName);
    const features = { ...current.features };
    for (const key of ['adminReports', 'inventory', 'attackDemo', 'checkout']) {
      if (!nextPlan.features[key]) features[key] = false;
      else if (!previousPlan.features[key]) features[key] = true;
    }
    const next = { ...current, plan: nextPlan.name, features };
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
    if (value && ['adminReports', 'inventory', 'attackDemo', 'checkout'].includes(key) && !getPlan(current.plan).features[key]) return current;
    let features = { ...current.features, [key]: value };
    if (key === 'auth' && !value) features.orders = false;
    if (key === 'orders' && value) features.auth = true;
    const next = { ...current, features };
    try { localStorage.setItem('commerceforge-builder', JSON.stringify(next)); } catch { /* Keep the builder usable if storage is full. */ }
    return next;
  }), []);
  const value = useMemo(() => ({ store, update, setPlan, updateProduct, addProduct, removeProduct, setFeature }), [store, update, setPlan, updateProduct, addProduct, removeProduct, setFeature]);
  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) throw new Error('useBuilder must be used inside BuilderProvider');
  return context;
}

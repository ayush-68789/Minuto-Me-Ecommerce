import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getPlan } from '../../features/builder/planCatalog.js';

const BuilderContext = createContext(null);
const defaults = {
  storeName: '', slug: '', logoUrl: '', category: '', contactEmail: '',
  headline: '', description: '',
  accent: '#516b54', style: 'Natural', layout: 'Editorial', plan: 'Free', planConfirmed: false, layoutConfirmed: false,
  products: [],
  features: { auth: true, orders: true, adminReports: false, inventory: false, attackDemo: false, checkout: false, rateLimiting: false },
};

function loadInitialState(storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (!saved) return defaults;
    const plan = getPlan(saved.plan);
    const features = { ...defaults.features, ...saved.features };
    for (const key of ['adminReports', 'inventory', 'attackDemo', 'checkout']) features[key] = Boolean(plan.features[key] && features[key]);
    features.rateLimiting = Boolean(plan.features.rateLimiting);
    return { ...defaults, ...saved, plan: plan.name, features, products: Array.isArray(saved.products) ? saved.products : [] };
  } catch { return defaults; }
}

export function BuilderProvider({ children, user }) {
  const storageKey = `minuto-studio-draft:${encodeURIComponent(String(user?.id || user?.email || 'guest').toLowerCase())}`;
  const [store, setStore] = useState(() => loadInitialState(storageKey));
  const persist = useCallback((next) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep the builder usable if storage is full. */ }
  }, [storageKey]);
  const update = useCallback((key, value) => setStore((current) => {
    const next = { ...current, [key]: value };
    if (['layout', 'style', 'accent'].includes(key)) next.layoutConfirmed = true;
    persist(next);
    return next;
  }), [persist]);
  const setPlan = useCallback((planName) => setStore((current) => {
    const previousPlan = getPlan(current.plan);
    const nextPlan = getPlan(planName);
    const features = { ...current.features };
    for (const key of ['adminReports', 'inventory', 'attackDemo', 'checkout']) {
      if (!nextPlan.features[key]) features[key] = false;
      else if (!previousPlan.features[key]) features[key] = true;
    }
    features.rateLimiting = Boolean(nextPlan.features.rateLimiting);
    const next = { ...current, plan: nextPlan.name, planConfirmed: true, features };
    persist(next);
    return next;
  }), [persist]);
  const updateProduct = useCallback((id, key, value) => setStore((current) => {
    const next = { ...current, products: current.products.map((product) => product.id === id ? { ...product, [key]: value } : product) };
    persist(next);
    return next;
  }), [persist]);
  const addProduct = useCallback(() => setStore((current) => {
    const next = { ...current, products: [...current.products, { id: `p-${Date.now()}`, name: '', price: '', description: '', stock: '0', imageUrl: '' }] };
    persist(next);
    return next;
  }), [persist]);
  const removeProduct = useCallback((id) => setStore((current) => {
    const next = { ...current, products: current.products.filter((product) => product.id !== id) };
    persist(next);
    return next;
  }), [persist]);
  const setFeature = useCallback((key, value) => setStore((current) => {
    if (value && ['adminReports', 'inventory', 'attackDemo', 'checkout'].includes(key) && !getPlan(current.plan).features[key]) return current;
    let features = { ...current.features, [key]: value };
    if (key === 'auth' && !value) features.orders = false;
    if (key === 'orders' && value) features.auth = true;
    const next = { ...current, features };
    persist(next);
    return next;
  }), [persist]);
  const value = useMemo(() => ({ store, update, setPlan, updateProduct, addProduct, removeProduct, setFeature }), [store, update, setPlan, updateProduct, addProduct, removeProduct, setFeature]);
  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) throw new Error('useBuilder must be used inside BuilderProvider');
  return context;
}

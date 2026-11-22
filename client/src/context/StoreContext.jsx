// Owner: Member 5 -- loads one public store (+ its products) by slug for the storefront.
// /store/demo is served from client/src/demo so it works without a backend.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchStorefront } from '../api/storefrontApi';
import { getDemoStorefront, isDemoSlug } from '../demo';

export const StoreContext = createContext(null);

export function StoreProvider({ slug, children }) {
  const [state, setState] = useState({ store: null, products: [], loading: true, error: null });

  const load = useCallback(
    async (signal) => {
      if (isDemoSlug(slug)) {
        setState({ ...getDemoStorefront(), loading: false, error: null });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fetchStorefront(slug);
        if (signal?.cancelled) return;
        setState({ store: data.store, products: data.products || [], loading: false, error: null });
      } catch (err) {
        if (signal?.cancelled) return;
        const error = err?.response?.status === 404 ? 'not_found' : err?.response?.data?.message || 'Could not load this store. Please try again.';
        setState({ store: null, products: [], loading: false, error });
      }
    },
    [slug]
  );

  useEffect(() => {
    const signal = { cancelled: false };
    load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  const value = useMemo(() => ({ ...state, slug, isDemo: isDemoSlug(slug), refresh: () => load() }), [state, slug, load]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export default StoreContext;

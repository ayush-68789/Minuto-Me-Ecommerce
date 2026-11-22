// Owner: M3 -- loads one public store (config + products) by slug
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchStorefront } from '../api/storefrontApi';

export const StoreContext = createContext(null);

export function StoreProvider({ slug, children }) {
  const [state, setState] = useState({ store: null, products: [], loading: true, error: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchStorefront(slug)
      .then(({ store, products }) => setState({ store, products, loading: false, error: null }))
      .catch((err) =>
        setState({ store: null, products: [], loading: false, error: err?.response?.status === 404 ? 'not_found' : err?.response?.data?.message || 'Could not load this store' })
      );
  }, [slug]);

  useEffect(load, [load]);

  return <StoreContext.Provider value={{ ...state, slug, reload: load }}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

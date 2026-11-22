// Shopper wishlist, saved per store in this browser and kept in sync across components/tabs
import { useCallback, useEffect, useState } from 'react';

const KEY = 'minuto_wishlist';
const EVT = 'minuto-wishlist';

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
};

export default function useWishlist(slug) {
  const [ids, setIds] = useState(() => readAll()[slug] || []);

  useEffect(() => {
    const sync = () => setIds(readAll()[slug] || []);
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [slug]);

  const toggle = useCallback(
    (id) => {
      const all = readAll();
      const cur = new Set(all[slug] || []);
      if (cur.has(id)) cur.delete(id);
      else cur.add(id);
      all[slug] = [...cur];
      try {
        localStorage.setItem(KEY, JSON.stringify(all));
      } catch {
        /* storage blocked: keep in memory only */
      }
      setIds(all[slug]);
      window.dispatchEvent(new Event(EVT));
    },
    [slug]
  );

  return { ids, has: (id) => ids.includes(id), toggle, count: ids.length };
}

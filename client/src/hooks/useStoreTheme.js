// Owner: M3 -- turns a store's saved design into CSS variables + data attributes, and loads its fonts
import { useEffect } from 'react';
import { FONTS, googleFontsHref, resolveTheme, storeThemeAttrs, storeThemeVars } from '../theme/themeConfig';

export { storeThemeVars, storeThemeAttrs };

/** Injects a Google Fonts <link> once per font set (shared across the app). */
export function useFonts(keys) {
  const id = keys.filter((k) => FONTS[k]).sort().join(',');
  useEffect(() => {
    if (!id) return;
    const domId = `gf-${id.replace(/[^a-z,]/g, '').replace(/,/g, '-')}`;
    if (document.getElementById(domId)) return;
    const link = document.createElement('link');
    link.id = domId;
    link.rel = 'stylesheet';
    link.href = googleFontsHref(id.split(','));
    document.head.appendChild(link);
  }, [id]);
}

export default function useStoreTheme(store) {
  const t = resolveTheme(store || {});
  useFonts([t.font]);
  return { style: storeThemeVars(store || {}), attrs: storeThemeAttrs(store || {}), theme: t };
}

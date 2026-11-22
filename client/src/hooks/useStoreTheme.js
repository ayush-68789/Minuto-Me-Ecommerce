// Owner: Member 5 -- turns a store (or a studio draft) into the props for the .sf root and loads its fonts.
// Usage: const theme = useStoreTheme(store);  <div className="sf" {...theme.attrs} style={theme.style}>
import { useEffect, useMemo } from 'react';
import { googleFontsHref, resolveTheme, storeThemeAttrs, storeThemeVars } from '../theme/themeConfig';

const loaded = new Set();

/** Add a Google Fonts stylesheet once per URL (shared by the storefront and every studio preview). */
export function loadFonts(fontKeys) {
  const href = googleFontsHref(fontKeys);
  if (!href || loaded.has(href) || typeof document === 'undefined') return;
  loaded.add(href);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.storeFont = 'true';
  document.head.appendChild(link);
}

export default function useStoreTheme(store) {
  const key = store ? JSON.stringify([store.template, store.branding, store.theme, store.businessName, store.description, store.category]) : '';

  const value = useMemo(() => {
    if (!store) return { attrs: {}, style: undefined, theme: null };
    return { attrs: storeThemeAttrs(store), style: storeThemeVars(store), theme: resolveTheme(store) };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const font = value.theme?.font;
  useEffect(() => {
    if (font) loadFonts([font]);
  }, [font]);

  return value;
}

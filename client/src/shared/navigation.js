export function navigateTo(path, replace = false) {
  if (replace) window.history.replaceState({}, '', path);
  else window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

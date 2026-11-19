import { navigateTo } from '../navigation.js';

export function Link({ to, children, className, style, ...props }) {
  return (
    <a
      href={to}
      className={className}
      style={style}
      onClick={(e) => {
        if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault();
          navigateTo(to);
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export function useNavigate() {
  return (to, options) => {
    navigateTo(to, options?.replace);
  };
}

export function useParams() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'orders' && parts[1]) {
    return { id: parts[1] };
  }
  return {};
}

export default Link;

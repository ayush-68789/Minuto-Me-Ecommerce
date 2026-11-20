import { Link } from 'react-router-dom';

export default function Logo({ dark = false, to = '/' }) {
  return (
    <Link to={to} className="logo" style={{ color: dark ? '#fff' : 'var(--ink)' }}>
      <span className="logo-mark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 18V6l7 6 7-6v12" />
        </svg>
      </span>
      <span>
        Minuto<span className={dark ? 'grad-text' : 'grad-text-dark'}>Me</span>
      </span>
    </Link>
  );
}

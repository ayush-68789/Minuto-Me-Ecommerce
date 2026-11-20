// Owner: M1 -- split-screen shell for login / signup
import { lazy, Suspense } from 'react';
import Logo from '../../components/common/Logo';
import './auth.css';

const Hero3D = lazy(() => import('../../components/three/Hero3D'));

export function ErrorBox({ children }) {
  if (!children) return null;
  return <div className="error-box" role="alert">{children}</div>;
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="auth-form-side">
        <Logo />
        <div className="auth-form-wrap fade-up">
          <h1>{title}</h1>
          {subtitle && <p className="auth-sub">{subtitle}</p>}
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>© 2026 Minuto Me</span>
      </div>

      <aside className="auth-art">
        <div className="auth-art-canvas">
          <Suspense fallback={null}>
            <Hero3D compact />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}

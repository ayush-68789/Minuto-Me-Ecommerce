import { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../shared/context/AuthContext.jsx';
import { BuilderProvider } from '../shared/context/BuilderContext.jsx';
import { navigateTo } from '../shared/navigation.js';

const BuilderWorkspace = lazy(() => import('../features/builder/BuilderWorkspace.jsx'));
const LandingPage = lazy(() => import('../features/marketing/LandingPage.jsx'));
const AccountPage = lazy(() => import('../features/marketing/AccountPage.jsx'));

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  return pathname;
}

function LoadingScreen() {
  return <div className="app-loading"><span className="loading-mark">M</span><p>Preparing your workspace…</p></div>;
}

function RouteView() {
  const path = usePathname();
  const { status, user } = useAuth();
  useEffect(() => {
    // Keep authenticated users out of the account form even if the login
    // response and the browser history update arrive in separate renders.
    if ((path === '/login' || path === '/register') && status === 'authenticated') {
      navigateTo('/studio/overview', true);
      return;
    }
    if ((path === '/studio' || path.startsWith('/studio/')) && status === 'guest') {
      navigateTo(`/login?next=${encodeURIComponent(path)}`, true);
    }
  }, [path, status]);
  if (path === '/login' || path === '/register') return <Suspense fallback={<LoadingScreen />}><AccountPage mode={path.slice(1)} /></Suspense>;
  if (path === '/studio' || path.startsWith('/studio/')) {
    if (status === 'checking') return <LoadingScreen />;
    if (status !== 'authenticated') return <LoadingScreen />;
    return <BuilderProvider user={user}><Suspense fallback={<LoadingScreen />}><BuilderWorkspace /></Suspense></BuilderProvider>;
  }
  return <Suspense fallback={<LoadingScreen />}><LandingPage /></Suspense>;
}

export default function App() {
  return <AuthProvider><RouteView /></AuthProvider>;
}

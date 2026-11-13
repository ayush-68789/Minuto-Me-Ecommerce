import { lazy, Suspense } from 'react';
import { BuilderProvider } from '../shared/context/BuilderContext.jsx';

const BuilderWorkspace = lazy(() => import('../features/builder/BuilderWorkspace.jsx'));

function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center bg-[#f7f7f3] text-sm text-slate-500">Opening your store studio…</div>;
}

export default function App() {
  return <BuilderProvider><Suspense fallback={<LoadingScreen />}><BuilderWorkspace /></Suspense></BuilderProvider>;
}

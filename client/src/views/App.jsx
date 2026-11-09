// Owner: Shared — M2 app shell, M1 auth routes, M3 storefront, M4 admin, M5 shop.
import { Link, Route, Routes } from 'react-router-dom';

function ScaffoldPage({ title, owner, feature }) {
  return (
    <main className="page">
      <p className="eyebrow">Six-week demo scaffold · {owner}</p>
      <h1>{title}</h1>
      <p>{feature} will be implemented by its assigned owner.</p>
    </main>
  );
}

export default function App() {
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">Minuto Me</Link>
        <nav aria-label="Main navigation">
          <Link to="/onboarding">Create a store</Link>
          <Link to="/shop">Storefront</Link>
          <Link to="/dashboard">Admin</Link>
          <Link to="/login">Sign in</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<ScaffoldPage title="Commerce for your next big idea" owner="M2 / M3" feature="Store setup and storefront" />} />
        <Route path="/onboarding/*" element={<ScaffoldPage title="Create your store" owner="M2" feature="Structured store customization form" />} />
        <Route path="/shop/*" element={<ScaffoldPage title="Your storefront" owner="M3" feature="Tenant-branded product browsing" />} />
        <Route path="/dashboard/*" element={<ScaffoldPage title="Store dashboard" owner="M4" feature="Admin dashboard and product management" />} />
        <Route path="/cart/*" element={<ScaffoldPage title="Your cart" owner="M5" feature="Cart, checkout, and orders" />} />
        <Route path="/login" element={<ScaffoldPage title="Sign in" owner="M1" feature="Authentication and authorization" />} />
        <Route path="*" element={<ScaffoldPage title="Page not found" owner="Shared" feature="Route fallback" />} />
      </Routes>
    </>
  );
}

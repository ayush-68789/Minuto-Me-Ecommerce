// Owner: M3 -- /store/:slug/products: full catalog with server-side search, filters, sorting and pagination.
// Every filter lives in the URL, so results are shareable and survive back/forward.
// If the catalog API is unavailable (e.g. demo mode) it filters the products the store already loaded.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import { fetchCatalog } from '../../api/storefrontApi';
import ProductGrid from '../../components/storefront/ProductGrid';
import { AddedToast } from '../../components/storefront/sections';
import formatCurrency from '../../utils/formatCurrency';
import { IconChevronLeft, IconChevronRight, IconSearch, IconX } from '../../components/common/Icons';

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 350;

export const SORTS = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['name_asc', 'Name: A to Z'],
  ['name_desc', 'Name: Z to A'],
];

const readParams = (sp) => ({
  q: sp.get('q') || '',
  category: sp.get('category') || 'All',
  sort: SORTS.some(([k]) => k === sp.get('sort')) ? sp.get('sort') : 'newest',
  minPrice: sp.get('minPrice') || '',
  maxPrice: sp.get('maxPrice') || '',
  inStock: sp.get('inStock') === 'true',
  page: Math.max(1, parseInt(sp.get('page'), 10) || 1),
});

/** Same rules as the server's buildCatalogQuery, applied to already-loaded products. */
export function filterLocally(products, p) {
  const term = p.q.trim().toLowerCase();
  let min = p.minPrice === '' ? undefined : Number(p.minPrice);
  let max = p.maxPrice === '' ? undefined : Number(p.maxPrice);
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  let list = products.filter(
    (x) =>
      (!term || [x.name, x.description, x.category].some((f) => String(f || '').toLowerCase().includes(term))) &&
      (p.category === 'All' || x.category === p.category) &&
      (min === undefined || Number.isNaN(min) || x.price >= min) &&
      (max === undefined || Number.isNaN(max) || x.price <= max) &&
      (!p.inStock || x.stock > 0)
  );
  const by = {
    newest: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    name_asc: (a, b) => a.name.localeCompare(b.name),
    name_desc: (a, b) => b.name.localeCompare(a.name),
  }[p.sort];
  list = [...list].sort(by);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(p.page, pages);
  const prices = products.map((x) => x.price);
  return {
    products: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: list.length,
    page,
    pages,
    categories: [...new Set(products.map((x) => x.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    priceRange: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
  };
}

/** 1 … 4 5 6 … 12 */
function pageList(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ['gap', n] : [n]));
}

function Pager({ page, pages, onPage }) {
  if (pages < 2) return null;
  return (
    <nav className="sf-pager" aria-label="Pagination">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <IconChevronLeft size={16} />
      </button>
      {pageList(page, pages).map((n, i) =>
        n === 'gap' ? (
          <span key={`gap-${i}`} className="sf-pager-gap">…</span>
        ) : (
          <button key={n} type="button" className={n === page ? 'on' : ''} aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}>
            {n}
          </button>
        )
      )}
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
        <IconChevronRight size={16} />
      </button>
    </nav>
  );
}

function SkeletonGrid() {
  return (
    <div className="sf-grid" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="sf-skel-card">
          <span className="sf-skel img" />
          <span className="sf-skel line" />
          <span className="sf-skel line short" />
        </div>
      ))}
    </div>
  );
}

export default function ProductList() {
  const { store, products: loaded } = useStore();
  const { addItem } = useCart(store.slug);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => readParams(sp), [sp]);
  const base = `/store/${store.slug}`;

  const [query, setQuery] = useState(params.q);
  const [priceDraft, setPriceDraft] = useState({ min: params.minPrice, max: params.maxPrice });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(null);
  const searchRef = useRef(null);
  const topRef = useRef(null);
  const toastTimer = useRef();

  // Keep the inputs in sync when the URL changes from outside (back/forward, chips)
  useEffect(() => setQuery(params.q), [params.q]);
  useEffect(() => setPriceDraft({ min: params.minPrice, max: params.maxPrice }), [params.minPrice, params.maxPrice]);

  // Navbar search icon lands here with focus in the search box
  useEffect(() => {
    if (location.state?.focusSearch) searchRef.current?.focus();
  }, [location.state]);

  useEffect(() => {
    document.title = `${params.q ? `“${params.q}” · ` : ''}Shop all · ${store.businessName || 'Store'}`;
  }, [params.q, store.businessName]);

  /** Change some params; anything but the page resets to page 1. */
  const update = (patch, { keepPage = false } = {}) => {
    const next = { ...params, ...patch };
    if (!keepPage) next.page = 1;
    const out = {};
    if (next.q) out.q = next.q;
    if (next.category !== 'All') out.category = next.category;
    if (next.sort !== 'newest') out.sort = next.sort;
    if (next.minPrice !== '') out.minPrice = next.minPrice;
    if (next.maxPrice !== '') out.maxPrice = next.maxPrice;
    if (next.inStock) out.inStock = 'true';
    if (next.page > 1) out.page = String(next.page);
    setSp(out, { replace: !keepPage });
  };

  // Debounced search-as-you-type
  useEffect(() => {
    if (query.trim() === params.q) return undefined;
    const id = setTimeout(() => update({ q: query.trim() }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load results whenever the URL params change
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchCatalog(
      store.slug,
      {
        search: params.q || undefined,
        category: params.category !== 'All' ? params.category : undefined,
        sort: params.sort,
        minPrice: params.minPrice || undefined,
        maxPrice: params.maxPrice || undefined,
        inStock: params.inStock ? 'true' : undefined,
        page: params.page,
        limit: PAGE_SIZE,
      },
      { signal: controller.signal }
    )
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.code === 'ERR_CANCELED') return;
        setResult(filterLocally(loaded, params));
        setLoading(false);
      });
    return () => controller.abort();
  }, [store.slug, params, loaded]);

  const canShop = user?.role === 'customer' && String(user.customerStore) === String(store._id);
  const onAdd = (p) => {
    if (!canShop) {
      navigate(`${base}/login`, { state: { from: `${base}/product/${p._id}` } });
      return;
    }
    addItem(p, 1);
    setAdded(p);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setAdded(null), 2600);
  };

  const goPage = (page) => {
    update({ page }, { keepPage: true });
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const applyPrice = (e) => {
    e?.preventDefault();
    update({ minPrice: priceDraft.min.trim(), maxPrice: priceDraft.max.trim() });
  };

  const categories = ['All', ...(result?.categories || [])];
  const range = result?.priceRange;
  const hasFilters = params.q || params.category !== 'All' || params.minPrice || params.maxPrice || params.inStock;
  const total = result?.total ?? 0;
  const from = total ? (result.page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(total, (result?.page || 1) * PAGE_SIZE);

  return (
    <div className="container sf-catalog" ref={topRef}>
      <nav className="sf-crumbs" aria-label="Breadcrumb">
        <Link to={base}>Home</Link> <span aria-hidden="true">/</span> <span>Shop all</span>
      </nav>

      <div className="sf-toolbar">
        <div style={{ minWidth: 0 }}>
          <div className="sf-sec-head">
            <div>
              <span className="sf-eyebrow" aria-live="polite">
                {loading && !result ? 'Loading…' : `${total} product${total === 1 ? '' : 's'}`}
              </span>
              <h1 className="sf-sec-title">{params.q ? <>Results for “{params.q}”</> : params.category !== 'All' ? params.category : 'Shop all products'}</h1>
            </div>
          </div>
          <div className="sf-chips" role="group" aria-label="Category">
            {categories.map((c) => (
              <button key={c} type="button" className={`sf-chip${c === params.category ? ' on' : ''}`} aria-pressed={c === params.category} onClick={() => update({ category: c })}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="sf-filters">
          <label className="sf-search">
            <IconSearch size={17} />
            <input ref={searchRef} className="input" type="search" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && update({ q: query.trim() })} aria-label="Search products" maxLength={100} />
          </label>
          <select className="input" value={params.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort products">
            {SORTS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <label className="sf-check">
            <input type="checkbox" checked={params.inStock} onChange={(e) => update({ inStock: e.target.checked })} /> In stock
          </label>
        </div>
      </div>

      <form className="sf-price-filter" onSubmit={applyPrice}>
        <span>Price</span>
        <input className="input" type="number" min="0" inputMode="decimal" placeholder={range ? `Min ${formatCurrency(range.min, store.currency)}` : 'Min'} value={priceDraft.min} onChange={(e) => setPriceDraft((d) => ({ ...d, min: e.target.value }))} aria-label="Minimum price" />
        <span aria-hidden="true">–</span>
        <input className="input" type="number" min="0" inputMode="decimal" placeholder={range ? `Max ${formatCurrency(range.max, store.currency)}` : 'Max'} value={priceDraft.max} onChange={(e) => setPriceDraft((d) => ({ ...d, max: e.target.value }))} aria-label="Maximum price" />
        <button type="submit" className="sf-btn sf-btn-ghost">Apply</button>
        {hasFilters && (
          <button type="button" className="sf-linkbtn sf-clear" onClick={() => { setQuery(''); setSp({}, { replace: true }); }}>
            <IconX size={14} /> Clear all
          </button>
        )}
      </form>

      <div className={`sf-results${loading && result ? ' busy' : ''}`} aria-busy={loading}>
        {loading && !result ? (
          <SkeletonGrid />
        ) : (
          <ProductGrid
            products={result?.products || []}
            store={store}
            onAdd={onAdd}
            emptyText={hasFilters ? 'Nothing matches these filters. Try a different search or clear the filters.' : 'This store has no products yet.'}
          />
        )}
      </div>

      {total > 0 && (
        <div className="sf-catalog-foot">
          <span className="muted">Showing {from}–{to} of {total}</span>
          <Pager page={result.page} pages={result.pages} onPage={goPage} />
        </div>
      )}

      <AddedToast item={added} store={store} onClose={() => setAdded(null)} />
    </div>
  );
}

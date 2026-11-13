import { useBuilder } from '../../../shared/context/BuilderContext.jsx';

function ProductTile({ product, index, accent }) {
  const colors = ['#e8e4dc', '#e2e8df', '#eee2dc', '#e7e8ed'];
  return <article className="min-w-0"><div className="relative aspect-[.88] overflow-hidden rounded-xl" style={{ backgroundColor: colors[index % colors.length] }}>{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center"><span className="font-display text-3xl font-medium text-black/10">{(product.name || 'P').slice(0, 1).toUpperCase()}</span></div>}</div><div className="mt-2"><p className="truncate text-[11px] font-semibold text-slate-800">{product.name || 'Your product'}</p><p className="mt-1 text-[10px] text-slate-500">${Number(product.price || 0).toFixed(2)}</p><span className="mt-2 inline-block rounded-full px-2 py-1 text-[8px] font-semibold text-white" style={{ backgroundColor: accent }}>In stock</span></div></article>;
}

export default function PreviewPane() {
  const { store } = useBuilder();
  const stylePresets = {
    Natural: { surface: '#fffefa', ink: '#1e2820', muted: '#6f796f' },
    Modern: { surface: '#f4f6f5', ink: '#17211d', muted: '#66716b' },
    Luxury: { surface: '#fbf7f1', ink: '#30231e', muted: '#82756c' },
    Colorful: { surface: '#fff9e9', ink: '#2b2518', muted: '#776d55' },
    Professional: { surface: '#f6f8f7', ink: '#202928', muted: '#68716f' },
    Dark: { surface: '#202522', ink: '#f5f3ed', muted: '#bdc4bc' },
  };
  const preset = stylePresets[store.style] || stylePresets.Natural;
  return <section className="overflow-hidden rounded-2xl border border-[#e7e8e1] bg-white shadow-sm xl:sticky xl:top-[94px]"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">Live preview</p><p className="mt-0.5 text-xs font-semibold text-slate-700">Your storefront</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-500">{store.style}</span></div>
    <div className="p-3 sm:p-4"><div className="overflow-hidden rounded-xl border border-slate-100" style={{ backgroundColor: preset.surface, color: preset.ink }}>
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-3"><span className="font-display flex items-center gap-2 text-xs font-bold" style={{ color: store.accent }}>{store.logoUrl && <img src={store.logoUrl} alt="" className="h-5 max-w-16 object-contain" />} {store.storeName || 'Your Store'}</span><div className="flex gap-3 text-[8px] text-slate-500"><span>Shop</span>{store.features.orders && <span>Orders</span>}{store.features.auth && <span>Account</span>}</div></div>
      <div className="px-4 pb-5 pt-6 sm:px-6 sm:pb-7"><p className="text-[8px] font-bold uppercase tracking-[.2em]" style={{ color: store.accent }}>{store.category} · EST. 2026</p><h3 className="mt-3 max-w-sm font-display text-xl font-medium leading-tight sm:text-2xl">{store.headline || 'Your store headline goes here.'}</h3><p className="mt-2 max-w-sm text-[9px] leading-4" style={{ color: preset.muted }}>{store.description || 'A short introduction to what makes your store special.'}</p><button className="mt-4 rounded-md px-3 py-2 text-[9px] font-semibold text-white" style={{ backgroundColor: store.accent }}>Explore collection <span className="ml-1">→</span></button>
        <div className="mt-6 flex items-center justify-between"><p className="font-display text-sm font-semibold">Featured pieces</p><span className="text-[8px] text-slate-400">{store.products.length} pieces</span></div><div className="mt-3 grid grid-cols-2 gap-3">{store.products.slice(0, 4).map((product, index) => <ProductTile key={product.id} product={product} index={index} accent={store.accent} />)}</div>
      </div><div className="border-t border-black/5 px-4 py-3 text-[8px] text-slate-400">© {new Date().getFullYear()} {store.storeName || 'Your Store'} · {store.contactEmail}</div>
    </div><div className="mt-3 flex items-center justify-between text-[10px] text-slate-400"><span>Preview updates as you edit</span><span className="font-mono">/{store.slug || 'your-store'}</span></div></div>
  </section>;
}

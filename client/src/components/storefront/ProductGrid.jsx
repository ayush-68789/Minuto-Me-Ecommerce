// Owner: M3
import ProductCard from './ProductCard';

export default function ProductGrid({ products, store, onAdd, preview, emptyText }) {
  if (!products.length) {
    return (
      <div className="sf-empty">
        <div style={{ fontSize: 40 }}>🛍️</div>
        <h3>No products found</h3>
        <p style={{ margin: 0 }}>{emptyText || 'Try a different search or category.'}</p>
      </div>
    );
  }
  return (
    <div className="sf-grid">
      {products.map((p, i) => (
        <ProductCard key={p._id} product={p} store={store} onAdd={onAdd} preview={preview} index={i} />
      ))}
    </div>
  );
}

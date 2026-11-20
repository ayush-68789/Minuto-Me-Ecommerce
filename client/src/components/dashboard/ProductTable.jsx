// Owner: M2 - Products & Dashboard
import React from 'react';
import { formatCurrency } from '../../utils/validators';

export default function ProductTable({
  products = [],
  currency = 'USD',
  onEdit,
  onDelete,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--dash-muted)' }}>
        Loading products…
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--dash-muted)' }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>No products found</p>
        <p style={{ margin: '8px 0 0', fontSize: 14 }}>Add your first product to get started selling.</p>
      </div>
    );
  }

  const getStockBadge = (stock) => {
    if (stock === 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (stock <= 5) return <span className="badge badge-warning">Low ({stock})</span>;
    return <span className="badge badge-success">{stock} in stock</span>;
  };

  const getStatusBadge = (status) => {
    if (status === 'active') return <span className="badge badge-success">Active</span>;
    if (status === 'draft') return <span className="badge badge-neutral">Draft</span>;
    return <span className="badge badge-neutral">{status}</span>;
  };

  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const img = p.imageUrl || (p.images && p.images[0]) || '';
            return (
              <tr key={p._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          objectFit: 'cover',
                          background: '#e2e8f0',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: '#e2e8f0',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 18,
                        }}
                      >
                        📦
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.sku && (
                        <div style={{ fontSize: 12, color: 'var(--dash-muted)' }}>
                          SKU: {p.sku}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>{p.category || 'General'}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(p.price, currency)}</td>
                <td>{getStockBadge(p.stock)}</td>
                <td>{getStatusBadge(p.status)}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '5px 10px', fontSize: 13 }}
                      onClick={() => onEdit && onEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => onDelete && onDelete(p._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Owner: M2 - Products & Dashboard
import React from 'react';
import { Link } from 'react-router-dom';

export default function LowStockBanner({ lowStockItems = [] }) {
  if (!lowStockItems || lowStockItems.length === 0) return null;

  return (
    <div
      style={{
        background: '#fffbeb',
        border: '1px solid #fef3c7',
        borderLeft: '4px solid #f59e0b',
        borderRadius: 8,
        padding: '14px 18px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 600, color: '#92400e', fontSize: 14 }}>
            Low Inventory Warning
          </div>
          <div style={{ fontSize: 13, color: '#b45309' }}>
            {lowStockItems.length === 1
              ? `"${lowStockItems[0].name}" has only ${lowStockItems[0].stock} units left.`
              : `${lowStockItems.length} products are running critically low on stock.`}
          </div>
        </div>
      </div>
      <Link
        to="/dashboard/products"
        className="btn-secondary"
        style={{ fontSize: 13, padding: '6px 12px' }}
      >
        Manage Stock
      </Link>
    </div>
  );
}

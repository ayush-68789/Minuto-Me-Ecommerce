// Owner: M2 - Products & Dashboard
import React from 'react';
import { formatCurrency } from '../../utils/validators';

export default function SalesChart({ trends = [], currency = 'USD' }) {
  const maxRevenue = trends.reduce((max, t) => Math.max(max, t.revenue), 100);

  return (
    <div className="chart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16 }}>Weekly Revenue Performance</h4>
          <span style={{ fontSize: 13, color: 'var(--dash-muted)' }}>Daily revenue over the past 7 days</span>
        </div>
      </div>
      <div className="chart-bars">
        {trends.map((t) => {
          const heightPercent = Math.max(12, Math.round((t.revenue / maxRevenue) * 100));
          return (
            <div key={t.day} className="chart-bar-col">
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dash-muted)' }}>
                {formatCurrency(t.revenue, currency)}
              </span>
              <div
                className="chart-bar-fill"
                style={{ height: `${heightPercent}%` }}
                title={`${t.day}: ${formatCurrency(t.revenue, currency)} (${t.orders} orders)`}
              />
              <span className="chart-bar-label">{t.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

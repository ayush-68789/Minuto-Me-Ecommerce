// Owner: M2 - Products & Dashboard
import React from 'react';

export default function StatCard({ title, value, subtitle, icon, trend, isPositive = true }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span>{title}</span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div className="stat-value">{value}</div>
      {(subtitle || trend) && (
        <div className="stat-footer">
          {trend && (
            <span className={isPositive ? 'stat-trend-up' : 'badge-danger'}>
              {trend}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

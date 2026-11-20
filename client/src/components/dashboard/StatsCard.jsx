// Owner: M4
import React from 'react';

export default function StatsCard({
  title,
  value,
  subtitle,
  badgeText,
  badgeType = 'neutral', // 'positive' | 'warning' | 'danger' | 'neutral'
  icon,
  accentColor = '#3b82f6',
}) {
  const badgeStyles = {
    positive: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    warning: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    danger: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    neutral: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
  };

  const currentBadge = badgeStyles[badgeType] || badgeStyles.neutral;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        padding: '22px 24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 20px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Top Accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: accentColor,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#64748b',
            }}
          >
            {title}
          </span>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0f172a',
              marginTop: '4px',
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: `${accentColor}15`,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        {subtitle && (
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {subtitle}
          </span>
        )}
        {badgeText && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '9999px',
              backgroundColor: currentBadge.bg,
              color: currentBadge.text,
              border: `1px solid ${currentBadge.border}`,
            }}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

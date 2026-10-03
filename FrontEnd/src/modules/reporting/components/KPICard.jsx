import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';

export default function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  iconBg = 'rgba(59, 130, 246, 0.15)',
  iconColor = '#3b82f6',
  accentColor = '#3b82f6',
  trend = null, // { direction: 'up' | 'down' | 'neutral', label: '+12%', sub: 'vs last 30d' }
  badge = null,
  sparkline = null, // [12, 18, 14, 22, 28, 24, 30]
  isLive = false,
  onClick = null,
  loading = false
}) {
  return (
    <div
      className="glass-panel"
      onClick={onClick}
      style={{
        padding: '20px',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderTop: `3px solid ${accentColor}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '145px',
        boxShadow: '0 8px 24px -6px rgba(0,0,0,0.06)'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 14px 28px -6px ${accentColor}33`;
          e.currentTarget.style.borderColor = accentColor;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(0,0,0,0.06)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
        }
      }}
    >
      {/* Background Accent Glow */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: `${accentColor}11`,
        filter: 'blur(20px)',
        pointerEvents: 'none'
      }} />

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {title}
          </span>
          {isLive && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '1px 6px',
              borderRadius: '8px',
              fontSize: '0.65rem',
              fontWeight: 800,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              LIVE
            </span>
          )}
          {badge && (
            <span style={{
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: badge.bg || 'rgba(59, 130, 246, 0.15)',
              color: badge.color || '#3b82f6'
            }}>
              {badge.label}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onClick && (
            <div style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              <ArrowUpRight size={15} />
            </div>
          )}
          {Icon && (
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: iconColor,
              flexShrink: 0
            }}>
              <Icon size={19} />
            </div>
          )}
        </div>
      </div>

      {/* Main Value & Sparkline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '4px 0 8px' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {loading ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '1.4rem' }}>...</span>
          ) : (
            value ?? '0'
          )}
        </div>

        {/* Mini Sparkline SVG */}
        {sparkline && Array.isArray(sparkline) && sparkline.length > 2 && (
          <div style={{ width: '80px', height: '28px', opacity: 0.85 }}>
            <svg width="80" height="28" viewBox="0 0 80 28" style={{ overflow: 'visible' }}>
              {(() => {
                const max = Math.max(...sparkline, 1);
                const min = Math.min(...sparkline, 0);
                const range = max - min || 1;
                const pts = sparkline.map((val, i) => {
                  const x = (i / (sparkline.length - 1)) * 76 + 2;
                  const y = 26 - ((val - min) / range) * 22;
                  return `${x},${y}`;
                }).join(' ');
                return (
                  <polyline
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pts}
                  />
                );
              })()}
            </svg>
          </div>
        )}
      </div>

      {/* Bottom Subtext & Trend Delta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '0.78rem' }}>
        {subtext && (
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
            {subtext}
          </span>
        )}
        {trend && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '6px',
            background: trend.direction === 'up' ? 'rgba(16, 185, 129, 0.12)' : trend.direction === 'down' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(148, 163, 184, 0.12)',
            color: trend.direction === 'up' ? 'var(--color-success, #10b981)' : trend.direction === 'down' ? 'var(--color-danger, #ef4444)' : 'var(--text-muted)'
          }}>
            {trend.direction === 'up' && <TrendingUp size={12} />}
            {trend.direction === 'down' && <TrendingDown size={12} />}
            {trend.direction === 'neutral' && <Minus size={12} />}
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}

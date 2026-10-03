import React from 'react';

export default function RadialGaugeChart({
  value = 0, // 0 to 100
  title = 'SLA Target',
  subtitle = 'Target >= 90%',
  size = 170,
  strokeWidth = 14,
  targetValue = 90
}) {
  const normalizedValue = Math.min(Math.max(Number(value) || 0, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  let gaugeColor = '#10b981'; // Green
  let statusText = 'Optimal';
  if (normalizedValue < 70) {
    gaugeColor = '#ef4444'; // Red
    statusText = 'Critical Risk';
  } else if (normalizedValue < targetValue) {
    gaugeColor = '#f59e0b'; // Amber
    statusText = 'At Risk';
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Target Marker Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(148, 163, 184, 0.3)"
            strokeWidth={strokeWidth}
            strokeDasharray={`2 ${circumference / 20}`}
          />
          {/* Active Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease'
            }}
          />
        </svg>

        {/* Center Content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            fontSize: '1.7rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1
          }}>
            {normalizedValue}%
          </div>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: gaugeColor,
            marginTop: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {statusText}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>}
      </div>
    </div>
  );
}

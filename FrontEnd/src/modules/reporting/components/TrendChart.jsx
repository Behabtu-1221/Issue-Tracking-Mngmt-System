import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, BarChart2, TrendingUp, Layers } from 'lucide-react';

export default function TrendChart({
  data = [],
  title = 'Incident Volume & Resolution Velocity',
  subtitle = 'Daily volume trend and completion rate comparison',
  height = 260
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activeSeries, setActiveSeries] = useState({
    total: true,
    resolved: true,
    critical: true
  });
  const [chartView, setChartView] = useState('area'); // 'area' | 'bar'

  const toggleSeries = (key) => {
    setActiveSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, index) => ({
      index,
      date: d.PeriodDate || `Day ${index + 1}`,
      total: Number(d.TotalCount) || 0,
      resolved: Number(d.ResolvedCount) || 0,
      critical: Number(d.CriticalCount) || 0
    }));
  }, [data]);

  const maxVal = useMemo(() => {
    if (chartData.length === 0) return 10;
    const max = Math.max(...chartData.map(d => Math.max(
      activeSeries.total ? d.total : 0,
      activeSeries.resolved ? d.resolved : 0,
      activeSeries.critical ? d.critical : 0
    )));
    return max > 0 ? Math.ceil(max * 1.25) : 10;
  }, [chartData, activeSeries]);

  const padding = { top: 20, right: 20, bottom: 40, left: 35 };
  const width = 640;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (chartData.length === 0) return { total: '', resolved: '', critical: '', area: '', raw: [] };
    const step = chartData.length > 1 ? plotWidth / (chartData.length - 1) : plotWidth;

    const totalPts = chartData.map((d, i) => {
      const x = padding.left + (chartData.length === 1 ? plotWidth / 2 : i * step);
      const y = padding.top + plotHeight - (d.total / maxVal) * plotHeight;
      return { x, y, ...d };
    });

    const resolvedPts = chartData.map((d, i) => {
      const x = padding.left + (chartData.length === 1 ? plotWidth / 2 : i * step);
      const y = padding.top + plotHeight - (d.resolved / maxVal) * plotHeight;
      return { x, y, ...d };
    });

    const criticalPts = chartData.map((d, i) => {
      const x = padding.left + (chartData.length === 1 ? plotWidth / 2 : i * step);
      const y = padding.top + plotHeight - (d.critical / maxVal) * plotHeight;
      return { x, y, ...d };
    });

    const totalPath = totalPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const resolvedPath = resolvedPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const criticalPath = criticalPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const areaPath = totalPts.length > 0
      ? `${totalPath} L ${totalPts[totalPts.length - 1].x} ${padding.top + plotHeight} L ${totalPts[0].x} ${padding.top + plotHeight} Z`
      : '';

    return {
      total: totalPath,
      resolved: resolvedPath,
      critical: criticalPath,
      area: areaPath,
      raw: totalPts
    };
  }, [chartData, maxVal, plotWidth, plotHeight]);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', position: 'relative' }}>
      {/* Header with Title and Interactive Series Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
          {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>

        {/* Series Toggles & View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Total Toggle */}
          <button
            type="button"
            onClick={() => toggleSeries('total')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid',
              borderColor: activeSeries.total ? '#3b82f6' : 'rgba(148, 163, 184, 0.2)',
              background: activeSeries.total ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeSeries.total ? '#3b82f6' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
            Total Volume
          </button>

          {/* Resolved Toggle */}
          <button
            type="button"
            onClick={() => toggleSeries('resolved')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid',
              borderColor: activeSeries.resolved ? '#10b981' : 'rgba(148, 163, 184, 0.2)',
              background: activeSeries.resolved ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeSeries.resolved ? '#10b981' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            Resolved
          </button>

          {/* Critical Toggle */}
          <button
            type="button"
            onClick={() => toggleSeries('critical')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid',
              borderColor: activeSeries.critical ? '#ef4444' : 'rgba(148, 163, 184, 0.2)',
              background: activeSeries.critical ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: activeSeries.critical ? '#ef4444' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
            Critical (P1)
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No trend activity records available for this selected date range
        </div>
      ) : (
        <div style={{ width: '100%', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="totalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + plotHeight * (1 - ratio);
              const labelVal = Math.round(maxVal * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(148, 163, 184, 0.12)"
                    strokeDasharray={ratio === 0 ? 'none' : '3 3'}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="9.5"
                    fill="var(--text-muted)"
                    style={{ fontFamily: 'monospace' }}
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Area Fill for Total */}
            {activeSeries.total && points.area && (
              <path d={points.area} fill="url(#totalAreaGrad)" />
            )}

            {/* Total Line */}
            {activeSeries.total && points.total && (
              <path
                d={points.total}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Resolved Line */}
            {activeSeries.resolved && points.resolved && (
              <path
                d={points.resolved}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Critical Line */}
            {activeSeries.critical && points.critical && (
              <path
                d={points.critical}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Hover Crosshair Vertical Line */}
            {hoveredPoint && (
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + plotHeight}
                stroke="rgba(59, 130, 246, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            )}

            {/* Interactive Data Points & Hitboxes */}
            {points.raw.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="14"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {activeSeries.total && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.date === p.date ? '5' : '3'}
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            ))}

            {/* X-Axis Date Labels */}
            {points.raw.map((p, idx) => {
              const shouldShow = chartData.length <= 10 || idx % Math.ceil(chartData.length / 8) === 0 || idx === chartData.length - 1;
              if (!shouldShow) return null;
              return (
                <text
                  key={idx}
                  x={p.x}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="var(--text-muted)"
                  style={{ transform: 'rotate(-20deg)', transformOrigin: `${p.x}px ${height - 12}px` }}
                >
                  {p.date.length > 5 ? p.date.slice(5) : p.date}
                </text>
              );
            })}
          </svg>

          {/* Interactive Floating Tooltip */}
          {hoveredPoint && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#ffffff',
              fontSize: '0.8rem',
              boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.12)',
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontWeight: 800, color: '#93c5fd', marginBottom: '6px' }}>{hoveredPoint.date}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <span style={{ color: '#93c5fd' }}>Total Submissions:</span>
                  <strong>{hoveredPoint.total}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <span style={{ color: '#6ee7b7' }}>Resolved Tickets:</span>
                  <strong style={{ color: '#6ee7b7' }}>{hoveredPoint.resolved}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                  <span style={{ color: '#fca5a5' }}>Critical (P1):</span>
                  <strong style={{ color: '#fca5a5' }}>{hoveredPoint.critical}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

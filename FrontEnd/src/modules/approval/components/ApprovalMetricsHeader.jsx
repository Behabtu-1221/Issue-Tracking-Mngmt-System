import React from 'react';
import { CheckCircle2, Clock, XCircle, Layers, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function ApprovalMetricsHeader({ metrics, activeFilter, onFilterChange }) {
  const total = metrics?.totalApprovals || 0;
  const pending = metrics?.pendingApprovals || 0;
  const approved = metrics?.approvedApprovals || 0;
  const rejected = (metrics?.rejectedApprovals || 0) + (metrics?.returnedApprovals || 0);

  const approvedPercent = total > 0 ? Math.round((approved / total) * 100) : 0;
  const pendingPercent = total > 0 ? Math.round((pending / total) * 100) : 0;

  const cards = [
    {
      id: 'ALL',
      title: 'Total Workflows',
      value: total,
      subtext: `${approvedPercent}% overall approval rate`,
      icon: Layers,
      color: '#4f46e5',
      bgGlow: 'rgba(79, 70, 229, 0.12)',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
      accentBorder: 'rgba(79, 70, 229, 0.4)'
    },
    {
      id: 'PENDING',
      title: 'Pending Action',
      value: pending,
      subtext: `${pendingPercent}% awaiting sign-off`,
      icon: Clock,
      color: '#d97706',
      bgGlow: 'rgba(217, 119, 6, 0.12)',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      accentBorder: 'rgba(217, 119, 6, 0.4)',
      isPulse: pending > 0
    },
    {
      id: 'APPROVED',
      title: 'Approved Requests',
      value: approved,
      subtext: 'Executed & finalized',
      icon: CheckCircle2,
      color: '#059669',
      bgGlow: 'rgba(5, 150, 105, 0.12)',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      accentBorder: 'rgba(5, 150, 105, 0.4)'
    },
    {
      id: 'REJECTED',
      title: 'Rejected & Returned',
      value: rejected,
      subtext: `${metrics?.rejectedApprovals || 0} Rejected • ${metrics?.returnedApprovals || 0} Returned`,
      icon: XCircle,
      color: '#dc2626',
      bgGlow: 'rgba(220, 38, 38, 0.12)',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      accentBorder: 'rgba(220, 38, 38, 0.4)'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
      gap: '18px',
      marginBottom: '28px'
    }}>
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = activeFilter === c.id;

        return (
          <div
            key={c.id}
            onClick={() => onFilterChange && onFilterChange(c.id)}
            style={{
              background: 'var(--glass-bg)',
              border: isSelected ? `2px solid ${c.color}` : '1px solid var(--glass-border)',
              borderRadius: '18px',
              padding: '22px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isSelected
                ? `0 8px 24px ${c.bgGlow}`
                : 'var(--shadow-lg)',
              backdropFilter: 'blur(16px)',
              position: 'relative',
              overflow: 'hidden'
            }}
            className="hover-card-elevate"
          >
            {/* Top Glow Accent Bar */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '3px',
              background: c.gradient,
              opacity: isSelected ? 1 : 0.6
            }} />

            {/* Background Radial Light Effect */}
            <div style={{
              position: 'absolute',
              top: '-30px', right: '-30px',
              width: '100px', height: '100px',
              borderRadius: '50%',
              background: c.bgGlow,
              filter: 'blur(30px)',
              pointerEvents: 'none'
            }} />

            {/* Title & Icon Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.2px' }}>
                  {c.title}
                </span>
                {c.isPulse && (
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#f59e0b',
                    boxShadow: '0 0 10px #f59e0b',
                    animation: 'pulse 1.5s infinite'
                  }} />
                )}
              </div>

              <div style={{
                width: '40px', height: '40px',
                borderRadius: '12px',
                background: c.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
                boxShadow: `0 4px 12px ${c.bgGlow}`
              }}>
                <Icon size={20} />
              </div>
            </div>

            {/* Metric Value */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1 }}>
                {c.value}
              </div>
            </div>

            {/* Subtext & Progress Bar */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              {c.subtext}
            </div>

            {/* Subtle Progress Bar */}
            <div style={{
              width: '100%', height: '4px',
              background: 'var(--glass-border)',
              borderRadius: '2px',
              marginTop: '12px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${c.id === 'ALL' ? 100 : c.id === 'APPROVED' ? approvedPercent : c.id === 'PENDING' ? pendingPercent : 15}%`,
                height: '100%',
                background: c.gradient,
                borderRadius: '2px',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

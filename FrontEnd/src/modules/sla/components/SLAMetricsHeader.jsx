import React from 'react';
import { Clock, ShieldCheck, AlertTriangle, AlertCircle, TrendingUp, Layers } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function SLAMetricsHeader({ metrics, activeFilter, onFilterChange }) {
  const { t } = useTranslation();
  const total = metrics?.totalMonitoredClocks || 0;
  const compliancePercent = metrics?.compliancePercent || 100;
  const responseBreaches = metrics?.responseBreachesCount || 0;
  const resolutionBreaches = metrics?.resolutionBreachesCount || 0;

  const cards = [
    {
      id: 'ALL',
      title: t('sla.metrics.monitoredClocks', 'Monitored SLA Clocks'),
      value: total,
      subtext: t('sla.metrics.monitoredSub', 'Active service level targets'),
      icon: Clock,
      color: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.15)',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    },
    {
      id: 'COMPLIANCE',
      title: t('sla.metrics.complianceRate', 'SLA Compliance Rate'),
      value: `${compliancePercent}%`,
      subtext: t('sla.metrics.complianceSub', '{count} Clocks Within Target').replace('{count}', metrics?.compliantClocks || 0),
      icon: ShieldCheck,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      id: 'RESPONSE_BREACH',
      title: t('sla.metrics.responseBreaches', 'Response Breaches'),
      value: responseBreaches,
      subtext: t('sla.metrics.responseBreachesSub', 'Target initial response exceeded'),
      icon: AlertTriangle,
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      isPulse: responseBreaches > 0
    },
    {
      id: 'RESOLUTION_BREACH',
      title: t('sla.metrics.resolutionBreaches', 'Resolution Breaches'),
      value: resolutionBreaches,
      subtext: t('sla.metrics.resolutionBreachesSub', 'Target resolution time exceeded'),
      icon: AlertCircle,
      color: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      isPulse: resolutionBreaches > 0
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
              background: isSelected
                ? 'var(--glass-bg)'
                : 'var(--glass-bg)',
              border: isSelected ? `2px solid ${c.color}` : '1px solid var(--glass-border)',
              borderRadius: '18px',
              padding: '22px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isSelected
                ? `0 12px 28px ${c.bgGlow}, inset 0 1px 1px rgba(255, 255, 255, 0.1)`
                : '0 4px 16px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(16px)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Glow Accent Bar */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '3px',
              background: c.gradient,
              opacity: isSelected ? 1 : 0.6
            }} />

            {/* Title & Icon Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  {c.title}
                </span>
                {c.isPulse && (
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: c.color,
                    boxShadow: `0 0 10px ${c.color}`,
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
            <div style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1 }}>
              {c.value}
            </div>

            {/* Subtext */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {c.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}

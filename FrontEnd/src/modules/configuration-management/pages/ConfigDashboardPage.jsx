import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../i18n';
import {
  Sliders, List, Hash, Calendar, Flag, Cpu, Globe, Zap,
  Home, ChevronRight, ArrowUpRight, ShieldCheck, BarChart2, RefreshCw
} from 'lucide-react';

const glassCard = {
  background: 'var(--glass-bg)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  borderRadius: '18px',
  backdropFilter: 'blur(16px)',
  padding: '24px'
};

export default function ConfigDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hoveredCard, setHoveredCard] = useState(null);

  const configModules = [
    {
      id: 'settings',
      title: t('config.settingsPageTitle'),
      desc: t('config.settingsPageSubtitle'),
      icon: Sliders,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.15)',
      route: '/configuration/settings'
    },
    {
      id: 'lookups',
      title: t('config.lookupsPageTitle'),
      desc: t('config.lookupsPageSubtitle'),
      icon: List,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      route: '/configuration/lookups'
    },
    {
      id: 'sequences',
      title: t('config.sequencesPageTitle'),
      desc: t('config.sequencesPageSubtitle'),
      icon: Hash,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
      route: '/configuration/sequences'
    },
    {
      id: 'calendars',
      title: t('config.calendarsPageTitle'),
      desc: t('config.calendarsPageSubtitle'),
      icon: Calendar,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      route: '/configuration/calendars'
    },
    {
      id: 'flags',
      title: t('config.flagsPageTitle'),
      desc: t('config.flagsPageSubtitle'),
      icon: Flag,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.15)',
      route: '/configuration/flags'
    },
    {
      id: 'rules',
      title: t('config.rulesPageTitle'),
      desc: t('config.rulesPageSubtitle'),
      icon: Cpu,
      color: '#8b5cf6',
      bg: 'rgba(138, 75, 255, 0.15)',
      route: '/configuration/rules'
    },
    {
      id: 'localization',
      title: t('config.localizationPageTitle'),
      desc: t('config.localizationPageSubtitle'),
      icon: Globe,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.15)',
      route: '/configuration/localization'
    },
    {
      id: 'bootstrap',
      title: t('config.bootstrapPageTitle'),
      desc: t('config.bootstrapPageSubtitle'),
      icon: Zap,
      color: '#eab308',
      bg: 'rgba(234, 179, 8, 0.15)',
      route: '/configuration/bootstrap'
    }
  ];

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {t('config.dashboardTitle')}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {t('config.dashboardSubtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.78rem', fontWeight: 700 }}>
              <ShieldCheck size={14} /> {t('config.engineActive')}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div style={{
        ...glassCard,
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(138, 75, 255, 0.08) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px'
      }}>
        <div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('config.metricParameters')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0 0' }}>148 Active</div>
          <div style={{ fontSize: '0.78rem', color: '#818cf8', marginTop: '4px' }}>{t('config.metricParametersSub')}</div>
        </div>

        <div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('config.metricToggles')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0 0' }}>24 Enabled</div>
          <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '4px' }}>{t('config.metricTogglesSub')}</div>
        </div>

        <div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('config.metricLookups')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0 0' }}>42 Code Lists</div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>{t('config.metricLookupsSub')}</div>
        </div>

        <div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('config.metricCalendars')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0 0' }}>8 Active Shift Rules</div>
          <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '4px' }}>{t('config.metricCalendarsSub')}</div>
        </div>
      </div>

      {/* Module Cards Grid */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BarChart2 size={18} color="var(--accent-primary)" />
        {t('config.modulesSectionTitle')}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {configModules.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.id;
          return (
            <div
              key={card.id}
              onClick={() => navigate(card.route)}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...glassCard,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-4px)' : 'none',
                borderColor: isHovered ? card.color : 'rgba(148, 163, 184, 0.12)',
                boxShadow: isHovered ? `0 12px 28px -6px ${card.color}25` : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                  border: `1px solid ${card.color}40`
                }}>
                  <Icon size={24} />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: isHovered ? card.color : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'color 0.2s'
                }}>
                  <span>{t('config.manageAction')}</span>
                  <ArrowUpRight size={16} />
                </div>
              </div>

              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                {card.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {card.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

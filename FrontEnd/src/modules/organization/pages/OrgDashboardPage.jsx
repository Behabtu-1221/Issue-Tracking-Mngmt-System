import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Building2, Users, UserPlus, DollarSign, Award,
  Home, ChevronRight, Activity, ExternalLink, ArrowUpRight,
  BarChart2
} from 'lucide-react';
import orgApi from '../api/orgApi';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function OrgDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await orgApi.getUnitMetrics();
      setMetrics(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load org metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const m = metrics || {};

  const kpiCards = [
    { key: 'departments', label: t('organization.metrics.departmentsMetric', 'Departments & BUs'), value: loading ? '...' : (m.totalDepartments || 0), sub: t('organization.departmentsSub', 'Business units & divisions'), icon: Building2, color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: '#60a5fa', route: '/organization/departments' },
    { key: 'teams', label: t('organization.metrics.activeTeamsMetric', 'Active Teams'), value: loading ? '...' : (m.totalTeams || 0), sub: t('organization.teamsSub', 'Operational staff groups'), icon: Users, color: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', border: '#4ade80', route: '/organization/teams' },
    { key: 'positions', label: t('organization.metrics.jobPositionsMetric', 'Job Positions'), value: loading ? '...' : (m.totalPositions || 0), sub: t('organization.positionsSub', 'Defined organizational roles'), icon: Award, color: '#a78bfa', bg: 'rgba(168, 85, 247, 0.15)', border: '#a78bfa', route: '/organization/teams' },
    { key: 'assignments', label: t('organization.metrics.staffAssignmentsMetric', 'Staff Assignments'), value: loading ? '...' : (m.totalAssignments || 0), sub: t('organization.assignmentsSub', 'Active employee placements'), icon: UserPlus, color: '#f472b6', bg: 'rgba(236, 72, 153, 0.15)', border: '#f472b6', route: '/organization/assignments' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {t('organization.dashboardTitle', 'Organization Structure & Workforce Analytics')}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {t('organization.dashboardSubtitle', 'Department divisions, business units, staff assignments, reporting chains, and cost centers')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 700 }}>
              <Activity size={14} /> {t('organization.hubActive', 'Organization Hub Active')}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.key;
          return (
            <div key={card.key} className="glass-panel"
              onClick={() => navigate(card.route)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: '20px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered ? `0 12px 28px -6px ${card.border}33` : 'none',
                borderTop: isHovered ? `2px solid ${card.border}` : '2px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0 4px', color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.sub}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '14px', background: card.bg, color: card.color, transition: 'transform 0.3s', transform: isHovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(0) scale(1)' }}>
                  <Icon size={22} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '14px', fontSize: '0.72rem', fontWeight: 600, color: card.color, opacity: isHovered ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                <ExternalLink size={11} /> {t('organization.openSubModule', 'Open sub-module view')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Organization Telemetry Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Structure Hierarchy Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{t('organization.departmentsTab.title', 'Organization Departments')}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('organization.departmentsTab.subtitle', 'Business units & department breakdown')}</p>
            </div>
            <button onClick={() => navigate('/organization/departments')} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
              {t('organization.viewDirectory', 'View Directory')} <ArrowUpRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/organization/departments')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}><Building2 size={20} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t('organization.departmentsUnits', 'Departments & Business Units')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.totalDepartments || 0} {t('common.active', 'active')}</div>
                </div>
              </div>
              <span className="badge badge-info">{t('common.active', 'Active')}</span>
            </div>
          </div>
        </div>

        {/* Financial & Workforce Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{t('organization.workforceFinancials', 'Workforce & Financials')}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('organization.workforceFinancialsSub', 'Staffing, assignments & cost center budgets')}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div onClick={() => navigate('/organization/assignments')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(236,72,153,0.15)', color: '#f472b6', width: 'fit-content', marginBottom: '10px' }}><UserPlus size={18} /></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('organization.placements', 'Placements')}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>{t('organization.metrics.staffAssignmentsMetric', 'Staff Assignments')}</div>
            </div>
            <div onClick={() => navigate('/organization/financials')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', width: 'fit-content', marginBottom: '10px' }}><DollarSign size={18} /></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('organization.budgets', 'Budgets')}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>{t('organization.costCenters', 'Cost Centers')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t('organization.shortcuts', 'Organization Shortcuts')}</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: t('organization.units', 'Organization Units'), icon: Layers, route: '/organization/units' },
            { label: t('organization.tabs.departments', 'Departments & BUs'), icon: Building2, route: '/organization/departments' },
            { label: t('organization.tabs.teams', 'Teams & Positions'), icon: Users, route: '/organization/teams' },
            { label: t('organization.tabs.assignments', 'Employee Assignments'), icon: UserPlus, route: '/organization/assignments' },
            { label: t('organization.tabs.financials', 'Cost Centers & Budgets'), icon: DollarSign, route: '/organization/financials' }
          ].map((s) => {
            const ShortIcon = s.icon;
            return (
              <button key={s.label} onClick={() => navigate(s.route)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-gradient)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <ShortIcon size={14} /> {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

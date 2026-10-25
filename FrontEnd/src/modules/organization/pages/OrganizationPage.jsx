import React, { useState, useEffect } from 'react';
import {
  Layers,
  Building2,
  Users,
  Briefcase,
  UserPlus,
  DollarSign,
  Award,
  GitFork,
  TrendingUp
} from 'lucide-react';
import orgApi from '../api/orgApi';
import DepartmentsUnitsTab from '../components/DepartmentsUnitsTab';
import TeamsPositionsTab from '../components/TeamsPositionsTab';
import EmployeeAssignmentsTab from '../components/EmployeeAssignmentsTab';
import FinancialsTab from '../components/FinancialsTab';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function OrganizationPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('departments');
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await orgApi.getUnitMetrics();
      setMetrics(res.data.data);
    } catch (err) {
      console.error('Failed to load org metrics', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const m = metrics || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
            {t('organization.hubTitle', 'Organization Structure & Workforce Hub')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {t('organization.hubSubtitle', 'Departments, Business Units, Teams, Positions, Employee Assignments, Reporting Chains & Financial Planning.')}
          </p>
        </div>
      </div>

      {/* Overview Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{m.totalDepartments || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('organization.metrics.departmentsMetric', 'Departments')}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{m.totalTeams || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {t('organization.metrics.activeTeamsMetric', 'Active Teams')}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#a78bfa' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{m.totalPositions || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('organization.metrics.jobPositionsMetric', 'Job Positions')}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#f472b6' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{m.totalAssignments || 0}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('organization.metrics.staffAssignmentsMetric', 'Staff Assignments')}</div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'departments', label: t('organization.tabs.departments', 'Departments Directory'), icon: Building2 },
          { id: 'teams', label: t('organization.tabs.teams', 'Teams & Positions'), icon: Users },
          { id: 'assignments', label: t('organization.tabs.assignments', 'Employee Assignments'), icon: UserPlus },
          { id: 'financials', label: t('organization.tabs.financials', 'Cost Centers & Budgets'), icon: DollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      {activeTab === 'departments' && <DepartmentsUnitsTab onRefreshMetrics={fetchMetrics} />}
      {activeTab === 'teams' && <TeamsPositionsTab onRefreshMetrics={fetchMetrics} />}
      {activeTab === 'assignments' && <EmployeeAssignmentsTab onRefreshMetrics={fetchMetrics} />}
      {activeTab === 'financials' && <FinancialsTab onRefreshMetrics={fetchMetrics} />}
    </div>
  );
}

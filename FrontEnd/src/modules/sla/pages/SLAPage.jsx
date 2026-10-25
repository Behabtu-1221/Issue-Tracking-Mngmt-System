import React, { useState, useEffect } from 'react';
import slaApi from '../api/slaApi';
import SLAMetricsHeader from '../components/SLAMetricsHeader';
import SLADashboardTab from '../components/SLADashboardTab';
import SLABreachMonitoringTab from '../components/SLABreachMonitoringTab';
import SLAPoliciesTab from '../components/SLAPoliciesTab';
import { Clock, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function SLAPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('clocks'); // 'clocks' | 'breaches' | 'policies'
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await slaApi.getOverviewMetrics();
      setMetrics(res.data.data);
    } catch (err) {
      console.error('Failed to fetch SLA metrics', err);
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
              <Clock size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {t('sla.managementTitle', 'SLA & Escalation Management')}
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t('sla.managementSubtitle', 'Performance monitoring against response & resolution targets, SLA clocks & automatic escalations')}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          className="btn btn-secondary"
          style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={16} /> {t('sla.refreshMetricsBtn', 'Refresh Metrics')}
        </button>
      </div>

      {/* KPI Metrics */}
      <SLAMetricsHeader
        metrics={metrics}
        activeFilter={activeTab === 'clocks' ? 'ALL' : activeTab === 'breaches' ? 'RESPONSE_BREACH' : 'COMPLIANCE'}
        onFilterChange={(code) => {
          if (code === 'ALL' || code === 'COMPLIANCE') setActiveTab('clocks');
          if (code === 'RESPONSE_BREACH' || code === 'RESOLUTION_BREACH') setActiveTab('breaches');
        }}
      />

      {/* Navigation Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('clocks')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'clocks' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
            color: activeTab === 'clocks' ? 'white' : 'var(--text-muted)',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Clock size={16} /> {t('sla.tabs.clocks', 'SLA Dashboard & Live Clocks')}
        </button>

        <button
          onClick={() => setActiveTab('breaches')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'breaches' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
            color: activeTab === 'breaches' ? 'white' : 'var(--text-muted)',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <AlertTriangle size={16} /> {t('sla.tabs.breaches', 'Breach Log & Violations')}
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'policies' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
            color: activeTab === 'policies' ? 'white' : 'var(--text-muted)',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <ShieldCheck size={16} /> {t('sla.tabs.policies', 'SLA Policies & Targets')}
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'clocks' && <SLADashboardTab />}
      {activeTab === 'breaches' && <SLABreachMonitoringTab />}
      {activeTab === 'policies' && <SLAPoliciesTab />}

    </div>
  );
}

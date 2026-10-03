import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import dispatchApi from '../api/dispatchApi';
import DispatchMetricsHeader from '../components/DispatchMetricsHeader';
import DispatcherDashboardTab from '../components/DispatcherDashboardTab';
import TechnicianWorkbenchTab from '../components/TechnicianWorkbenchTab';
import TechnicianRosterTab from '../components/TechnicianRosterTab';
import TechnicianTeamsTab from '../components/TechnicianTeamsTab';
import { Send, Inbox, Wrench, Users, RefreshCw, Layers } from 'lucide-react';

export default function DispatchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dispatcher';
  const [activeTab, setActiveTab] = useState(initialTab); // 'dispatcher' | 'workbench' | 'roster' | 'teams'
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    const qTab = searchParams.get('tab');
    if (qTab && qTab !== activeTab) {
      setActiveTab(qTab);
    }
  }, [searchParams]);

  const handleTabSelect = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  const fetchMetrics = async () => {
    try {
      const res = await dispatchApi.getOverviewMetrics();
      setMetrics(res.data.data);
    } catch (err) {
      console.error('Failed to fetch dispatch metrics', err);
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}>
              <Send size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '900', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                Assignment & Dispatch Management
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Work distribution, technician workloads, field execution & dispatch routing
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          className="btn btn-secondary"
          style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={16} /> Refresh Metrics
        </button>
      </div>

      {/* KPI Metrics */}
      <DispatchMetricsHeader
        metrics={metrics}
        activeFilter={activeTab === 'dispatcher' ? 'UNASSIGNED' : 'ACTIVE'}
        onFilterChange={(code) => {
          if (code === 'UNASSIGNED') handleTabSelect('dispatcher');
          if (code === 'ROSTER') handleTabSelect('roster');
        }}
      />

      {/* Navigation Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleTabSelect('dispatcher')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'dispatcher' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
            color: activeTab === 'dispatcher' ? 'white' : 'var(--text-muted)',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Inbox size={16} /> Dispatcher Queue & Routing
        </button>

        <button
          onClick={() => handleTabSelect('workbench')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'workbench' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
            color: activeTab === 'workbench' ? 'white' : 'var(--text-muted)',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Wrench size={16} /> Field Technician Workbench
        </button>

        <button
          onClick={() => handleTabSelect('teams')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'teams' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
            color: activeTab === 'teams' ? 'white' : 'var(--text-muted)',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Layers size={16} /> Technician Work Teams
        </button>

        <button
          onClick={() => handleTabSelect('roster')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'roster' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
            color: activeTab === 'roster' ? 'white' : 'var(--text-muted)',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Users size={16} /> Team Roster & Availability
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'dispatcher' && <DispatcherDashboardTab />}
      {activeTab === 'workbench' && <TechnicianWorkbenchTab />}
      {activeTab === 'teams' && <TechnicianTeamsTab />}
      {activeTab === 'roster' && <TechnicianRosterTab />}

    </div>
  );
}

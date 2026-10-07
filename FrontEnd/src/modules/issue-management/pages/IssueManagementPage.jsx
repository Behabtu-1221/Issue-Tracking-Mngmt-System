import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  ListChecks,
  BookOpen,
  RefreshCw,
  Zap,
  TrendingUp
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';
import IssueListTab from '../components/IssueListTab';
import IssueDetailView from '../components/IssueDetailView';
import CreateIssueModal from '../components/CreateIssueModal';
import AssignIssueModal from '../components/AssignIssueModal';
import StatusUpdateModal from '../components/StatusUpdateModal';
import KnownIssuesTab from '../components/KnownIssuesTab';
import { useTranslation } from '../../../i18n';

export default function IssueManagementPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('issues');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignModalIssue, setAssignModalIssue] = useState(null);
  const [statusModalIssue, setStatusModalIssue] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, [refreshKey]);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await issueManagementApi.getOverviewMetrics();
      setMetrics(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch issue metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleRefreshAll = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleSelectIssue = (issue) => {
    setSelectedIssue(issue);
  };

  const handleBackToList = () => {
    setSelectedIssue(null);
    handleRefreshAll();
  };

  const handleIssueCreated = () => {
    handleRefreshAll();
  };

  const handleIssueAssigned = () => {
    handleRefreshAll();
    setSelectedIssue(null);
  };

  const handleStatusUpdated = () => {
    handleRefreshAll();
    setSelectedIssue(null);
  };

  const m = metrics || {};

  // KPI Card Data
  const kpiCards = [
    {
      label: t('issues.totalIssues', 'Total Issues'),
      value: m.totalIssues || 0,
      icon: ListChecks,
      bg: 'rgba(138, 75, 255, 0.15)',
      color: 'var(--accent-primary)',
      glow: '0 0 20px rgba(138, 75, 255, 0.15)'
    },
    {
      label: t('issues.newRequests', 'New Requests'),
      value: m.newIssues || 0,
      icon: AlertCircle,
      bg: 'rgba(59, 130, 246, 0.15)',
      color: '#60a5fa',
      glow: '0 0 20px rgba(59, 130, 246, 0.15)'
    },
    {
      label: t('issues.inProgress', 'In Progress'),
      value: m.inProgressIssues || 0,
      icon: Clock,
      bg: 'rgba(234, 179, 8, 0.15)',
      color: '#facc15',
      glow: '0 0 20px rgba(234, 179, 8, 0.15)'
    },
    {
      label: t('issues.resolved', 'Resolved'),
      value: m.resolvedIssues || 0,
      icon: CheckCircle2,
      bg: 'rgba(34, 197, 94, 0.15)',
      color: '#4ade80',
      glow: '0 0 20px rgba(34, 197, 94, 0.15)'
    },
    {
      label: t('issues.closed', 'Closed'),
      value: m.closedIssues || 0,
      icon: XCircle,
      bg: 'rgba(100, 116, 139, 0.15)',
      color: '#94a3b8',
      glow: '0 0 20px rgba(100, 116, 139, 0.15)'
    },
    {
      label: t('issues.majorIncidents', 'Major Incidents'),
      value: m.majorIncidents || 0,
      icon: AlertTriangle,
      bg: 'rgba(239, 68, 68, 0.15)',
      color: '#f87171',
      glow: '0 0 20px rgba(239, 68, 68, 0.15)'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
            {t('issues.managementTitle', 'Issue Request')}{' '}
            <span className="glow-text">{t('issues.managementTitleHighlight', 'Management')}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            {t('issues.managementSubtitle', 'Submit, track, investigate, assign, resolve, and close issue requests across the entire lifecycle.')}
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--glass-border)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-secondary)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
          {t('common.refresh', 'Refresh')}
        </button>
      </div>

      {/* KPI Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: 'var(--border-radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: kpi.glow,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default'
              }}
            >
              <div style={{
                padding: '12px',
                borderRadius: '12px',
                background: kpi.bg,
                color: kpi.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1' }}>
                  {loadingMetrics ? '...' : kpi.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>{kpi.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      {!selectedIssue && (
        <div style={{ borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'issues', label: t('issues.tabIssueRequests', 'Issue Requests'), icon: ListChecks },
            { id: 'knowledge', label: t('issues.tabKnowledgeBase', 'Knowledge Base'), icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: isActive ? 'rgba(138, 75, 255, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  borderRadius: '8px 8px 0 0',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content */}
      <div>
        {selectedIssue ? (
          <IssueDetailView
            issue={selectedIssue}
            onBack={handleBackToList}
            onRefresh={handleRefreshAll}
          />
        ) : activeTab === 'issues' ? (
          <IssueListTab
            onSelectIssue={handleSelectIssue}
            onOpenCreateModal={() => setShowCreateModal(true)}
            onOpenAssignModal={(issue) => setAssignModalIssue(issue)}
            onOpenStatusModal={(issue) => setStatusModalIssue(issue)}
            refreshKey={refreshKey}
          />
        ) : activeTab === 'knowledge' ? (
          <KnownIssuesTab />
        ) : null}
      </div>

      {/* Modals */}
      <CreateIssueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleIssueCreated}
      />

      <AssignIssueModal
        isOpen={!!assignModalIssue}
        onClose={() => setAssignModalIssue(null)}
        issue={assignModalIssue}
        onAssigned={handleIssueAssigned}
      />

      <StatusUpdateModal
        isOpen={!!statusModalIssue}
        onClose={() => setStatusModalIssue(null)}
        issue={statusModalIssue}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}

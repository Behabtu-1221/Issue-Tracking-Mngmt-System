import React from 'react';
import { CheckSquare, Clock, CheckCircle2, XCircle, RotateCcw, Zap } from 'lucide-react';
import KPICard from '../KPICard';
import ReportDataTable from '../ReportDataTable';

export default function ApprovalsTab({ data, loading, filters }) {
  const kpis = data?.kpis || {};
  const stageBreakdown = data?.stageBreakdown || [];

  const stageColumns = [
    {
      key: 'StageNumber',
      label: 'Approval Stage Level',
      sortable: true,
      render: (val) => <span style={{ fontWeight: 700 }}>Stage {val}</span>
    },
    { key: 'TotalStages', label: 'Total Invocations', sortable: true },
    {
      key: 'PendingStages',
      label: 'Pending In Queue',
      sortable: true,
      render: (val) => (
        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
          {val || 0}
        </span>
      )
    },
    {
      key: 'ApprovedStages',
      label: 'Approved Decisions',
      sortable: true,
      render: (val) => <span style={{ color: '#10b981', fontWeight: 700 }}>{val || 0}</span>
    },
    {
      key: 'RejectedStages',
      label: 'Rejected Decisions',
      sortable: true,
      render: (val) => <span style={{ color: '#ef4444', fontWeight: 700 }}>{val || 0}</span>
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <KPICard
          title="Total Governance Requests"
          value={loading ? '...' : kpis.totalApprovals || 0}
          subtext="Workflow authorizations"
          icon={CheckSquare}
          iconBg="rgba(59, 130, 246, 0.15)"
          iconColor="#3b82f6"
          accentColor="#3b82f6"
        />

        <KPICard
          title="Pending Approval Queue"
          value={loading ? '...' : kpis.pendingApprovals || 0}
          subtext="Awaiting manager sign-off"
          icon={Clock}
          iconBg="rgba(245, 158, 11, 0.15)"
          iconColor="#f59e0b"
          accentColor="#f59e0b"
          badge={kpis.pendingApprovals > 0 ? { label: 'Active', bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' } : null}
        />

        <KPICard
          title="Approved Decisions"
          value={loading ? '...' : kpis.approvedCount || 0}
          subtext="Authorized requests"
          icon={CheckCircle2}
          iconBg="rgba(16, 185, 129, 0.15)"
          iconColor="#10b981"
          accentColor="#10b981"
        />

        <KPICard
          title="Rejected / Returned"
          value={loading ? '...' : (kpis.rejectedCount || 0) + (kpis.returnedCount || 0)}
          subtext={`${kpis.rejectedCount || 0} rejected, ${kpis.returnedCount || 0} returned`}
          icon={XCircle}
          iconBg="rgba(239, 68, 68, 0.15)"
          iconColor="#ef4444"
          accentColor="#ef4444"
        />

        <KPICard
          title="Decision Velocity"
          value={loading ? '...' : `${kpis.avgTurnaroundHours || 0} hrs`}
          subtext="Avg time to decision"
          icon={Zap}
          iconBg="rgba(168, 85, 247, 0.15)"
          iconColor="#a855f7"
          accentColor="#a855f7"
        />
      </div>

      {/* Stage Breakdown Matrix */}
      <ReportDataTable
        title="Multi-Stage Governance Workflow Bottlenecks"
        columns={stageColumns}
        data={stageBreakdown}
        reportType="APPROVAL_ANALYTICS"
        filters={filters}
        loading={loading}
      />
    </div>
  );
}

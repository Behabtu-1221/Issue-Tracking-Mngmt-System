import React from 'react';
import { ShieldCheck, Users, Globe, Activity, FileText } from 'lucide-react';
import KPICard from '../KPICard';
import ReportDataTable from '../ReportDataTable';

export default function AuditTab({ data, loading, filters }) {
  const summary = data?.summary || {};
  const logs = data?.logs || [];
  const total = data?.total || 0;

  const columns = [
    {
      key: 'AuditDateTime',
      label: 'Event Timestamp',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleString() : '—'
    },
    {
      key: 'UserName',
      label: 'Actor / User',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val || 'System'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.UserEmail || '—'}</div>
        </div>
      )
    },
    { key: 'TenantName', label: 'Tenant Scope', sortable: true },
    {
      key: 'IPAddress',
      label: 'IP Address',
      sortable: true,
      render: (val) => <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{val || '127.0.0.1'}</span>
    },
    {
      key: 'UserAgent',
      label: 'Client Device / Agent',
      sortable: false,
      render: (val) => (
        <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {val || 'Web Client'}
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <KPICard
          title="Total Audit Events"
          value={loading ? '...' : summary.totalAuditEvents || 0}
          subtext="Security & state mutations"
          icon={FileText}
          iconBg="rgba(59, 130, 246, 0.15)"
          iconColor="#3b82f6"
          accentColor="#3b82f6"
        />

        <KPICard
          title="Active Actors"
          value={loading ? '...' : summary.activeUsersCount || 0}
          subtext="Distinct authenticated users"
          icon={Users}
          iconBg="rgba(16, 185, 129, 0.15)"
          iconColor="#10b981"
          accentColor="#10b981"
        />

        <KPICard
          title="Unique IP Addresses"
          value={loading ? '...' : summary.uniqueIPsCount || 0}
          subtext="Client connection origins"
          icon={Globe}
          iconBg="rgba(168, 85, 247, 0.15)"
          iconColor="#a855f7"
          accentColor="#a855f7"
        />
      </div>

      <ReportDataTable
        title="Security Audit Trail & Compliance Telemetry"
        columns={columns}
        data={logs}
        totalCount={total}
        reportType="AUDIT_ANALYTICS"
        filters={filters}
        loading={loading}
      />
    </div>
  );
}

import React from 'react';
import { Network, Users, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import ReportDataTable from '../ReportDataTable';

export default function DepartmentsTab({ data, loading, filters }) {
  const departments = Array.isArray(data) ? data : [];

  const columns = [
    {
      key: 'DepartmentName',
      label: 'Department',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {row.DepartmentCode}</div>
        </div>
      )
    },
    { key: 'OrganizationUnitName', label: 'Org Unit / Division', sortable: true },
    { key: 'TotalAssignedRequests', label: 'Total Volume', sortable: true },
    {
      key: 'ActiveWorkload',
      label: 'Active Open',
      sortable: true,
      render: (val) => (
        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, background: val > 5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(14, 165, 233, 0.15)', color: val > 5 ? '#ef4444' : '#0ea5e9' }}>
          {val || 0} active
        </span>
      )
    },
    {
      key: 'ResolvedRequests',
      label: 'Resolved',
      sortable: true,
      render: (val) => <span style={{ color: '#10b981', fontWeight: 700 }}>{val || 0}</span>
    },
    {
      key: 'CompletionRatePct',
      label: 'Completion Rate',
      sortable: true,
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '60px', height: '6px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.15)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(val || 0, 100)}%`, height: '100%', background: '#10b981' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{val || 0}%</span>
        </div>
      )
    },
    {
      key: 'AvgResolutionHours',
      label: 'Avg Turnaround',
      sortable: true,
      render: (val) => `${val || 0} hrs`
    },
    {
      key: 'SLABreaches',
      label: 'SLA Breaches',
      sortable: true,
      render: (val) => (
        <span style={{ fontWeight: 700, color: val > 0 ? '#ef4444' : 'var(--text-muted)' }}>
          {val || 0}
        </span>
      )
    },
    { key: 'TotalTeamsCount', label: 'Teams Count', sortable: true }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ReportDataTable
        title="Department Operational Efficiency & Capacity"
        columns={columns}
        data={departments}
        reportType="DEPARTMENT_ANALYTICS"
        filters={filters}
        loading={loading}
      />
    </div>
  );
}

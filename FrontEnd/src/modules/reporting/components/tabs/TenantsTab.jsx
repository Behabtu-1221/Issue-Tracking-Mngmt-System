import React from 'react';
import { Building2, TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import ReportDataTable from '../ReportDataTable';

export default function TenantsTab({ data, loading, filters }) {
  const tenants = data?.tenants || [];
  const total = data?.total || 0;

  const columns = [
    {
      key: 'CompanyName',
      label: 'Tenant Company',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {row.TenantCode}</div>
        </div>
      )
    },
    {
      key: 'TenantStatus',
      label: 'Lease Status',
      sortable: true,
      render: (val) => (
        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: val === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)', color: val === 'ACTIVE' ? '#10b981' : '#64748b' }}>
          {val || 'ACTIVE'}
        </span>
      )
    },
    { key: 'TotalRequests', label: 'Total Volume', sortable: true },
    {
      key: 'OpenRequests',
      label: 'Active Open',
      sortable: true,
      render: (val) => (
        <span style={{ fontWeight: 700, color: val > 0 ? '#3b82f6' : 'var(--text-muted)' }}>
          {val || 0}
        </span>
      )
    },
    {
      key: 'ClosedRequests',
      label: 'Resolved',
      sortable: true,
      render: (val) => <span style={{ color: '#10b981', fontWeight: 600 }}>{val || 0}</span>
    },
    {
      key: 'ResolutionRatePct',
      label: 'Resolution Rate',
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
      key: 'SLABreachCount',
      label: 'SLA Breaches',
      sortable: true,
      render: (val) => (
        <span style={{ fontWeight: 700, color: val > 0 ? '#ef4444' : 'var(--text-muted)' }}>
          {val || 0}
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ReportDataTable
        title="Tenant Incident Volume & Benchmarking"
        columns={columns}
        data={tenants}
        totalCount={total}
        reportType="TENANT_ANALYTICS"
        filters={filters}
        loading={loading}
      />
    </div>
  );
}

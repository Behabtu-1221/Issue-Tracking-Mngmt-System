import React from 'react';
import DistributionBarChart from '../DistributionBarChart';
import ReportDataTable from '../ReportDataTable';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const PRIORITY_BADGES = {
  P1: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'P1 - Critical' },
  CRITICAL: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'Critical' },
  P2: { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', label: 'P2 - High' },
  HIGH: { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', label: 'High' },
  P3: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'P3 - Medium' },
  MEDIUM: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'Medium' },
  P4: { bg: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', label: 'P4 - Low' },
  LOW: { bg: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', label: 'Low' }
};

const STATUS_BADGES = {
  NEW: { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' },
  ASSIGNED: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' },
  IN_PROGRESS: { bg: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' },
  PENDING_APPROVAL: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  RESOLVED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  CLOSED: { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b' },
  CANCELLED: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }
};

export default function RequestsTab({
  data,
  loading,
  filters,
  page,
  pageSize,
  sortBy,
  sortOrder,
  onPageChange,
  onPageSizeChange,
  onSortChange
}) {
  const requests = data?.requests || [];
  const total = data?.total || 0;
  const categoryDistribution = data?.categoryDistribution || [];
  const channelDistribution = data?.channelDistribution || [];

  const columns = [
    {
      key: 'RequestNumber',
      label: 'Ticket #',
      sortable: true,
      render: (val, row) => (
        <div>
          <span style={{ fontWeight: 700, color: 'var(--accent-primary, #3b82f6)' }}>{val}</span>
          {row.IsMajorIncident === 1 && (
            <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              MAJOR
            </span>
          )}
        </div>
      )
    },
    {
      key: 'Title',
      label: 'Title & Summary',
      sortable: true,
      render: (val) => (
        <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
          {val}
        </div>
      )
    },
    {
      key: 'PriorityCode',
      label: 'Priority',
      sortable: true,
      render: (val) => {
        const badge = PRIORITY_BADGES[val] || { bg: 'rgba(148, 163, 184, 0.15)', color: '#64748b', label: val };
        return (
          <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: badge.bg, color: badge.color }}>
            {badge.label || val}
          </span>
        );
      }
    },
    {
      key: 'StatusCode',
      label: 'Status',
      sortable: true,
      render: (val) => {
        const badge = STATUS_BADGES[val] || { bg: 'rgba(148, 163, 184, 0.15)', color: '#64748b' };
        return (
          <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: badge.bg, color: badge.color }}>
            {val}
          </span>
        );
      }
    },
    { key: 'TenantName', label: 'Tenant Company', sortable: false },
    { key: 'DepartmentName', label: 'Responsible Dept', sortable: false },
    {
      key: 'AssignedTechnicianName',
      label: 'Assigned Technician',
      sortable: false,
      render: (val, row) => val ? val : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
    },
    { key: 'RequesterName', label: 'Requester', sortable: false },
    {
      key: 'ElapsedHours',
      label: 'Elapsed Time',
      sortable: false,
      render: (val) => `${val || 0} hrs`
    },
    {
      key: 'SLAStatus',
      label: 'SLA Health',
      sortable: false,
      render: (val) => {
        if (val === 'SLA_MET') {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle2 size={12} /> Target Met
            </span>
          );
        }
        if (val === 'SLA_BREACHED' || val === 'SLA_OVERDUE') {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <AlertCircle size={12} /> Breached
            </span>
          );
        }
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
            <Clock size={12} /> On Track
          </span>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Category and Channel Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '20px' }}>
        <DistributionBarChart
          items={categoryDistribution}
          title="Top Request Categories"
          type="category"
          labelKey="CategoryName"
          valueKey="Count"
        />

        <DistributionBarChart
          items={channelDistribution}
          title="Submission Channels"
          type="generic"
          labelKey="ChannelCode"
          valueKey="Count"
        />
      </div>

      {/* Paginated Detailed Request Table */}
      <ReportDataTable
        title="Issue Requests Directory & SLA Tracking"
        columns={columns}
        data={requests}
        totalCount={total}
        page={page}
        pageSize={pageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortChange={onSortChange}
        reportType="REQUEST_ANALYTICS"
        filters={filters}
        loading={loading}
      />
    </div>
  );
}

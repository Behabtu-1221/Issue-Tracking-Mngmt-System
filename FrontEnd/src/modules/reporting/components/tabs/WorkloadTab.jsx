import React from 'react';
import { Users, Wrench, Clock, CheckSquare, Inbox, Activity, AlertCircle } from 'lucide-react';
import KPICard from '../KPICard';
import ReportDataTable from '../ReportDataTable';

export default function WorkloadTab({ data, loading, filters }) {
  const summary = data?.summary || {};
  const technicianWorkload = data?.technicianWorkload || [];
  const teamWorkload = data?.teamWorkload || [];

  const techColumns = [
    {
      key: 'TechnicianName',
      label: 'Technician',
      sortable: true,
      render: (val, row) => {
        const initials = (val || 'Tech')
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 800,
              flexShrink: 0
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{row.Email}</div>
            </div>
          </div>
        );
      }
    },
    { key: 'TeamName', label: 'Team', sortable: true },
    { key: 'DepartmentName', label: 'Department', sortable: true },
    {
      key: 'ActiveWorkload',
      label: 'Active Queue & Load',
      sortable: true,
      render: (val) => {
        const count = val || 0;
        const isHigh = count >= 6;
        const isMed = count >= 3;
        const color = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';
        const bg = isHigh ? 'rgba(239, 68, 68, 0.15)' : isMed ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';
        const label = isHigh ? 'Overloaded' : isMed ? 'Moderate' : 'Optimal';

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, background: bg, color }}>
              {count} tickets ({label})
            </span>
          </div>
        );
      }
    },
    {
      key: 'CompletedTasks',
      label: 'Resolved Total',
      sortable: true,
      render: (val) => (
        <span style={{ fontWeight: 700, color: 'var(--color-success, #10b981)' }}>
          {val || 0}
        </span>
      )
    },
    { key: 'TotalAssigned', label: 'Total Assigned', sortable: true },
    {
      key: 'AvgCompletionHours',
      label: 'Avg Turnaround',
      sortable: true,
      render: (val) => `${val || 0} hrs`
    }
  ];

  const teamColumns = [
    { key: 'TeamName', label: 'Team Name', sortable: true },
    { key: 'DepartmentName', label: 'Department', sortable: true },
    {
      key: 'ActiveWorkload',
      label: 'Active Queue',
      sortable: true,
      render: (val) => (
        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
          {val || 0} tickets
        </span>
      )
    },
    { key: 'CompletedWork', label: 'Resolved Tickets', sortable: true },
    { key: 'TotalAssignments', label: 'Total Handled', sortable: true }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Workload Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <KPICard
          title="Assigned Requests"
          value={loading ? '...' : summary.assignedRequests || 0}
          subtext="Routed to technicians or teams"
          icon={Users}
          iconBg="rgba(59, 130, 246, 0.15)"
          iconColor="#3b82f6"
          accentColor="#3b82f6"
          isLive={true}
        />

        <KPICard
          title="Unassigned Backlog"
          value={loading ? '...' : summary.unassignedBacklog || 0}
          subtext="Awaiting dispatcher assignment"
          icon={Inbox}
          iconBg="rgba(245, 158, 11, 0.15)"
          iconColor="#f59e0b"
          accentColor="#f59e0b"
          badge={summary.unassignedBacklog > 0 ? { label: `${summary.unassignedBacklog} Action Required`, bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' } : null}
        />

        <KPICard
          title="Active In Progress"
          value={loading ? '...' : summary.activeInProgress || 0}
          subtext="Currently undergoing field work"
          icon={Wrench}
          iconBg="rgba(14, 165, 233, 0.15)"
          iconColor="#0ea5e9"
          accentColor="#0ea5e9"
        />

        <KPICard
          title="Completed Assignments"
          value={loading ? '...' : summary.completedAssignments || 0}
          subtext="Successfully closed tasks"
          icon={CheckSquare}
          iconBg="rgba(16, 185, 129, 0.15)"
          iconColor="#10b981"
          accentColor="#10b981"
        />
      </div>

      {/* Technician Workload Table */}
      <ReportDataTable
        title="Technician Workload Balance & Capacity Index"
        columns={techColumns}
        data={technicianWorkload}
        reportType="WORKLOAD_ANALYTICS"
        filters={filters}
        loading={loading}
      />

      {/* Team Workload Table */}
      <ReportDataTable
        title="Team Allocation & Capacity Matrix"
        columns={teamColumns}
        data={teamWorkload}
        reportType="WORKLOAD_ANALYTICS"
        filters={filters}
        loading={loading}
      />
    </div>
  );
}

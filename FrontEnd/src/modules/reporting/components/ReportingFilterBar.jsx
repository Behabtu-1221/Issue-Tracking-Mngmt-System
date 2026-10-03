import React from 'react';
import { Calendar, Filter, RefreshCw, Bookmark, X, Search, Tag, Building2, SlidersHorizontal } from 'lucide-react';

const DATE_PRESETS = [
  { id: 'TODAY', label: 'Today' },
  { id: '7D', label: 'Last 7 Days' },
  { id: '30D', label: 'Last 30 Days' },
  { id: '90D', label: 'Last 90 Days' },
  { id: 'YTD', label: 'Year to Date' },
  { id: '1Y', label: 'Last 1 Year' },
  { id: 'CUSTOM', label: 'Custom Range' }
];

export default function ReportingFilterBar({
  filters,
  onChange,
  onApply,
  onReset,
  onSavePreset,
  loading = false,
  isParkAdmin = false,
  tenants = [],
  departments = []
}) {
  const handlePresetClick = (presetId) => {
    onChange({ ...filters, dateRange: presetId });
  };

  const handleInputChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const clearFilterField = (field) => {
    onChange({ ...filters, [field]: '' });
  };

  // Calculate active filter count
  const activeFilters = [];
  if (filters.priority) activeFilters.push({ key: 'priority', label: `Priority: ${filters.priority}` });
  if (filters.status) activeFilters.push({ key: 'status', label: `Status: ${filters.status}` });
  if (filters.tenantId) {
    const t = tenants.find(item => String(item.TenantID) === String(filters.tenantId));
    activeFilters.push({ key: 'tenantId', label: `Tenant: ${t ? t.CompanyName : filters.tenantId}` });
  }
  if (filters.departmentId) {
    const d = departments.find(item => String(item.DepartmentID) === String(filters.departmentId));
    activeFilters.push({ key: 'departmentId', label: `Dept: ${d ? d.DepartmentName : filters.departmentId}` });
  }
  if (filters.search) activeFilters.push({ key: 'search', label: `Search: "${filters.search}"` });

  return (
    <div className="glass-panel" style={{
      padding: '18px 22px',
      borderRadius: '16px',
      marginBottom: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      boxShadow: '0 8px 24px -6px rgba(0,0,0,0.06)'
    }}>
      {/* Top Row: Timeframe Presets & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            <Calendar size={14} /> Timeframe:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {DATE_PRESETS.map((p) => {
              const isActive = (filters.dateRange || '30D') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetClick(p.id)}
                  style={{
                    padding: '5px 13px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-primary, #3b82f6)' : 'rgba(148, 163, 184, 0.25)',
                    background: isActive ? 'var(--accent-primary, #3b82f6)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onSavePreset && (
            <button
              type="button"
              onClick={onSavePreset}
              className="btn btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                borderRadius: '10px',
                fontWeight: 600
              }}
            >
              <Bookmark size={13} /> Save Current Preset
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Inputs if CUSTOM selected */}
      {filters.dateRange === 'CUSTOM' && (
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '12px 16px',
          background: 'rgba(59, 130, 246, 0.06)',
          borderRadius: '12px',
          border: '1px dashed rgba(59, 130, 246, 0.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Start Date:</span>
            <input
              type="date"
              value={filters.startDate ? filters.startDate.slice(0, 10) : ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>End Date:</span>
            <input
              type="date"
              value={filters.endDate ? filters.endDate.slice(0, 10) : ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}

      {/* Selectors Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
        {/* Tenant Filter (Park Admins only) */}
        {isParkAdmin && (
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Tenant Company
            </label>
            <select
              value={filters.tenantId || ''}
              onChange={(e) => handleInputChange('tenantId', e.target.value)}
              className="form-control"
              style={{ width: '100%', padding: '7px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
            >
              <option value="">All Tenant Companies</option>
              {tenants.map((t) => (
                <option key={t.TenantID} value={t.TenantID}>{t.CompanyName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Department Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Responsible Department
          </label>
          <select
            value={filters.departmentId || ''}
            onChange={(e) => handleInputChange('departmentId', e.target.value)}
            className="form-control"
            style={{ width: '100%', padding: '7px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName}</option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Priority Level
          </label>
          <select
            value={filters.priority || ''}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="form-control"
            style={{ width: '100%', padding: '7px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Ticket Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="form-control"
            style={{ width: '100%', padding: '7px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New / Submitted</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onApply}
            disabled={loading}
            className="btn btn-primary"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              fontWeight: 700
            }}
          >
            {loading ? <RefreshCw size={14} className="spin" /> : <Filter size={14} />}
            {loading ? 'Applying...' : 'Apply Filters'}
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="btn btn-outline"
            title="Reset Filters to Default"
            style={{
              padding: '8px 12px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active ({activeFilters.length}):
          </span>
          {activeFilters.map((f) => (
            <span
              key={f.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              {f.label}
              <button
                type="button"
                onClick={() => clearFilterField(f.key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onReset}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginLeft: '4px'
            }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

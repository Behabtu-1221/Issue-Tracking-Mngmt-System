import React from 'react';

const PRIORITY_COLORS = {
  P1: { bar: '#ef4444', text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', label: 'P1 - Critical' },
  CRITICAL: { bar: '#ef4444', text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', label: 'Critical' },
  P2: { bar: '#f97316', text: '#fb923c', bg: 'rgba(249, 115, 22, 0.15)', label: 'P2 - High' },
  HIGH: { bar: '#f97316', text: '#fb923c', bg: 'rgba(249, 115, 22, 0.15)', label: 'High' },
  P3: { bar: '#f59e0b', text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', label: 'P3 - Medium' },
  MEDIUM: { bar: '#f59e0b', text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', label: 'Medium' },
  P4: { bar: '#0ea5e9', text: '#38bdf8', bg: 'rgba(14, 165, 233, 0.15)', label: 'P4 - Low' },
  LOW: { bar: '#0ea5e9', text: '#38bdf8', bg: 'rgba(14, 165, 233, 0.15)', label: 'Low' }
};

const STATUS_COLORS = {
  NEW: { bar: '#6366f1', label: 'New / Submitted' },
  ASSIGNED: { bar: '#8b5cf6', label: 'Assigned' },
  IN_PROGRESS: { bar: '#0ea5e9', label: 'In Progress' },
  PENDING_APPROVAL: { bar: '#f59e0b', label: 'Pending Approval' },
  INVESTIGATING: { bar: '#ec4899', label: 'Investigating' },
  RESOLVED: { bar: '#10b981', label: 'Resolved' },
  CLOSED: { bar: '#64748b', label: 'Closed' },
  CANCELLED: { bar: '#94a3b8', label: 'Cancelled' }
};

export default function DistributionBarChart({
  items = [], // [{ PriorityCode: 'P1', Count: 5, Pct: 25.0 }] or [{ CategoryName: 'HVAC', Count: 12 }]
  title = 'Distribution Breakdown',
  type = 'priority', // 'priority' | 'status' | 'category' | 'generic'
  labelKey = 'PriorityCode',
  valueKey = 'Count',
  pctKey = 'Pct',
  maxItems = 8
}) {
  const totalCount = items.reduce((acc, item) => acc + (Number(item[valueKey]) || 0), 0);
  const displayItems = items.slice(0, maxItems);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Total: {totalCount}
        </span>
      </div>

      {displayItems.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No data available
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayItems.map((item, idx) => {
            const rawKey = String(item[labelKey] || item.CategoryName || item.StatusCode || `Item ${idx + 1}`).toUpperCase();
            const count = Number(item[valueKey]) || 0;
            const calculatedPct = totalCount > 0 ? Number(((count / totalCount) * 100).toFixed(1)) : 0;
            const pct = item[pctKey] !== undefined ? Number(item[pctKey]) : calculatedPct;

            let colorInfo = { bar: '#3b82f6', label: item[labelKey] || rawKey };
            if (type === 'priority') {
              colorInfo = PRIORITY_COLORS[rawKey] || colorInfo;
            } else if (type === 'status') {
              colorInfo = STATUS_COLORS[rawKey] || colorInfo;
            }

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {colorInfo.label || item[labelKey]}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    <strong>{count}</strong> ({pct}%)
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '6px',
                  background: 'rgba(148, 163, 184, 0.15)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${Math.min(pct, 100)}%`,
                    height: '100%',
                    borderRadius: '6px',
                    background: colorInfo.bar || '#3b82f6',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

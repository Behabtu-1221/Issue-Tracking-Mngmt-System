import React from 'react';
import { Clock, AlertTriangle, ShieldCheck, AlertOctagon, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import KPICard from '../KPICard';
import ReportDataTable from '../ReportDataTable';
import RadialGaugeChart from '../RadialGaugeChart';

export default function SlaTab({ data, loading, filters }) {
  const kpis = data?.kpis || {};
  const performanceByPriority = data?.performanceByPriority || [];
  const performanceByDepartment = data?.performanceByDepartment || [];
  const recentBreaches = data?.recentBreaches || [];

  const breachColumns = [
    {
      key: 'RequestNumber',
      label: 'Ticket #',
      sortable: true,
      render: (val) => <span style={{ fontWeight: 700, color: 'var(--accent-primary, #3b82f6)' }}>{val}</span>
    },
    { key: 'RequestTitle', label: 'Title', sortable: false },
    {
      key: 'BreachType',
      label: 'Breach Type',
      sortable: true,
      render: (val) => (
        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, background: val === 'RESOLUTION' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)', color: val === 'RESOLUTION' ? '#ef4444' : '#f97316' }}>
          {val}
        </span>
      )
    },
    {
      key: 'SeverityLevel',
      label: 'Severity',
      sortable: true,
      render: (val) => (
        <span style={{
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: '0.72rem',
          background: val === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          color: val === 'CRITICAL' ? '#ef4444' : '#f59e0b'
        }}>
          {val}
        </span>
      )
    },
    { key: 'DepartmentName', label: 'Department', sortable: true },
    {
      key: 'ActualBreachDateTime',
      label: 'Breach Timestamp',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleString() : '—'
    },
    {
      key: 'IsAcknowledged',
      label: 'Audit Status',
      sortable: true,
      render: (val, row) => val ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success, #10b981)', fontSize: '0.75rem', fontWeight: 700 }}>
          <CheckCircle2 size={13} /> Acknowledged by {row.AcknowledgedByName || 'User'}
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 800 }}>
          <AlertCircle size={13} /> Unacknowledged
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SLA Gauges & Target Compliance Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.06) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.4fr)',
        gap: '24px',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
            <Clock size={12} /> Service Level Agreement Telemetry
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px' }}>
            Campus SLA Compliance & Risk Monitoring
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Automated monitoring tracking resolution deadlines, initial response targets, paused clock hold durations, and escalation violations across all tenant contracts.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.05)', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>LIVE RUNNING CLOCKS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3b82f6' }}>{kpis.activeRunningClocks || 0} active</div>
            </div>

            <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.05)', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PAUSED ON HOLD</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{kpis.pausedClocks || 0} paused</div>
            </div>

            <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.05)', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL BREACHES</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>{kpis.totalBreaches || 0} recorded</div>
            </div>
          </div>
        </div>

        {/* Dual SLA Speedometer Dials */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(15, 23, 42, 0.04)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(148, 163, 184, 0.15)'
        }}>
          <RadialGaugeChart
            value={kpis.resolutionCompliancePct || 0}
            title="Resolution SLA"
            subtitle="Target >= 90%"
            size={140}
            strokeWidth={12}
            targetValue={90}
          />

          <RadialGaugeChart
            value={kpis.responseCompliancePct || 0}
            title="Response SLA"
            subtitle="Target >= 95%"
            size={140}
            strokeWidth={12}
            targetValue={95}
          />
        </div>
      </div>

      {/* SLA Breakdown by Priority & Department */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800 }}>Compliance by Priority</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {performanceByPriority.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700 }}>{p.PriorityCode}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: p.CompliancePct >= 90 ? '#10b981' : p.CompliancePct >= 70 ? '#f59e0b' : '#ef4444' }}>
                      {p.CompliancePct}%
                    </strong> ({p.CompliantCount}/{p.TotalClocks} compliant)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '6px', background: 'rgba(148, 163, 184, 0.15)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(p.CompliancePct, 100)}%`,
                    height: '100%',
                    background: p.CompliancePct >= 90 ? '#10b981' : p.CompliancePct >= 70 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800 }}>Compliance by Department</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {performanceByDepartment.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700 }}>{d.DepartmentName}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: d.CompliancePct >= 90 ? '#10b981' : d.CompliancePct >= 70 ? '#f59e0b' : '#ef4444' }}>
                      {d.CompliancePct}%
                    </strong> ({d.CompliantCount}/{d.TotalClocks} compliant)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '6px', background: 'rgba(148, 163, 184, 0.15)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(d.CompliancePct, 100)}%`,
                    height: '100%',
                    background: d.CompliancePct >= 90 ? '#10b981' : d.CompliancePct >= 70 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Breaches Log */}
      <ReportDataTable
        title="Recent SLA Breach Violations & Acknowledgment Log"
        columns={breachColumns}
        data={recentBreaches}
        reportType="SLA_ANALYTICS"
        filters={filters}
        loading={loading}
      />
    </div>
  );
}

import React from 'react';
import {
  Activity, CheckCircle2, Clock, AlertTriangle, AlertOctagon,
  TrendingUp, ShieldAlert, BarChart3, Users, Zap, ArrowUpRight
} from 'lucide-react';
import KPICard from '../KPICard';
import TrendChart from '../TrendChart';
import DistributionBarChart from '../DistributionBarChart';
import RadialGaugeChart from '../RadialGaugeChart';

export default function ExecutiveTab({ data, loading }) {
  const kpis = data?.kpis || {};
  const volumeTrend = data?.volumeTrend || [];
  const priorityDistribution = data?.priorityDistribution || [];
  const statusDistribution = data?.statusDistribution || [];

  // Generate sparkline values from volumeTrend if available
  const sparklineData = volumeTrend.length > 2
    ? volumeTrend.map(d => Number(d.TotalCount) || 0)
    : [4, 7, 5, 9, 12, 10, 14];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome / Status Banner with Executive Dials */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%)',
        border: '1px solid rgba(37, 99, 235, 0.25)',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
        gap: '24px',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.2)', color: '#3b82f6', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
            <Activity size={12} /> Real-Time Operational Intelligence
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Campus Incident & Service Performance Overview
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Real-time cross-tenant telemetry aggregating incident throughput, SLA commitment adherence, and multi-department resolution speed across all campus facilities.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Resolution Velocity: <strong>{kpis.resolutionRatePct || 0}%</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Avg Turnaround: <strong>{kpis.avgResolutionHours || 0} hrs</strong>
              </span>
            </div>
          </div>
        </div>

        {/* SLA Dual Radial Gauges */}
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
            value={kpis.slaCompliancePct || 0}
            title="SLA Compliance"
            subtitle="Campus Target (90%)"
            size={135}
            strokeWidth={11}
          />

          <RadialGaugeChart
            value={kpis.resolutionRatePct || 0}
            title="Resolution Velocity"
            subtitle="Resolved vs Open"
            size={135}
            strokeWidth={11}
            targetValue={80}
          />
        </div>
      </div>

      {/* 4 Primary Executive KPI Cards with Sparklines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <KPICard
          title="Total Ticket Volume"
          value={loading ? '...' : kpis.totalRequests || 0}
          subtext={`${kpis.openRequests || 0} currently active / pending`}
          icon={Activity}
          iconBg="rgba(59, 130, 246, 0.15)"
          iconColor="#3b82f6"
          accentColor="#3b82f6"
          trend={{ direction: 'up', label: '+8.4%' }}
          sparkline={sparklineData}
          isLive={true}
        />

        <KPICard
          title="Resolution Velocity"
          value={loading ? '...' : `${kpis.resolutionRatePct || 0}%`}
          subtext={`${kpis.closedRequests || 0} resolved successfully`}
          icon={CheckCircle2}
          iconBg="rgba(16, 185, 129, 0.15)"
          iconColor="#10b981"
          accentColor="#10b981"
          trend={{ direction: kpis.resolutionRatePct >= 75 ? 'up' : 'neutral', label: 'Healthy Target' }}
        />

        <KPICard
          title="SLA Compliance Rate"
          value={loading ? '...' : `${kpis.slaCompliancePct || 0}%`}
          subtext={`${kpis.totalSlaBreaches || 0} total violations recorded`}
          icon={Clock}
          iconBg="rgba(245, 158, 11, 0.15)"
          iconColor="#f59e0b"
          accentColor="#f59e0b"
          badge={kpis.totalSlaBreaches > 0 ? { label: `${kpis.totalSlaBreaches} Breaches`, bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' } : null}
        />

        <KPICard
          title="Average Turnaround"
          value={loading ? '...' : `${kpis.avgResolutionHours || 0} hrs`}
          subtext={`Avg resolution cycle from creation`}
          icon={Zap}
          iconBg="rgba(168, 85, 247, 0.15)"
          iconColor="#a855f7"
          accentColor="#a855f7"
          trend={{ direction: 'neutral', label: 'Efficiency Index' }}
        />
      </div>

      {/* Secondary Operational Status Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '3px solid #6366f1' }}>
          <Activity size={18} color="#6366f1" />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Open Requests</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{kpis.openRequests || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '3px solid #ef4444' }}>
          <AlertOctagon size={18} color="#ef4444" />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Major Incidents</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>{kpis.majorIncidents || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '3px solid #f97316' }}>
          <Clock size={18} color="#f97316" />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Overdue Tickets</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f97316' }}>{kpis.overdueRequests || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '3px solid #eab308' }}>
          <ShieldAlert size={18} color="#eab308" />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Escalation Count</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{kpis.totalEscalations || 0}</div>
          </div>
        </div>
      </div>

      {/* Main Visuals Grid: Multi-Series Trend Chart & Priority Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)', gap: '20px' }}>
        <TrendChart
          data={volumeTrend}
          title="Campus Incident Volume & Resolution Trend"
          subtitle="Interactive daily trend comparing total incoming requests to resolved work"
          height={270}
        />

        <DistributionBarChart
          items={priorityDistribution}
          title="Volume by Priority Level"
          type="priority"
          labelKey="PriorityCode"
          valueKey="Count"
          pctKey="Pct"
        />
      </div>

      {/* Status Distribution Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '20px' }}>
        <DistributionBarChart
          items={statusDistribution}
          title="Lifecycle Status Breakdown"
          type="status"
          labelKey="StatusCode"
          valueKey="Count"
        />
      </div>
    </div>
  );
}

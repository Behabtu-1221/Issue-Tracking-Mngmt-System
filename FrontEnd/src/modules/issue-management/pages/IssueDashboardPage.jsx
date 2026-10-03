import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy, AlertCircle, CheckCircle2, XCircle, Clock, AlertTriangle,
  Home, ChevronRight, Activity, ExternalLink, ArrowUpRight, Plus,
  ListChecks, BookOpen, ShieldCheck, UserCheck, Play, Pause, RefreshCw, FileText
} from 'lucide-react';
import issueManagementApi from '../api/issueManagementApi';

export default function IssueDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await issueManagementApi.getOverviewMetrics();
      setMetrics(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch issue overview metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const m = metrics || {};

  // Status Cards covering the full 7-stage issue status lifecycle
  const statusCards = [
    { key: 'total', label: 'Total Requests', value: loading ? '...' : (m.totalIssues || 0), sub: 'All system requests', icon: ListChecks, color: 'var(--accent-primary)', bg: 'rgba(138, 75, 255, 0.15)', border: 'var(--accent-primary)', filter: '' },
    { key: 'new', label: 'New Requests', value: loading ? '...' : (m.newIssues || 0), sub: 'Awaiting triage', icon: AlertCircle, color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: '#60a5fa', filter: 'NEW' },
    { key: 'approved', label: 'Approved', value: loading ? '...' : (m.approvedIssues || m.newIssues || 0), sub: 'Verified & Approved', icon: ShieldCheck, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8', filter: 'APPROVED' },
    { key: 'assigned', label: 'Assigned', value: loading ? '...' : (m.assignedIssues || 0), sub: 'Dispatched to Agent', icon: UserCheck, color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: '#c084fc', filter: 'ASSIGNED' },
    { key: 'in_progress', label: 'In Progress', value: loading ? '...' : (m.inProgressIssues || 0), sub: 'Active Investigation', icon: Play, color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', border: '#facc15', filter: 'IN_PROGRESS' },
    { key: 'pending', label: 'Pending Hold', value: loading ? '...' : (m.pendingIssues || 0), sub: 'On Hold / Info Needed', icon: Pause, color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', border: '#fb923c', filter: 'PENDING' },
    { key: 'resolved', label: 'Resolved', value: loading ? '...' : (m.resolvedIssues || 0), sub: 'Solution Confirmed', icon: CheckCircle2, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80', filter: 'RESOLVED' },
    { key: 'closed', label: 'Closed', value: loading ? '...' : (m.closedIssues || 0), sub: 'Archived & Closed', icon: XCircle, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: '#94a3b8', filter: 'CLOSED' }
  ];

  // 7-Stage Status Flow Lifecycle Progression
  const lifecycleStages = [
    { code: 'NEW', label: '1. New', desc: 'Submitted by user', color: '#60a5fa' },
    { code: 'APPROVED', label: '2. Approved', desc: 'Validated by Manager', color: '#38bdf8' },
    { code: 'ASSIGNED', label: '3. Assigned', desc: 'Routed to Specialist', color: '#c084fc' },
    { code: 'IN_PROGRESS', label: '4. In Progress', desc: 'Active Troubleshooting', color: '#facc15' },
    { code: 'PENDING', label: '5. Pending', desc: 'Waiting for Feedback', color: '#fb923c' },
    { code: 'RESOLVED', label: '6. Resolved', desc: 'Fix verified', color: '#4ade80' },
    { code: 'CLOSED', label: '7. Closed', desc: 'Ticket finalized', color: '#94a3b8' }
  ];

  return (
    <div>
      {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              Issue Overview & <span className="glow-text">Analytics</span>
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Real-time issue tracking telemetry, 7-stage status lifecycle, and resolution SLAs
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '0.78rem', fontWeight: 700 }}>
              <Activity size={14} /> Live Issue Stream
            </span>
          </div>
        <div style={{ marginBottom: '24px' }}>
</div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {statusCards.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.key;
          return (
            <div key={card.key} className="glass-panel"
              onClick={() => navigate(`/issues/tracker${card.filter ? `?status=${card.filter}` : ''}`)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: '18px 16px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered ? `0 12px 28px -6px ${card.border}33` : 'none',
                borderTop: isHovered ? `2px solid ${card.border}` : '2px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '6px 0 2px', color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{card.sub}</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '12px', background: card.bg, color: card.color, transition: 'transform 0.3s', transform: isHovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(0) scale(1)' }}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7-Stage Status Lifecycle Pipeline */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Official 7-Stage Status Lifecycle Pipeline</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Standardized issue lifecycle flow from submission to resolution and closure
            </p>
          </div>
          <button onClick={() => navigate('/issues/status-flow')} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
            Workflow Details <ArrowUpRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', position: 'relative' }}>
          {lifecycleStages.map((stage, i) => (
            <div key={stage.code}
              onClick={() => navigate('/issues/status-flow')}
              style={{
                padding: '14px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = stage.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: stage.color, marginBottom: '4px' }}>{stage.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{stage.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Shortcuts Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Issue Request Shortcuts</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Issue Requests Tracker', icon: ListChecks, route: '/issues/tracker' },
            { label: 'Status Lifecycle Flow', icon: RefreshCw, route: '/issues/status-flow' },
            { label: 'Known Issues & KB', icon: BookOpen, route: '/issues/known' }
          ].map((s) => {
            const ShortIcon = s.icon;
            return (
              <button key={s.label} onClick={() => navigate(s.route)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-gradient)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <ShortIcon size={14} /> {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Inbox, Wrench, Users, Clock, CheckCircle2,
  Home, ChevronRight, Activity, ExternalLink, ArrowUpRight,
  BarChart2, RefreshCw
} from 'lucide-react';
import dispatchApi from '../api/dispatchApi';

export default function DispatchDashboardPage() {
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
      const res = await dispatchApi.getOverviewMetrics();
      setMetrics(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch dispatch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const m = metrics || {};

  const kpiCards = [
    { key: 'unassigned', label: 'Unassigned Backlog', value: loading ? '...' : (m.unassignedCount || 0), sub: 'Awaiting technician assignment', icon: Inbox, color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: '#f87171', route: '/dispatch/queue' },
    { key: 'assigned', label: 'In Progress Jobs', value: loading ? '...' : (m.inProgressCount || 0), sub: 'Technicians on-site working', icon: Wrench, color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', border: '#facc15', route: '/dispatch/workbench' },
    { key: 'techs', label: 'Technician Roster', value: loading ? '...' : (m.totalTechnicians || 0), sub: `${m.availableTechnicians || 0} Available Techs`, icon: Users, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: '#60a5fa', route: '/dispatch/roster' },
    { key: 'resolved', label: 'Resolved Workloads', value: loading ? '...' : (m.resolvedTodayCount || m.assignedCount || 0), sub: 'Fulfillments completed', icon: CheckCircle2, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80', route: '/dispatch/queue' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              Dispatch Overview & <span className="glow-text">Analytics</span>
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Workload distribution, field technician availability, and dispatch assignment routing
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 700 }}>
              <Activity size={14} /> Real-Time Field Dispatch Active
            </span>
          </div>
        <div style={{ marginBottom: '24px' }}>
</div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.key;
          return (
            <div key={card.key} className="glass-panel"
              onClick={() => navigate(card.route)}
              onMouseEnter={() => setHoveredCard(card.key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: '22px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered ? `0 12px 28px -6px ${card.border}33` : 'none',
                borderTop: isHovered ? `2px solid ${card.border}` : '2px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0 4px', color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.sub}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '14px', background: card.bg, color: card.color, transition: 'transform 0.3s', transform: isHovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(0) scale(1)' }}>
                  <Icon size={24} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '14px', fontSize: '0.72rem', fontWeight: 600, color: card.color, opacity: isHovered ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                <ExternalLink size={11} /> Open sub-module view
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch Pipeline Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Dispatcher Queue */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Dispatcher Workload Queue</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unassigned issues and manual dispatch routing</p>
            </div>
            <button onClick={() => navigate('/dispatch/queue')} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
              View Queue <ArrowUpRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/dispatch/queue')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}><Inbox size={20} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Unassigned Request Backlog</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.unassignedCount || 0} issues waiting to be assigned</div>
                </div>
              </div>
              <span className="badge badge-danger">High Priority</span>
            </div>
          </div>
        </div>

        {/* Technician Workbench & Roster */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Field Technicians</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active workbenches & team availability roster</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div onClick={() => navigate('/dispatch/workbench')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(250,204,21,0.15)', color: '#facc15', width: 'fit-content', marginBottom: '10px' }}><Wrench size={18} /></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Workbench</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>Tech Workbench</div>
            </div>
            <div onClick={() => navigate('/dispatch/roster')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(96,165,250,0.15)', color: '#60a5fa', width: 'fit-content', marginBottom: '10px' }}><Users size={18} /></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Team Roster</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>Availability</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Dispatch Shortcuts</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Dispatcher Queue & Routing', icon: Inbox, route: '/dispatch/queue' },
            { label: 'Technician Workbench', icon: Wrench, route: '/dispatch/workbench' },
            { label: 'Team Roster & Availability', icon: Users, route: '/dispatch/roster' }
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

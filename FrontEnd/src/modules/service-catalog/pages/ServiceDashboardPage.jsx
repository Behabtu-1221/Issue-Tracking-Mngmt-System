import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, FolderKanban, Layers, DollarSign, FileText, ShieldCheck,
  Home, ChevronRight, Activity, ExternalLink, ArrowUpRight,
  Tag, Zap, TrendingUp, CheckCircle2, Settings, Clock, BarChart3,
  Send, Users, ShieldAlert, ArrowRight
} from 'lucide-react';
import serviceCatalogApi from '../api/serviceCatalogApi';

export default function ServiceDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [ecoMetrics, setEcoMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => { fetchMetrics(); }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [resOverview, resEco] = await Promise.all([
        serviceCatalogApi.getOverviewMetrics(),
        serviceCatalogApi.getEcosystemAnalytics()
      ]);
      setMetrics(resOverview.data?.data || null);
      setEcoMetrics(resEco.data?.data || null);
    } catch (err) { console.error('Failed to load catalog metrics:', err); }
    finally { setLoading(false); }
  };

  const m = metrics || {};
  const eco = ecoMetrics || {};
  const ecoSummary = eco.summary || {};

  const kpiCards = [
    { key: 'categories', label: 'Service Categories', value: loading ? '...' : `${m.totalCategories || ecoSummary.TotalCategories || 0} Categories`, sub: 'Organized service taxonomy', subColor: 'var(--accent-primary)', icon: FolderKanban, iconBg: 'rgba(138,75,255,0.15)', iconColor: 'var(--accent-primary)', borderAccent: 'var(--accent-primary)', route: '/services/categories' },
    { key: 'services', label: 'Services Offered', value: loading ? '...' : `${m.totalServices || ecoSummary.TotalActiveServices || 0} Services`, sub: `${m.activeServices || ecoSummary.TotalActiveServices || 0} Active & Published`, subColor: 'var(--color-success)', icon: Layers, iconBg: 'rgba(14,165,233,0.15)', iconColor: '#0ea5e9', borderAccent: '#0ea5e9', route: '/services/directory' },
    { key: 'active', label: 'Service Requests', value: loading ? '...' : `${ecoSummary.TotalServiceRequests || 0} Submitted`, sub: 'Linked to Service Catalog', subColor: 'var(--color-info)', icon: Tag, iconBg: 'rgba(16,185,129,0.15)', iconColor: 'var(--color-success)', borderAccent: 'var(--color-success)', route: '/issues/directory' },
    { key: 'billable', label: 'Billable Offerings', value: loading ? '...' : `${m.billableServices || 0} Billable`, sub: 'Paid service delivery models', subColor: 'var(--color-warning)', icon: DollarSign, iconBg: 'rgba(245,158,11,0.15)', iconColor: 'var(--color-warning)', borderAccent: 'var(--color-warning)', route: '/services/pricing' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              Catalog Overview & <span className="glow-text">BI Telemetry</span>
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Service portfolio analytics, automated approval routing, dispatch SLA clocks, and BI intelligence
            </p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9', fontSize: '0.78rem', fontWeight: 700 }}>
            <Activity size={14} /> Ecosystem Integrated (5 Modules)
          </span>
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
                boxShadow: isHovered ? `0 12px 28px -6px ${card.borderAccent}33` : 'none',
                borderTop: isHovered ? `2px solid ${card.borderAccent}` : '2px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '8px 0 4px', lineHeight: 1.1 }}>{card.value}</div>
                  <div style={{ fontSize: '0.75rem', color: card.subColor, fontWeight: 500 }}>{card.sub}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '14px', background: card.iconBg, color: card.iconColor, transition: 'transform 0.3s', transform: isHovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(0) scale(1)' }}>
                  <Icon size={24} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '14px', fontSize: '0.72rem', fontWeight: 600, color: card.iconColor, opacity: isHovered ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                <ExternalLink size={11} /> Click to view details
              </div>
            </div>
          );
        })}
      </div>

      {/* Integrated Ecosystem Telemetry Panel (5 Modules) */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', borderLeft: '4px solid var(--accent-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--accent-primary)" /> Service Catalog Multi-Module Ecosystem Pipeline
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Real-time synchronization across Issue Requests, Approvals, Dispatch, SLA Clocks, and BI Analytics
            </p>
          </div>
          <button onClick={fetchMetrics} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}>
            Sync Live Telemetry
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Module 1: Issue Requests */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '8px' }}>
              <FileText size={14} /> 1. ISSUE REQUESTS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{ecoSummary.TotalServiceRequests || 0}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Requests logged via Catalog</div>
          </div>

          {/* Module 2: Approvals */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: '8px' }}>
              <ShieldCheck size={14} /> 2. APPROVAL RULES
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{ecoSummary.TotalApprovedRequests || 0}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Workflow approvals finalized</div>
          </div>

          {/* Module 3: Dispatch */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#0ea5e9', marginBottom: '8px' }}>
              <Users size={14} /> 3. DISPATCH & ROSTER
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>Auto-Routed</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Department & Skill Queued</div>
          </div>

          {/* Module 4: SLA Clocks */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '8px' }}>
              <Clock size={14} /> 4. SLA TARGETS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{ecoSummary.ActiveSLAClocks || 0}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Active SLA Timers Running</div>
          </div>

          {/* Module 5: BI Analytics */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '8px' }}>
              <BarChart3 size={14} /> 5. BI ANALYTICS
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{ecoSummary.TotalCatalogPricingValue ? `${ecoSummary.TotalCatalogPricingValue} ETB` : 'Active'}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Total Catalog Valuation</div>
          </div>
        </div>
      </div>

      {/* Analytics Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Service Delivery Pipeline */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Service Delivery Pipeline</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Core service offerings and fulfillment configurations</p>
            </div>
            <button onClick={() => navigate('/services/directory')} style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#0ea5e9', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', transition: 'all 0.2s' }}>
              View Services <ArrowUpRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Service Directory', sub: `${m.totalServices || ecoSummary.TotalActiveServices || 0} registered service definitions`, icon: Layers, color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', badge: 'Active', badgeClass: 'badge-info', route: '/services/directory' },
              { label: 'Pricing & Billing Models', sub: `${m.billableServices || 0} billable service configurations`, icon: DollarSign, color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.15)', badge: 'Configured', badgeClass: 'badge-warning', route: '/services/pricing' }
            ].map((item, i) => (
              <div key={i} onClick={() => navigate(item.route)} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = item.color; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ padding: '10px', borderRadius: '10px', background: item.bg, color: item.color }}><item.icon size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.sub}</div>
                  </div>
                </div>
                <span className={`badge ${item.badgeClass}`}>{item.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Governance & Requirements */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Governance & Configuration</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Approval workflows, form requirements, and routing rules</p>
            </div>
            <button onClick={() => navigate('/services/governance')} style={{ background: 'rgba(138,75,255,0.1)', border: '1px solid rgba(138,75,255,0.3)', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', transition: 'all 0.2s' }}>
              View Rules <ArrowUpRight size={13} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Form Requirements', sub: 'Dynamic Fields & Files', icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', route: '/services/requirements' },
              { label: 'Governance Rules', sub: 'Approval & Routing', icon: ShieldCheck, color: 'var(--accent-primary)', bg: 'rgba(138,75,255,0.15)', route: '/services/governance' }
            ].map((item, i) => (
              <div key={i} onClick={() => navigate(item.route)} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = item.color; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: item.bg, color: item.color, width: 'fit-content', marginBottom: '10px' }}><item.icon size={18} /></div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shortcuts Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Service Catalog Shortcuts</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Service Directory', icon: Layers, route: '/services/directory' },
            { label: 'Categories', icon: FolderKanban, route: '/services/categories' },
            { label: 'Pricing & Billing', icon: DollarSign, route: '/services/pricing' },
            { label: 'Form Requirements', icon: FileText, route: '/services/requirements' },
            { label: 'Governance Rules', icon: ShieldCheck, route: '/services/governance' }
          ].map((s) => {
            const ShortIcon = s.icon;
            return (
              <button key={s.label} onClick={() => navigate(s.route)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.25s' }}
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

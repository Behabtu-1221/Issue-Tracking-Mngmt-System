import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Clock, CheckCircle2, XCircle, AlertCircle,
  Home, ChevronRight, Activity, ExternalLink, ArrowUpRight, Plus,
  Layers, UserCheck, ShieldCheck, RefreshCw, FileText
} from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';
import approvalApi from '../api/approvalApi';

export default function ApprovalDashboardPage() {
  const { t } = useTranslation();
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
      const res = await approvalApi.getMetrics();
      setMetrics(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch approval metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const m = metrics || {};

  const kpiCards = [
    { key: 'total', label: t('approval.metrics.totalWorkflows', 'Total Workflows'), value: loading ? '...' : (m.total || 0), sub: t('approval.metrics.totalSubtext', 'Initiated governance chains'), icon: Layers, color: 'var(--accent-primary)', bg: 'rgba(138, 75, 255, 0.15)', border: 'var(--accent-primary)', filter: 'ALL' },
    { key: 'pending', label: t('approval.metrics.pendingAction', 'Pending My Action'), value: loading ? '...' : (m.pending || 0), sub: t('approval.metrics.pendingSubtext', 'Awaiting decision log'), icon: Clock, color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', border: '#facc15', filter: 'PENDING' },
    { key: 'approved', label: t('approval.metrics.approvedRequests', 'Approved Workflows'), value: loading ? '...' : (m.approved || 0), sub: t('approval.metrics.approvedSubtext', 'Successfully passed'), icon: CheckCircle2, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80', filter: 'APPROVED' },
    { key: 'rejected', label: t('approval.metrics.rejectedReturned', 'Rejected / Declined'), value: loading ? '...' : (m.rejected || 0), sub: t('approval.status.rejected', 'Governance rejected'), icon: XCircle, color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: '#f87171', filter: 'REJECTED' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {t('approval.title', 'Approval Overview')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('approval.subtitle', 'Multi-level governance telemetry, decision recording, delegation matrix, and audit trails')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 700 }}>
            <Activity size={14} /> {t('common.status', 'Governance Telemetry Active')}
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
              onClick={() => navigate(`/approvals/queue?status=${card.filter}`)}
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
                <ExternalLink size={11} /> Filter queue by this state
              </div>
            </div>
          );
        })}
      </div>

      {/* Governance & Delegation Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Workflows & Queue */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {t('approval.tabs.queue', 'Approvals & Queue')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {t('approval.subtitle', 'Active approval requests and decision logs')}
              </p>
            </div>
            <button onClick={() => navigate('/approvals/queue')} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
              {t('approval.table.actions', 'View Queue')} <ArrowUpRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/approvals/queue')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(250,204,21,0.15)', color: '#facc15' }}><Clock size={20} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                    {t('approval.metrics.pendingAction', 'Pending Action Queue')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {m.pending || 0} {t('approval.metrics.pendingSubtext', 'requests awaiting decision')}
                  </div>
                </div>
              </div>
              <span className="badge badge-warning">
                {t('approval.status.pending', 'Action Needed')}
              </span>
            </div>
          </div>
        </div>

        {/* Governance Rules & Delegations */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {t('approval.rules.title', 'Governance & Delegations')}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {t('approval.rules.subtitle', 'Approval threshold rules & temporary delegations')}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div onClick={() => navigate('/approvals/delegations')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', width: 'fit-content', marginBottom: '10px' }}><UserCheck size={18} /></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('approval.tabs.delegations', 'Delegations')}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>{t('approval.delegations.title', 'Delegate Matrix')}</div>
            </div>
            <div onClick={() => navigate('/approvals/rules')} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(138,75,255,0.15)', color: 'var(--accent-primary)', width: 'fit-content', marginBottom: '10px' }}><ShieldCheck size={18} /></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('approval.rules.title', 'Governance')}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>{t('approval.tabs.rules', 'Rules & Groups')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t('common.actions', 'Approval System Shortcuts')}</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: t('approval.tabs.queue', 'Approvals & Queue'), icon: Layers, route: '/approvals/queue' },
            { label: t('approval.tabs.delegations', 'Delegation Matrix'), icon: UserCheck, route: '/approvals/delegations' },
            { label: t('approval.tabs.rules', 'Rules & Groups'), icon: ShieldCheck, route: '/approvals/rules' }
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

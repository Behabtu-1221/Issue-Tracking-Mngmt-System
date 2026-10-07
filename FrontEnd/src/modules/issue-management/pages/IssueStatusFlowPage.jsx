import React from 'react';
import { CheckCircle2, AlertCircle, ShieldCheck, UserCheck, Play, Pause, XCircle, ArrowRight, MoveHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../i18n';

export default function IssueStatusFlowPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const statuses = [
    {
      code: 'NEW',
      name: t('issues.statusNew', 'New'),
      badge: 'badge-info',
      color: '#60a5fa',
      bg: 'rgba(96, 165, 250, 0.15)',
      icon: AlertCircle,
      desc: t('statusLifecycle.newDesc', 'Issue request submitted by tenant or park staff. Awaiting initial triage and review.'),
      next: ['APPROVED', 'ASSIGNED', 'CANCELLED']
    },
    {
      code: 'APPROVED',
      name: t('issues.statusApproved', 'Approved'),
      badge: 'badge-primary',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
      icon: ShieldCheck,
      desc: t('statusLifecycle.approvedDesc', 'Request validated and approved by facility manager for dispatch and resource allocation.'),
      next: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED']
    },
    {
      code: 'ASSIGNED',
      name: t('issues.statusAssigned', 'Assigned'),
      badge: 'badge-secondary',
      color: '#c084fc',
      bg: 'rgba(192, 132, 252, 0.15)',
      icon: UserCheck,
      desc: t('statusLifecycle.assignedDesc', 'Dispatched to a designated technician, maintenance team, or vendor team.'),
      next: ['IN_PROGRESS', 'PENDING', 'CANCELLED']
    },
    {
      code: 'IN_PROGRESS',
      name: t('issues.statusInProgress', 'In Progress'),
      badge: 'badge-warning',
      color: '#facc15',
      bg: 'rgba(250, 204, 21, 0.15)',
      icon: Play,
      desc: t('statusLifecycle.inProgressDesc', 'Technician actively troubleshooting, repairing, or fulfilling the issue on-site.'),
      next: ['PENDING', 'RESOLVED', 'CANCELLED']
    },
    {
      code: 'PENDING',
      name: t('issues.statusPending', 'Pending'),
      badge: 'badge-warning',
      color: '#fb923c',
      bg: 'rgba(251, 146, 60, 0.15)',
      icon: Pause,
      desc: t('statusLifecycle.pendingDesc', 'Temporarily on hold awaiting external spare parts, tenant access, or info.'),
      next: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED']
    },
    {
      code: 'RESOLVED',
      name: t('issues.statusResolved', 'Resolved'),
      badge: 'badge-success',
      color: '#4ade80',
      bg: 'rgba(74, 222, 128, 0.15)',
      icon: CheckCircle2,
      desc: t('statusLifecycle.resolvedDesc', 'Maintenance complete. Resolution confirmed and verified by lead engineer.'),
      next: ['CLOSED']
    },
    {
      code: 'CLOSED',
      name: t('issues.statusClosed', 'Closed'),
      badge: 'badge-dark',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.15)',
      icon: XCircle,
      desc: t('statusLifecycle.closedDesc', 'Ticket archived after tenant sign-off and SLA feedback log.'),
      next: []
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          {t('statusLifecycle.title', 'Official 7-Stage Status Lifecycle')}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('statusLifecycle.subtitle', 'Standardized state transition rules: New ➔ Approved ➔ Assigned ➔ In Progress ➔ Pending ➔ Resolved ➔ Closed')}
        </p>
      </div>

      {/* Horizontal Lifecycle Stepper Ribbon */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', borderRadius: 'var(--border-radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {t('statusLifecycle.pipelineTitle', 'Sequential Lifecycle Pipeline')}
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-tertiary)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--glass-border)'
          }}>
            <MoveHorizontal size={13} color="var(--accent-primary)" />
            <span>{t('statusLifecycle.scrollEnabled', 'Horizontal Scroll Enabled')}</span>
          </div>
        </div>

        <div className="table-scroll-container" tabIndex={0} role="region" aria-label="Status Lifecycle Pipeline">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '950px', paddingBottom: '8px' }}>
            {statuses.map((st, index) => {
              const Icon = st.icon;
              const isLast = index === statuses.length - 1;
              return (
                <React.Fragment key={st.code}>
                  <div
                    onClick={() => navigate(`/issues/tracker?status=${st.code}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: 'var(--bg-tertiary)',
                      border: `1px solid ${st.bg}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    title={t('statusLifecycle.clickToView', { name: st.name }, `Click to view tickets with status ${st.name}`)}
                    className="table-row-hover"
                  >
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: st.bg,
                      color: st.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{st.name}</div>
                      <div style={{ fontSize: '0.7rem', color: st.color, fontWeight: 600 }}>{t('statusLifecycle.stagePrefix', 'Stage')} {index + 1}</div>
                    </div>
                  </div>
                  {!isLast && (
                    <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Pipeline Stepper */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
          {t('statusLifecycle.transitionFlow', 'State Transition Flow')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {statuses.map((st, index) => {
            const Icon = st.icon;
            return (
              <div key={st.code} style={{
                padding: '20px', borderRadius: '14px', background: 'var(--bg-tertiary)',
                border: `1px solid var(--glass-border)`, position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', background: st.bg, color: st.color }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{st.name}</div>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem', background: st.bg, color: st.color }}>
                      {t('statusLifecycle.stagePrefix', 'Stage')} {index + 1}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.4 }}>
                  {st.desc}
                </p>

                {st.next.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{t('statusLifecycle.validNextStates', 'Valid next states:')}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {st.next.map(n => (
                        <span key={n} style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

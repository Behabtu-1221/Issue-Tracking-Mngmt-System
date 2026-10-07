import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, CheckSquare, Clock, AlertTriangle, Play, Pause, RefreshCw,
  BookOpen, ChevronRight, CheckCircle2, User, Building, ArrowRight,
  ShieldAlert, Activity, FileText, Bell, Sparkles, Filter, Search, Eye, ListChecks
} from 'lucide-react';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import technicianApi from '../api/technicianApi';
import { useTranslation } from '../../../i18n';

export default function TechnicianDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = usePermissionContext();

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [metrics, setMetrics] = useState({
    assigned: 0,
    newAssignments: 0,
    inProgress: 0,
    pending: 0,
    resolved: 0,
    slaAtRisk: 0
  });

  const currentUserId = user?.UserID || user?.userId;

  useEffect(() => {
    if (currentUserId) {
      fetchDashboardData();
    }
  }, [currentUserId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await technicianApi.getAssignedRequests({ assignedUserId: currentUserId, limit: 100 });
      const items = res.data?.data?.assignments || res.data?.data || [];
      const list = Array.isArray(items) ? items : [];
      setAssignments(list);

      // Compute operational metrics
      const assigned = list.filter(a => ['ASSIGNED', 'NEW'].includes((a.AssignmentStatusCode || a.RequestStatusCode || '').toUpperCase())).length;
      const newAssignments = list.filter(a => (a.AssignmentStatusCode || '').toUpperCase() === 'ASSIGNED').length;
      const inProgress = list.filter(a => ['IN_PROGRESS', 'ACCEPTED'].includes((a.AssignmentStatusCode || a.RequestStatusCode || '').toUpperCase())).length;
      const pending = list.filter(a => ['PAUSED', 'PENDING'].includes((a.AssignmentStatusCode || a.RequestStatusCode || '').toUpperCase())).length;
      const resolved = list.filter(a => ['COMPLETED', 'RESOLVED', 'CLOSED'].includes((a.AssignmentStatusCode || a.RequestStatusCode || '').toUpperCase())).length;
      const slaAtRisk = list.filter(a => (a.PriorityCode || '').toUpperCase() === 'CRITICAL' || (a.PriorityCode || '').toUpperCase() === 'HIGH').length;

      setMetrics({
        assigned,
        newAssignments,
        inProgress,
        pending,
        resolved,
        slaAtRisk
      });
    } catch (err) {
      console.error('Failed to load technician dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priorityStr) => {
    const p = (priorityStr || '').toUpperCase();
    switch (p) {
      case 'CRITICAL':
      case 'URGENT':
        return { label: t('issues.priorityUrgent', 'Urgent'), bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'HIGH':
        return { label: t('issues.priorityHigh', 'High'), bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'LOW':
        return { label: t('issues.priorityLow', 'Low'), bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
      default:
        return { label: t('issues.priorityMedium', 'Medium'), bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || '').toUpperCase();
    switch (s) {
      case 'ASSIGNED':
      case 'NEW':
        return { label: t('issues.statusAssigned', 'Assigned'), bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return { label: t('issues.statusInProgress', 'In Progress'), bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(234, 179, 8, 0.3)' };
      case 'PAUSED':
      case 'PENDING':
        return { label: t('issues.statusPending', 'Pending'), bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' };
      case 'COMPLETED':
      case 'RESOLVED':
        return { label: t('issues.statusResolved', 'Resolved'), bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' };
      default:
        return { label: s || t('issues.statusSubmitted', 'Active'), bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const activeWorklist = assignments.filter(a => !['COMPLETED', 'RESOLVED', 'CLOSED'].includes((a.AssignmentStatusCode || a.RequestStatusCode || '').toUpperCase()));
  const highPriorityList = activeWorklist.filter(a => ['CRITICAL', 'HIGH'].includes((a.PriorityCode || '').toUpperCase()));
  const recentlyResolvedList = assignments.filter(a => ['COMPLETED', 'RESOLVED', 'CLOSED'].includes((a.AssignmentStatusCode || a.RequestStatusCode || '').toUpperCase())).slice(0, 5);

  const fName = user?.FirstName || user?.firstName || 'Technician';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}>
      {/* ── HEADER BANNER ── */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(147, 51, 234, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '12px',
              background: 'var(--accent-gradient)', color: '#ffffff',
              fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {t('technician.workbench', 'Field Operations Workbench')}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            {t('technician.welcomeBack', 'Welcome Back')}, <span className="glow-text">{fName}</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('technician.deskSubtitle', 'Track assigned service requests, record technical diagnostics, and resolve field dispatches.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchDashboardData}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: 'var(--border-radius-sm)',
              background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> {t('technician.refreshRoster', 'Refresh Roster')}
          </button>
          <button
            onClick={() => navigate('/technician/assigned')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: 'var(--border-radius-sm)',
              background: 'var(--accent-gradient)', border: 'none',
              color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: 'var(--glow-accent)'
            }}
          >
            <Wrench size={14} /> {t('technician.myAssignedRequests', 'My Assigned Requests')} ({activeWorklist.length})
          </button>
        </div>
      </div>

      {/* ── KPI CARDS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: t('technician.assignedWorkload', 'Assigned Requests'), count: metrics.assigned, icon: Wrench, color: '#c084fc', path: '/technician/assigned' },
          { label: t('technician.newAssignments', 'New Assignments'), count: metrics.newAssignments, icon: Sparkles, color: '#60a5fa', path: '/technician/assigned' },
          { label: t('technician.inProgress', 'In Progress'), count: metrics.inProgress, icon: RefreshCw, color: '#facc15', path: '/technician/in-progress' },
          { label: t('technician.pending', 'Pending'), count: metrics.pending, icon: Clock, color: '#fb923c', path: '/technician/pending' },
          { label: t('technician.resolved', 'Resolved'), count: metrics.resolved, icon: CheckCircle2, color: '#4ade80', path: '/technician/resolved' },
          { label: t('technician.slaAtRisk', 'SLA At Risk'), count: metrics.slaAtRisk, icon: AlertTriangle, color: '#f87171', path: '/technician/assigned?priority=HIGH' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-panel"
              onClick={() => navigate(card.path)}
              style={{
                padding: '18px 20px', borderRadius: '14px', cursor: 'pointer',
                transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '10px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = card.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{card.label}</span>
                <div style={{ padding: '8px', borderRadius: '10px', background: `${card.color}15`, color: card.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {loading ? '...' : card.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── QUICK ACTIONS TOOLBAR ── */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t('technician.quickNav', 'Quick Navigation')}:
        </span>
        <button
          onClick={() => navigate('/technician/assigned')}
          style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ListChecks size={14} color="var(--accent-primary)" /> {t('technician.viewAssigned', 'View Assigned Requests')}
        </button>
        <button
          onClick={() => navigate('/technician/assigned?priority=HIGH')}
          style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <AlertTriangle size={14} color="#f87171" /> {t('technician.viewHighPriority', 'View High Priority')}
        </button>
        <button
          onClick={() => navigate('/technician/pending')}
          style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Clock size={14} color="#fb923c" /> {t('technician.viewPending', 'View Pending')}
        </button>
        <button
          onClick={() => navigate('/issues/known')}
          style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <BookOpen size={14} color="#60a5fa" /> {t('technician.openKnowledgeBase', 'Open Knowledge Base')}
        </button>
      </div>

      {/* ── MAIN WORKBENCH GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left Column: Active Assigned Work */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t('technician.activeQueue', 'Active Assigned Work Queue')}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('technician.activeQueueDesc', 'Requests currently assigned to your roster requiring field acceptance or technical progress.')}
                </p>
              </div>
              <button
                onClick={() => navigate('/technician/assigned')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {t('technician.viewAllWithCount', 'View All')} ({activeWorklist.length}) <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {t('common.loading', 'Loading assigned workload...')}
              </div>
            ) : activeWorklist.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                <CheckCircle2 size={32} color="#4ade80" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{t('technician.allClear', 'All Assigned Requests Clear!')}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{t('technician.noPendingWork', 'You currently have no pending field work orders.')}</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>{t('issues.ticketNumber', 'Request #')}</th>
                      <th style={{ padding: '10px 12px' }}>{t('technician.subject', 'Subject')}</th>
                      <th style={{ padding: '10px 12px' }}>{t('issues.service', 'Service')}</th>
                      <th style={{ padding: '10px 12px' }}>{t('issues.priority', 'Priority')}</th>
                      <th style={{ padding: '10px 12px' }}>{t('issues.status', 'Status')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>{t('common.actions', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeWorklist.slice(0, 8).map(item => {
                      const pBadge = getPriorityBadge(item.PriorityCode);
                      const sBadge = getStatusBadge(item.AssignmentStatusCode || item.RequestStatusCode);
                      const assignmentId = item.AssignmentID || item.id;

                      return (
                        <tr key={assignmentId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                            {item.RequestNumber || `#${item.RequestID}`}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.RequestTitle || item.Title}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                            {item.ServiceName || 'General Support'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', background: pBadge.bg, color: pBadge.color, border: `1px solid ${pBadge.border}`, fontSize: '0.72rem', fontWeight: 700 }}>
                              {pBadge.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', background: sBadge.bg, color: sBadge.color, border: `1px solid ${sBadge.border}`, fontSize: '0.72rem', fontWeight: 700 }}>
                              {sBadge.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => navigate(`/technician/request/${assignmentId}`)}
                              style={{
                                padding: '6px 12px', borderRadius: '6px',
                                background: 'var(--accent-gradient)', border: 'none',
                                color: '#ffffff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <Eye size={12} /> {t('technician.openWorkspace', 'Open Workspace')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: High Priority & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* High Priority Emergency Requests */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#f87171', fontWeight: 700, fontSize: '0.92rem' }}>
              <ShieldAlert size={18} /> {t('technician.highPriorityDispatches', 'High Priority Dispatches')}
            </div>
            {highPriorityList.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                {t('technician.noCriticalTickets', 'No active critical or high priority tickets.')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {highPriorityList.map(item => (
                  <div
                    key={item.AssignmentID || item.id}
                    onClick={() => navigate(`/technician/request/${item.AssignmentID || item.id}`)}
                    style={{
                      padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)', cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>
                      {item.RequestNumber} • {item.PriorityCode}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {item.RequestTitle}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>👤 {item.RequesterName || 'Tenant Staff'}</span>
                      <span>📂 {item.ServiceName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Resolved Work */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#4ade80', fontWeight: 700, fontSize: '0.92rem' }}>
              <CheckCircle2 size={18} /> {t('technician.recentlyResolved', 'Recently Resolved')}
            </div>
            {recentlyResolvedList.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                {t('technician.noRecentTickets', 'No recently resolved tickets.')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentlyResolvedList.map(item => (
                  <div
                    key={item.AssignmentID || item.id}
                    onClick={() => navigate(`/technician/request/${item.AssignmentID || item.id}`)}
                    style={{
                      padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)',
                      border: '1px solid var(--glass-border)', cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.RequestTitle}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.RequestNumber} • {item.ServiceName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

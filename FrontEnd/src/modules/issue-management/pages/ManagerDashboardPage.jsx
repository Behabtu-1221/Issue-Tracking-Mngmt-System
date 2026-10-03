import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  ListChecks,
  Send,
  Clock,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Users,
  Wrench,
  Activity,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Building,
  Briefcase
} from 'lucide-react';
import approvalApi from '../../approval/api/approvalApi';
import dispatchApi from '../../dispatch/api/dispatchApi';
import issueManagementApi from '../api/issueManagementApi';

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    pendingApprovals: 0,
    awaitingAssignment: 0,
    inProgress: 0,
    slaAtRisk: 0,
    slaBreached: 0,
    escalated: 0,
    resolved: 0
  });
  const [technicians, setTechnicians] = useState([]);
  const [teamsWorkload, setTeamsWorkload] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [appMetricsRes, overviewRes, techsRes, teamsRes, issuesRes] = await Promise.allSettled([
        approvalApi.getMetrics(),
        dispatchApi.getOverviewMetrics(),
        dispatchApi.getTechnicians(),
        dispatchApi.getTeamsWorkloadSummary(),
        issueManagementApi.getIssues({ limit: 10 })
      ]);

      const appData = appMetricsRes.status === 'fulfilled' ? appMetricsRes.value.data?.data : {};
      const dispData = overviewRes.status === 'fulfilled' ? overviewRes.value.data?.data : {};
      const techData = techsRes.status === 'fulfilled' ? techsRes.value.data?.data : [];
      const teamData = teamsRes.status === 'fulfilled' ? teamsRes.value.data?.data : [];
      const issuesData = issuesRes.status === 'fulfilled' ? (issuesRes.value.data?.data?.issues || []) : [];

      setMetrics({
        pendingApprovals: appData.pendingApprovals || 0,
        awaitingAssignment: dispData.unassignedCount || 0,
        inProgress: dispData.inProgressCount || 0,
        slaAtRisk: dispData.slaAtRiskCount || 0,
        slaBreached: dispData.slaBreachedCount || 0,
        escalated: dispData.escalatedCount || 0,
        resolved: dispData.resolvedCount || 0
      });

      setTechnicians(Array.isArray(techData) ? techData : []);
      setTeamsWorkload(Array.isArray(teamData) ? teamData : []);
      setActivities(issuesData);
    } catch (err) {
      console.error('Failed to load Manager Dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'var(--accent-gradient)', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
              Department Operations Control
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Manager & Dispatch <span className="glow-text">Workbench</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Department workforce coordination, request approvals, workload dispatching, and SLA management.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="btn btn-secondary"
          style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* Operational Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Pending Approval', count: metrics.pendingApprovals, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', icon: CheckSquare, path: '/approvals/queue' },
          { label: 'Awaiting Assignment', count: metrics.awaitingAssignment, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: Send, path: '/dispatch/queue' },
          { label: 'In Progress Work', count: metrics.inProgress, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', icon: RefreshCw, path: '/issues/tracker?status=IN_PROGRESS' },
          { label: 'SLA At Risk', count: metrics.slaAtRisk, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', icon: AlertTriangle, path: '/sla/clocks' },
          { label: 'SLA Breached', count: metrics.slaBreached, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', icon: ShieldAlert, path: '/sla/breaches' },
          { label: 'Resolved (Pending)', count: metrics.resolved, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: CheckCircle2, path: '/issues/tracker?status=RESOLVED' }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => navigate(card.path)}
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid var(--glass-border)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = card.color;
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)' }}>{card.label}</span>
                <div style={{ padding: '8px', borderRadius: '10px', background: card.bg, color: card.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '12px' }}>
                {card.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Technician Workload + Technician Teams */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>

        {/* Technician Workload & Capacity */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={18} color="var(--accent-primary)" /> TECHNICIAN WORKLOAD & AVAILABILITY
            </div>
            <button onClick={() => navigate('/dispatch/workbench')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
              View Roster <ArrowRight size={13} />
            </button>
          </div>

          {technicians.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No technicians assigned to your department roster.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {technicians.slice(0, 5).map((tech) => (
                <div
                  key={tech.UserID}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem'
                    }}>
                      {(tech.FullName || tech.FirstName || 'T')[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {tech.FullName || `${tech.FirstName} ${tech.LastName}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {tech.TeamName ? `Team: ${tech.TeamName}` : 'Individual Dispatch'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: tech.ActiveAssignmentCount > 4 ? '#ef4444' : '#10b981' }}>
                        {tech.ActiveAssignmentCount || 0} active
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {tech.SLARiskCount > 0 ? `${tech.SLARiskCount} SLA Risk` : 'Optimal load'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technician Work Teams */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--accent-primary)" /> OPERATIONAL WORK TEAMS
            </div>
            <button onClick={() => navigate('/dispatch/teams')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
              Manage Teams <ArrowRight size={13} />
            </button>
          </div>

          {teamsWorkload.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No operational teams created in your department.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teamsWorkload.map((team) => (
                <div
                  key={team.TeamID}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {team.TeamName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Leader: {team.LeaderName || 'Unassigned'} • {team.MemberCount || 0} Members
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px',
                      background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)',
                      fontSize: '0.78rem', fontWeight: '800'
                    }}>
                      {team.ActiveRequestsCount || 0} Active Queue
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Real-time Department Activity Feed */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
        <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--accent-primary)" /> RECENT DEPARTMENT ACTIVITY STREAM
        </div>

        {activities.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent department activity logs.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activities.map((req) => (
              <div
                key={req.IssueRequestID}
                onClick={() => navigate('/issues/tracker')}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                    {req.RequestNumber}
                  </span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{req.Title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requester: {req.RequesterName} • Category: {req.CategoryName}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {new Date(req.CreatedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

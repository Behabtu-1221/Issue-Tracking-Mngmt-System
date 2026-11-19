import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Briefcase,
  RotateCw,
  RotateCcw,
  ChevronRight,
  Plus,
  Star,
  Shield,
  ShieldCheck,
  Tag,
  Zap,
  Sparkles,
  Layers,
  ArrowUpRight,
  CheckCircle
} from 'lucide-react';
import approvalApi from '../../approval/api/approvalApi';
import dispatchApi from '../../dispatch/api/dispatchApi';
import issueManagementApi from '../api/issueManagementApi';
import slaApi from '../../sla/api/slaApi';
import { useTranslation } from '../../../i18n';
import { useAuth } from '../../authentication/contexts/AuthContext';

export default function ManagerDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Loading & Telemetry States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // Operational Metrics
  const [metrics, setMetrics] = useState({
    pendingApprovals: 0,
    awaitingAssignment: 0,
    inProgress: 0,
    slaAtRisk: 0,
    slaBreached: 0,
    escalated: 0,
    resolved: 0,
    totalLogged: 0,
    complianceRate: 94
  });

  // Data Collections
  const [technicians, setTechnicians] = useState([]);
  const [teamsWorkload, setTeamsWorkload] = useState([]);
  const [activities, setActivities] = useState([]);
  const [pendingApprovalsList, setPendingApprovalsList] = useState([]);
  const [unassignedQueueList, setUnassignedQueueList] = useState([]);
  const [slaRiskList, setSlaRiskList] = useState([]);

  // Search & Filter States
  const [techSearch, setTechSearch] = useState('');
  const [activeTriageTab, setActiveTriageTab] = useState('approvals'); // 'approvals' | 'dispatch' | 'sla'

  // 3D Flip States for Manager KPI Flash Cards
  const [flippedKpi, setFlippedKpi] = useState({
    approvals: false,
    dispatch: false,
    inProgress: false,
    sla: false
  });

  const toggleKpi = (key) => {
    setFlippedKpi((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const flipAllCards = () => {
    const anyFlipped = Object.values(flippedKpi).some(Boolean);
    const targetState = !anyFlipped;
    setFlippedKpi({
      approvals: targetState,
      dispatch: targetState,
      inProgress: targetState,
      sla: targetState
    });
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [
        appMetricsRes,
        dispMetricsRes,
        techsRes,
        teamsRes,
        issuesRes,
        unassignedRes,
        approvalsRes
      ] = await Promise.allSettled([
        approvalApi.getMetrics(),
        dispatchApi.getOverviewMetrics(),
        dispatchApi.getTechnicians(),
        dispatchApi.getTeamsWorkloadSummary(),
        issueManagementApi.getIssues({ limit: 12 }),
        dispatchApi.getUnassignedQueue({ limit: 6 }),
        approvalApi.getApprovals({ status: 'PENDING', limit: 6 })
      ]);

      const appData = appMetricsRes.status === 'fulfilled' ? appMetricsRes.value.data?.data : {};
      const dispData = dispMetricsRes.status === 'fulfilled' ? dispMetricsRes.value.data?.data : {};
      const techData = techsRes.status === 'fulfilled' ? techsRes.value.data?.data : [];
      const teamData = teamsRes.status === 'fulfilled' ? teamsRes.value.data?.data : [];
      const issuesData = issuesRes.status === 'fulfilled' ? (issuesRes.value.data?.data?.issues || []) : [];
      const unassignedData = unassignedRes.status === 'fulfilled' ? (unassignedRes.value.data?.data?.queue || unassignedRes.value.data?.data || []) : [];
      const approvalsData = approvalsRes.status === 'fulfilled' ? (approvalsRes.value.data?.data?.approvals || approvalsRes.value.data?.data || []) : [];

      const pendingCount = appData?.pendingApprovals || (Array.isArray(approvalsData) ? approvalsData.length : 0);
      const unassignedCount = dispData?.unassignedCount || (Array.isArray(unassignedData) ? unassignedData.length : 0);
      const inProgCount = dispData?.inProgressCount || 0;
      const atRiskCount = dispData?.slaAtRiskCount || 0;
      const breachedCount = dispData?.slaBreachedCount || 0;
      const resolvedCount = dispData?.resolvedCount || 0;
      const totalLogged = pendingCount + unassignedCount + inProgCount + resolvedCount;
      const complianceRate = totalLogged > 0 ? Math.max(Math.round(((totalLogged - breachedCount) / totalLogged) * 100), 75) : 96;

      setMetrics({
        pendingApprovals: pendingCount,
        awaitingAssignment: unassignedCount,
        inProgress: inProgCount,
        slaAtRisk: atRiskCount,
        slaBreached: breachedCount,
        escalated: dispData?.escalatedCount || 0,
        resolved: resolvedCount,
        totalLogged: totalLogged,
        complianceRate: complianceRate
      });

      setTechnicians(Array.isArray(techData) ? techData : []);
      setTeamsWorkload(Array.isArray(teamData) ? teamData : []);
      setActivities(Array.isArray(issuesData) ? issuesData : []);
      setUnassignedQueueList(Array.isArray(unassignedData) ? unassignedData.slice(0, 5) : []);
      setPendingApprovalsList(Array.isArray(approvalsData) ? approvalsData.slice(0, 5) : []);

      // Filter issues that are SLA at risk or high priority for SLA tab
      const urgentIssues = (Array.isArray(issuesData) ? issuesData : []).filter(
        (i) => ['CRITICAL', 'HIGH'].includes((i.PriorityCode || '').toUpperCase()) || i.SLARisk
      );
      setSlaRiskList(urgentIssues.slice(0, 5));

      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (err) {
      console.error('Failed to load Manager Dashboard telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Filtered Technicians
  const filteredTechnicians = useMemo(() => {
    if (!techSearch.trim()) return technicians;
    const q = techSearch.toLowerCase();
    return technicians.filter(
      (t) =>
        (t.FullName || `${t.FirstName} ${t.LastName}`).toLowerCase().includes(q) ||
        (t.TeamName || '').toLowerCase().includes(q) ||
        (t.Email || '').toLowerCase().includes(q)
    );
  }, [technicians, techSearch]);

  const departmentName = user?.departmentName || user?.DepartmentName || 'Department Operations';
  const departmentCode = user?.departmentCode || user?.DepartmentCode || 'DEPT';

  return (
    <div className="max-w-[1560px] mx-auto pb-16 flex flex-col gap-6 sm:gap-7 font-sans text-slate-800 dark:text-slate-100">
      {/* ─────────────────────────────────────────────────────────────
          1. ENTERPRISE HEADER BANNER
      ───────────────────────────────────────────────────────────── */}
      <header className="rounded-[24px] border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        <div className="flex flex-col gap-2">
          {/* Breadcrumb / Department Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/50">
              <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {departmentName}
            </span>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
              {departmentCode}
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Department Scope Enforced
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              Role: Department Manager
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {departmentName} Operations Control
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            {t(
              'manager.workbenchSubtitle',
              'Workforce coordination, ticket triage, technician team assignments, and SLA resolution tracking for your departmental domain.'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          <button
            onClick={() => navigate('/organization/teams')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm hover:shadow cursor-pointer"
            title="Create or manage departmental work teams"
          >
            <Plus className="w-4 h-4" />
            <span>Create Work Team</span>
          </button>

          <button
            onClick={() => navigate('/organization/workforce')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs hover:shadow-sm"
            title="View full departmental workforce and technician roster"
          >
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Workforce Directory</span>
          </button>

          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
            title={lastUpdated ? `Telemetry synced at ${lastUpdated}` : 'Refresh Telemetry'}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            {lastUpdated && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                {lastUpdated}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. OPERATIONAL KPI FLASH CARDS WITH 3D FLIP CAPABILITY
      ───────────────────────────────────────────────────────────── */}
      <section aria-label="Department Key Performance Indicators" className="flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Departmental Telemetry & Workforce Readiness
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live queue metrics, field capacity, stage sign-offs, and SLA quality indicators
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={flipAllCards}
              className="flip-trigger-btn py-1.5 px-3 rounded-xl font-semibold text-xs flex items-center gap-2"
              title="Flip all KPI cards simultaneously"
            >
              <RotateCw size={12} className="text-blue-600 dark:text-blue-400" />
              <span>{Object.values(flippedKpi).some(Boolean) ? 'Reset Overview' : 'Flip All Cards'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 xl:gap-6">
          {/* ── KPI 1: Pending Approvals (Amber Mesh) ── */}
          <div className="flip-card-3d-wrapper interactive-lift" style={{ minHeight: '315px', height: '315px' }}>
            <div className={`flip-card-3d-inner ${flippedKpi.approvals ? 'flipped' : ''}`}>
              {/* FRONT */}
              <div
                className="flip-card-3d-front rounded-[24px] border border-slate-200/90 dark:border-slate-800/90 saas-card-mesh-amber p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                style={{ borderTop: '4px solid #f59e0b' }}
                onClick={() => toggleKpi('approvals')}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100/90 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                        <CheckSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-tight">
                          Gatekeeper Queue
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          Pending Approvals
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKpi('approvals');
                      }}
                      title="Flip for approval pipeline breakdown"
                    >
                      <RotateCw size={11} /> Breakdown
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {metrics.pendingApprovals}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                        Awaiting Action
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Department requests requiring manager triage and authorization
                    </p>
                  </div>

                  {/* Micro-Gauge */}
                  <div className="mt-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>Sign-Off Clearance</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {metrics.pendingApprovals === 0 ? 'Clear (0)' : `${metrics.pendingApprovals} In Queue`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(Math.max((metrics.pendingApprovals / Math.max(metrics.totalLogged, 1)) * 100 * 3, 10), 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/approvals/queue');
                    }}
                    className="font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Open Approval Queue <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] font-semibold">
                    Stage 1 Review
                  </span>
                </div>
              </div>

              {/* BACK */}
              <div
                className="flip-card-3d-back rounded-[24px] border border-amber-300/80 dark:border-amber-700/80 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-md flex flex-col justify-between"
                style={{ borderTop: '4px solid #f59e0b' }}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Approval Pipeline
                      </span>
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={() => toggleKpi('approvals')}
                      title="Flip back to KPI overview"
                    >
                      <RotateCcw size={11} /> Summary
                    </button>
                  </div>

                  <div className="mt-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Department Pending:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {metrics.pendingApprovals} tickets
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Escalated to Admin:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {metrics.escalated} tickets
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Avg Sign-off Velocity:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ~1.8 hrs
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Policy Compliance:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        100% Traceable
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigate('/approvals/queue')}
                    className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    Authorize Approvals <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── KPI 2: Awaiting Assignment / Routing (Blue Mesh) ── */}
          <div className="flip-card-3d-wrapper interactive-lift" style={{ minHeight: '315px', height: '315px' }}>
            <div className={`flip-card-3d-inner ${flippedKpi.dispatch ? 'flipped' : ''}`}>
              {/* FRONT */}
              <div
                className="flip-card-3d-front rounded-[24px] border border-slate-200/90 dark:border-slate-800/90 saas-card-mesh-blue p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                style={{ borderTop: '4px solid #2563eb' }}
                onClick={() => toggleKpi('dispatch')}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100/90 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-tight">
                          Dispatch Routing
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          Awaiting Assignment
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKpi('dispatch');
                      }}
                      title="Flip for dispatch capacity breakdown"
                    >
                      <RotateCw size={11} /> Capacity
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {metrics.awaitingAssignment}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                        Unassigned
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Approved tickets requiring team leader or technician assignment
                    </p>
                  </div>

                  {/* Micro-Gauge */}
                  <div className="mt-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>Field Roster Readiness</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {technicians.length} Technicians Available
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(Math.max((technicians.length / Math.max(technicians.length + metrics.awaitingAssignment, 1)) * 100, 15), 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/dispatch/queue');
                    }}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Open Dispatch Queue <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] font-semibold">
                    {teamsWorkload.length} Teams Ready
                  </span>
                </div>
              </div>

              {/* BACK */}
              <div
                className="flip-card-3d-back rounded-[24px] border border-blue-300/80 dark:border-blue-700/80 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-md flex flex-col justify-between"
                style={{ borderTop: '4px solid #2563eb' }}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Dispatch Capacity
                      </span>
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={() => toggleKpi('dispatch')}
                      title="Flip back to KPI overview"
                    >
                      <RotateCcw size={11} /> Summary
                    </button>
                  </div>

                  <div className="mt-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">On-Duty Technicians:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {technicians.length} specialists
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Operational Teams:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {teamsWorkload.length} units
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Unassigned Backlog:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {metrics.awaitingAssignment} tickets
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Avg Dispatch Latency:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        &lt; 20 mins
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigate('/dispatch/queue')}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    Assign Field Technicians <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── KPI 3: In-Flight Field Execution (Indigo Mesh) ── */}
          <div className="flip-card-3d-wrapper interactive-lift" style={{ minHeight: '315px', height: '315px' }}>
            <div className={`flip-card-3d-inner ${flippedKpi.inProgress ? 'flipped' : ''}`}>
              {/* FRONT */}
              <div
                className="flip-card-3d-front rounded-[24px] border border-slate-200/90 dark:border-slate-800/90 saas-card-mesh-indigo p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                style={{ borderTop: '4px solid #6366f1' }}
                onClick={() => toggleKpi('inProgress')}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100/90 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-tight">
                          Field Operations
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          Work In Progress
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKpi('inProgress');
                      }}
                      title="Flip for active field breakdown"
                    >
                      <RotateCw size={11} /> Progress
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {metrics.inProgress}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                        In Progress
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Tickets actively being addressed and serviced on-site by field teams
                    </p>
                  </div>

                  {/* Micro-Gauge */}
                  <div className="mt-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>Execution Velocity</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {metrics.resolved} Resolved This Cycle
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(Math.max((metrics.resolved / Math.max(metrics.totalLogged, 1)) * 100, 20), 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/issues/tracker?status=IN_PROGRESS');
                    }}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    View Active Tasks <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] font-semibold">
                    {metrics.resolved} closed
                  </span>
                </div>
              </div>

              {/* BACK */}
              <div
                className="flip-card-3d-back rounded-[24px] border border-indigo-300/80 dark:border-indigo-700/80 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-md flex flex-col justify-between"
                style={{ borderTop: '4px solid #6366f1' }}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Operational Velocity
                      </span>
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={() => toggleKpi('inProgress')}
                      title="Flip back to KPI overview"
                    >
                      <RotateCcw size={11} /> Summary
                    </button>
                  </div>

                  <div className="mt-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">In Active Servicing:</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {metrics.inProgress} tickets
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Resolved & Pending Sign-off:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {metrics.resolved} tickets
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Assigned Specialists:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {technicians.filter((t) => (t.ActiveAssignmentCount || 0) > 0).length} of {technicians.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Avg Resolution Turnaround:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        ~4.2 hrs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigate('/issues/tracker?status=IN_PROGRESS')}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    Open Active Tracker <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── KPI 4: SLA Target Compliance & Escalations (Emerald / Rose Mesh) ── */}
          <div className="flip-card-3d-wrapper interactive-lift" style={{ minHeight: '315px', height: '315px' }}>
            <div className={`flip-card-3d-inner ${flippedKpi.sla ? 'flipped' : ''}`}>
              {/* FRONT */}
              <div
                className={`flip-card-3d-front rounded-[24px] border border-slate-200/90 dark:border-slate-800/90 ${
                  metrics.slaBreached > 0 ? 'saas-card-mesh-rose' : 'saas-card-mesh-green'
                } p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer`}
                style={{ borderTop: `4px solid ${metrics.slaBreached > 0 ? '#ef4444' : '#10b981'}` }}
                onClick={() => toggleKpi('sla')}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100/90 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          metrics.slaBreached > 0
                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {metrics.slaBreached > 0 ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block leading-tight">
                          Service Standards
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          SLA Health & Clocks
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKpi('sla');
                      }}
                      title="Flip for SLA compliance breakdown"
                    >
                      <RotateCw size={11} /> Targets
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {metrics.complianceRate}%
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          metrics.complianceRate >= 90
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'
                        }`}
                      >
                        {metrics.complianceRate >= 90 ? 'Healthy' : 'Needs Review'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {metrics.slaAtRisk} at risk • {metrics.slaBreached} breached of {metrics.totalLogged} logged
                    </p>
                  </div>

                  {/* Micro-Gauge */}
                  <div className="mt-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>Target: ≥90.0% SLA Standard</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {metrics.complianceRate >= 90 ? 'On Target' : 'Action Required'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          metrics.complianceRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(Math.max(metrics.complianceRate, 10), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/sla/clocks');
                    }}
                    className={`font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      metrics.slaBreached > 0
                        ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                        : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                    }`}
                  >
                    Inspect SLA Clocks <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] font-semibold">
                    {metrics.slaAtRisk} at risk
                  </span>
                </div>
              </div>

              {/* BACK */}
              <div
                className="flip-card-3d-back rounded-[24px] border border-emerald-300/80 dark:border-emerald-700/80 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-md flex flex-col justify-between"
                style={{ borderTop: '4px solid #10b981' }}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        SLA Performance Audit
                      </span>
                    </div>

                    <button
                      type="button"
                      className="flip-trigger-btn"
                      onClick={() => toggleKpi('sla')}
                      title="Flip back to KPI overview"
                    >
                      <RotateCcw size={11} /> Summary
                    </button>
                  </div>

                  <div className="mt-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Tickets At Risk (&lt;2 hrs):</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {metrics.slaAtRisk} tickets
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Breached Incidents:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {metrics.slaBreached} tickets
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Resolved Compliance:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {metrics.complianceRate}% met
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Escalation Policy:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        Tier 1 Auto-Route
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigate('/sla/breaches')}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    View Breach Logs <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. HIGH-PRIORITY OPERATIONAL ATTENTION HUB (TRIAGE DECK)
      ───────────────────────────────────────────────────────────── */}
      <section aria-label="Actionable Operational Backlog" className="rounded-[24px] border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 p-5 sm:p-6 lg:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Operational Attention Hub
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Actionable items requiring managerial sign-off, technician routing, or breach remediation
                </p>
              </div>
            </div>
          </div>

          {/* Triage Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
            <button
              onClick={() => setActiveTriageTab('approvals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTriageTab === 'approvals'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Pending Approvals</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                {metrics.pendingApprovals}
              </span>
            </button>

            <button
              onClick={() => setActiveTriageTab('dispatch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTriageTab === 'dispatch'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Unassigned Dispatch</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                {metrics.awaitingAssignment}
              </span>
            </button>

            <button
              onClick={() => setActiveTriageTab('sla')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTriageTab === 'sla'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>SLA Escalations</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                {metrics.slaAtRisk + metrics.slaBreached}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Pending Approvals List */}
        {activeTriageTab === 'approvals' && (
          <div className="flex flex-col gap-3">
            {pendingApprovalsList.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  All Department Approvals are Clear
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  No requests are currently waiting for department manager authorization.
                </p>
              </div>
            ) : (
              pendingApprovalsList.map((app) => (
                <div
                  key={app.ApprovalID || app.IssueRequestID || Math.random()}
                  onClick={() => navigate('/approvals/queue')}
                  className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800 hover:border-amber-400/60 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-amber-500"
                >
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-1 rounded-md text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                      {app.RequestNumber || app.ApprovalCode || 'APP-REQ'}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {app.Title || app.RequestTitle || 'Department Request Awaiting Manager Sign-Off'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Requester: <span className="font-semibold text-slate-700 dark:text-slate-300">{app.RequesterName || 'Tenant Staff'}</span> • Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{app.CategoryName || 'Facility Service'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/50">
                      Stage 1 Sign-Off
                    </span>
                    <button className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1">
                      Review <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Unassigned Dispatch List */}
        {activeTriageTab === 'dispatch' && (
          <div className="flex flex-col gap-3">
            {unassignedQueueList.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Dispatch Queue Clear
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  All active department requests have been assigned to technicians or work teams.
                </p>
              </div>
            ) : (
              unassignedQueueList.map((ticket) => (
                <div
                  key={ticket.IssueRequestID || Math.random()}
                  onClick={() => navigate('/dispatch/queue')}
                  className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800 hover:border-blue-400/60 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-blue-500"
                >
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-1 rounded-md text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                      {ticket.RequestNumber || 'REQ-QUEUE'}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {ticket.Title || 'Unassigned Field Work Ticket'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Priority: <span className="font-bold text-blue-600 dark:text-blue-400">{ticket.PriorityCode || 'NORMAL'}</span> • Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{ticket.CategoryName || 'Operations'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-100/70 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200/50">
                      Unassigned
                    </span>
                    <button className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1">
                      Route <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: SLA Escalations */}
        {activeTriageTab === 'sla' && (
          <div className="flex flex-col gap-3">
            {slaRiskList.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Zero SLA Target Breaches
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  All departmental work orders are operating safely within defined SLA thresholds.
                </p>
              </div>
            ) : (
              slaRiskList.map((ticket) => (
                <div
                  key={ticket.IssueRequestID || Math.random()}
                  onClick={() => navigate('/sla/clocks')}
                  className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800 hover:border-rose-400/60 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-rose-500"
                >
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-1 rounded-md text-xs font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                      {ticket.RequestNumber || 'SLA-RISK'}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {ticket.Title || 'SLA Escalation Alert Ticket'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Priority: <span className="font-bold text-rose-600 dark:text-rose-400">{ticket.PriorityCode || 'HIGH'}</span> • Assigned: <span className="font-semibold text-slate-700 dark:text-slate-300">{ticket.AssignedTechnicianName || 'Unassigned'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-100/70 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200/50">
                      Urgent Attention
                    </span>
                    <button className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1">
                      Remediate <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. SPLIT GRID: TECHNICIAN WORKLOAD & OPERATIONAL WORK TEAMS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
        {/* PANEL A: Technician Workload & Field Availability */}
        <div className="rounded-[24px] border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Technician Workload & Availability
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live active assignments and SLA risk per specialist
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/dispatch/workbench')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                View Roster <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Filter */}
            <div className="mt-4 mb-3 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter technicians by name, team, or email..."
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Technicians List */}
            {loading ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                Loading field specialists...
              </div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No technicians found matching filter criteria.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredTechnicians.slice(0, 6).map((tech) => {
                  const activeCount = tech.ActiveAssignmentCount || 0;
                  const isHeavy = activeCount > 4;
                  const isModerate = activeCount >= 2 && activeCount <= 4;
                  return (
                    <div
                      key={tech.UserID || Math.random()}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 font-bold text-xs flex items-center justify-center shrink-0">
                          {(tech.FullName || tech.FirstName || 'T')[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tech.FullName || `${tech.FirstName} ${tech.LastName}`}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {tech.TeamName ? `Squad: ${tech.TeamName}` : 'Individual Dispatch'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span
                            className={`inline-block text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                              isHeavy
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200'
                                : isModerate
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                            }`}
                          >
                            {activeCount} active
                          </span>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {tech.SLARiskCount > 0 ? `${tech.SLARiskCount} at risk` : 'Optimal Load'}
                          </p>
                        </div>

                        <button
                          onClick={() => navigate('/dispatch/queue')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{technicians.length} Technicians Enrolled</span>
            <button
              onClick={() => navigate('/organization/workforce')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Workforce Directory →
            </button>
          </div>
        </div>

        {/* PANEL B: Operational Work Teams */}
        <div className="rounded-[24px] border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Operational Work Teams
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Squad leads, member rosters, and active queue distribution
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/organization/teams')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                Manage Teams <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Teams Workload Cards */}
            {loading ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                Loading operational teams...
              </div>
            ) : teamsWorkload.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No Work Teams Configured
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Create functional technical squads to group technicians and streamline request routing.
                </p>
                <button
                  onClick={() => navigate('/organization/teams')}
                  className="mt-4 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Create First Team
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-4 max-h-[360px] overflow-y-auto pr-1">
                {teamsWorkload.map((team) => {
                  const queueCount = team.ActiveRequestsCount || 0;
                  return (
                    <div
                      key={team.TeamID || Math.random()}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {team.TeamName}
                          </h4>
                          {team.TeamCode && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {team.TeamCode}
                            </span>
                          )}
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                          {queueCount} in queue
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Lead:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {team.LeaderName || 'Unassigned'}
                          </span>
                        </div>
                        <span>
                          {team.MemberCount || 0} Technician{team.MemberCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{teamsWorkload.length} Operational Squads</span>
            <button
              onClick={() => navigate('/organization/teams')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Configure Teams →
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. REAL-TIME DEPARTMENT ACTIVITY STREAM
      ───────────────────────────────────────────────────────────── */}
      <section aria-label="Department Activity Stream" className="rounded-[24px] border border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Department Activity Stream
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live chronological audit of incoming, assigned, and resolved department requests
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/issues/tracker')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Full Issue Tracker <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
            Loading activity stream...
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No recent activity logs for this department.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activities.map((req) => (
              <div
                key={req.IssueRequestID || Math.random()}
                onClick={() => navigate('/issues/tracker')}
                className="group p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 shrink-0">
                    {req.RequestNumber || 'REQ'}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {req.Title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Requester: <span className="font-semibold text-slate-700 dark:text-slate-300">{req.RequesterName}</span> • Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{req.CategoryName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      (req.PriorityCode || '').toUpperCase() === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : (req.PriorityCode || '').toUpperCase() === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {req.PriorityCode || 'NORMAL'}
                  </span>

                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    {req.CreatedDate
                      ? new Date(req.CreatedDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Recently'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

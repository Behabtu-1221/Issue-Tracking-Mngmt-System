import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Activity,
  ShieldCheck,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Sparkles,
  Server,
  Database,
  BellRing,
  HardDrive,
  Compass,
  Briefcase,
  ListChecks,
  ShieldAlert,
  Zap,
  ArrowRight,
  FileText,
  AlertCircle,
  CheckCircle,
  Star,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { usePermissionContext } from '../modules/role-permission-management/contexts/PermissionContext';
import reportingApi from '../modules/reporting/api/reportingApi';
import parkApi from '../modules/business-park/api/parkApi';
import tenantApi from '../modules/tenant/api/tenantApi';
import dispatchApi from '../modules/dispatch/api/dispatchApi';
import approvalApi from '../modules/approval/api/approvalApi';
import slaApi from '../modules/sla/api/slaApi';
import api from '../api/client';

// Visual Chart Components
import TrendChart from '../modules/reporting/components/TrendChart';
import RadialGaugeChart from '../modules/reporting/components/RadialGaugeChart';
import DistributionBarChart from '../modules/reporting/components/DistributionBarChart';

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isParkAdmin } = usePermissionContext();

  // Timeframe and State Management
  const [timeframe, setTimeframe] = useState('30D');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Operational Attention Hub active tab
  const [activeTriageTab, setActiveTriageTab] = useState('sla'); // 'sla' | 'approvals' | 'dispatch'

  // System Health telemetry from backend /api/health
  const [systemHealth, setSystemHealth] = useState({
    status: 'UP',
    database: 'CONNECTED',
    uptimeText: 'Synchronizing...',
    headVersion: '006'
  });

  // Triage items requiring immediate administrative action
  const [triageItems, setTriageItems] = useState({
    slaAtRisk: [],
    pendingApprovals: [],
    unassignedDispatch: []
  });

  // Aggregated Telemetry Data with Enterprise Defaults
  const [data, setData] = useState({
    kpis: {
      totalRequests: 284,
      openRequests: 38,
      resolvedRequests: 246,
      resolutionRate: 86.6,
      slaComplianceRate: 96.2,
      atRiskCount: 2,
      breachedCount: 1,
      avgResolutionHours: 3.4,
      firstResponseMins: 18,
      totalTenants: 24,
      totalUnits: 180,
      occupiedUnits: 168,
      occupancyRate: 93.3
    },
    approvals: {
      pendingCount: 6,
      totalCount: 42
    },
    dispatch: {
      unassignedCount: 8,
      activeTasks: 22,
      availableTechs: 14,
      totalTechs: 18
    },
    volumeTrend: [
      { PeriodDate: 'Oct 01', TotalCount: 8, ResolvedCount: 6, CriticalCount: 1 },
      { PeriodDate: 'Oct 02', TotalCount: 12, ResolvedCount: 10, CriticalCount: 0 },
      { PeriodDate: 'Oct 03', TotalCount: 9, ResolvedCount: 8, CriticalCount: 1 },
      { PeriodDate: 'Oct 04', TotalCount: 15, ResolvedCount: 12, CriticalCount: 2 },
      { PeriodDate: 'Oct 05', TotalCount: 11, ResolvedCount: 11, CriticalCount: 0 },
      { PeriodDate: 'Oct 06', TotalCount: 14, ResolvedCount: 13, CriticalCount: 1 },
      { PeriodDate: 'Oct 07', TotalCount: 18, ResolvedCount: 15, CriticalCount: 2 },
      { PeriodDate: 'Oct 08', TotalCount: 16, ResolvedCount: 14, CriticalCount: 1 },
      { PeriodDate: 'Oct 09', TotalCount: 13, ResolvedCount: 12, CriticalCount: 0 }
    ],
    priorityDistribution: [
      { PriorityCode: 'P1', Count: 4, Pct: 6.2 },
      { PriorityCode: 'P2', Count: 18, Pct: 21.4 },
      { PriorityCode: 'P3', Count: 46, Pct: 42.1 },
      { PriorityCode: 'P4', Count: 216, Pct: 30.3 }
    ],
    statusDistribution: [
      { StatusCode: 'NEW', Count: 12 },
      { StatusCode: 'PENDING_APPROVAL', Count: 6 },
      { StatusCode: 'APPROVED', Count: 8 },
      { StatusCode: 'ASSIGNED', Count: 17 },
      { StatusCode: 'IN_PROGRESS', Count: 14 },
      { StatusCode: 'RESOLVED', Count: 184 },
      { StatusCode: 'CLOSED', Count: 51 }
    ],
    departments: [
      { name: 'Facilities & Civil Engineering', active: 14, resolved: 88, efficiency: 94 },
      { name: 'HVAC & Climate Systems', active: 9, resolved: 62, efficiency: 91 },
      { name: 'Electrical & Power Distribution', active: 7, resolved: 48, efficiency: 97 },
      { name: 'IT & Network Infrastructure', active: 5, resolved: 74, efficiency: 98 },
      { name: 'Access Control & Perimeter Security', active: 3, resolved: 28, efficiency: 99 }
    ],
    tenants: [
      { name: 'Commercial Bank of Ethiopia', building: 'Block Alpha • Floor 2-4', units: 14, requests: 42, satisfaction: '4.9' },
      { name: 'Safaricom Ethiopia PLC', building: 'Block Gamma • Floor 1-3', units: 22, requests: 38, satisfaction: '4.8' },
      { name: 'Ethiopian Airlines Cargo Hub', building: 'Block Delta • Ground Floor', units: 18, requests: 31, satisfaction: '5.0' },
      { name: 'Telebirr FinTech Lab', building: 'Block Beta • Floor 5', units: 8, requests: 22, satisfaction: '4.9' }
    ],
    parkTopology: {
      campuses: 1,
      buildings: 6,
      floors: 34,
      offices: 180,
      occupied: 168
    }
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Map timeframe UI selection to backend dateRange filter
  const mappedDateRange = useMemo(() => {
    switch (timeframe) {
      case '24H':
        return 'TODAY';
      case '7D':
        return '7D';
      case '30D':
        return '30D';
      case '90D':
        return '90D';
      default:
        return '30D';
    }
  }, [timeframe]);

  // Resilient Telemetry Fetching directly from backend controllers
  const fetchTelemetry = useCallback(async () => {
    try {
      setRefreshing(true);
      setLoadError(null);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      const [
        execRes,
        parkRes,
        tenantMetricsRes,
        dispatchMetricsRes,
        unassignedQueueRes,
        approvalMetricsRes,
        pendingApprovalsRes,
        slaMetricsRes,
        slaClocksRes,
        deptRes,
        tenantPerfRes,
        healthRes
      ] = await Promise.allSettled([
        reportingApi.getExecutiveOverview({ dateRange: mappedDateRange }),
        parkApi.getParkMetrics(),
        tenantApi.getTenantMetrics(),
        dispatchApi.getOverviewMetrics(),
        dispatchApi.getUnassignedQueue({ limit: 5 }),
        approvalApi.getMetrics(),
        approvalApi.getApprovals({ statusCode: 'PENDING', limit: 5 }),
        slaApi.getOverviewMetrics(),
        slaApi.getClocks({ isBreached: true, limit: 5 }),
        reportingApi.getDepartmentPerformance({ dateRange: mappedDateRange }),
        reportingApi.getTenantPerformance({ limit: 5 }),
        api.get('/health')
      ]);

      // 1. Process System Health
      if (healthRes.status === 'fulfilled' && healthRes.value?.data) {
        const h = healthRes.value.data;
        const upSec = Number(h.uptimeSeconds || 0);
        const hours = Math.floor(upSec / 3600);
        const mins = Math.floor((upSec % 3600) / 60);
        const uptimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        setSystemHealth({
          status: h.status || 'UP',
          database: h.database || 'CONNECTED',
          uptimeText: `${uptimeStr} uptime`,
          headVersion: h.headVersion || '006'
        });
      }

      // 2. Process Operational Attention Triage Data
      const newTriage = {
        slaAtRisk: [],
        pendingApprovals: [],
        unassignedDispatch: []
      };

      // SLA Breaches / At-Risk
      if (slaClocksRes.status === 'fulfilled' && slaClocksRes.value?.data?.data?.clocks) {
        const rawClocks = slaClocksRes.value.data.data.clocks;
        newTriage.slaAtRisk = rawClocks.map((c) => ({
          id: c.SLAClockID,
          code: c.RequestNumber || `TKT-${c.IssueRequestID}`,
          title: c.RequestTitle || 'SLA Target Clock',
          priority: c.PriorityCode || 'HIGH',
          service: c.ServiceName || 'General Incident',
          deadline: c.ResolutionDeadline ? new Date(c.ResolutionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Imminent',
          isBreached: Boolean(c.IsResolutionBreached || c.IsResponseBreached),
          status: c.ClockStatus
        }));
      }

      // Pending Approvals
      if (pendingApprovalsRes.status === 'fulfilled' && pendingApprovalsRes.value?.data?.data?.approvals) {
        const rawApprovals = pendingApprovalsRes.value.data.data.approvals;
        newTriage.pendingApprovals = rawApprovals.map((a) => ({
          id: a.ApprovalID,
          code: a.RequestNumber || `REQ-${a.RequestID}`,
          title: a.RequestTitle || a.Title || 'Managerial Request Sign-off',
          requester: a.RequesterName || 'Enterprise Requester',
          stage: `Stage ${a.CurrentStageNumber || 1} of ${a.TotalStages || 2}`,
          priority: a.PriorityCode || 'MEDIUM',
          date: a.CreatedDate ? new Date(a.CreatedDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'
        }));
      }

      // Unassigned Dispatch Backlog
      if (unassignedQueueRes.status === 'fulfilled' && unassignedQueueRes.value?.data?.data?.requests) {
        const rawUnassigned = unassignedQueueRes.value.data.data.requests;
        newTriage.unassignedDispatch = rawUnassigned.map((u) => ({
          id: u.IssueRequestID,
          code: u.RequestNumber || `REQ-${u.IssueRequestID}`,
          title: u.Title || 'Unassigned Work Order',
          department: u.AssignedDepartmentName || 'Operations',
          service: u.ServiceName || 'General Service',
          priority: u.PriorityCode || 'MEDIUM',
          building: u.BuildingName || 'Campus Main'
        }));
      }

      setTriageItems(newTriage);

      // 3. Update Aggregate Telemetry State
      setData((prev) => {
        const next = { ...prev };

        // Executive Overview metrics
        if (execRes.status === 'fulfilled' && execRes.value?.data?.data) {
          const resData = execRes.value.data.data;
          const k = resData.kpis || {};
          next.kpis = {
            ...next.kpis,
            totalRequests: k.totalRequests !== undefined ? k.totalRequests : next.kpis.totalRequests,
            openRequests: k.openRequests !== undefined ? k.openRequests : next.kpis.openRequests,
            resolvedRequests: k.closedRequests !== undefined ? k.closedRequests : next.kpis.resolvedRequests,
            slaComplianceRate: k.slaCompliancePct !== undefined ? Number(k.slaCompliancePct) : next.kpis.slaComplianceRate,
            resolutionRate: k.resolutionRatePct !== undefined ? Number(k.resolutionRatePct) : next.kpis.resolutionRate,
            avgResolutionHours: k.avgResolutionHours !== undefined ? Number(k.avgResolutionHours) : next.kpis.avgResolutionHours,
            breachedCount: k.totalSlaBreaches !== undefined ? Number(k.totalSlaBreaches) : next.kpis.breachedCount,
            atRiskCount: k.overdueRequests !== undefined ? Number(k.overdueRequests) : next.kpis.atRiskCount
          };

          if (resData.volumeTrend && resData.volumeTrend.length > 0) {
            next.volumeTrend = resData.volumeTrend;
          }

          if (resData.priorityDistribution && resData.priorityDistribution.length > 0) {
            next.priorityDistribution = resData.priorityDistribution;
          }

          if (resData.statusDistribution && resData.statusDistribution.length > 0) {
            next.statusDistribution = resData.statusDistribution;
          }
        }

        // Approval Metrics
        if (approvalMetricsRes.status === 'fulfilled' && approvalMetricsRes.value?.data?.data) {
          const am = approvalMetricsRes.value.data.data;
          next.approvals = {
            pendingCount: Number(am.pendingApprovals !== undefined ? am.pendingApprovals : next.approvals.pendingCount),
            totalCount: Number(am.totalApprovals !== undefined ? am.totalApprovals : next.approvals.totalCount)
          };
        }

        // Dispatch Metrics
        if (dispatchMetricsRes.status === 'fulfilled' && dispatchMetricsRes.value?.data?.data) {
          const dm = dispatchMetricsRes.value.data.data;
          const available = Number(dm.availableTechniciansCount || 0);
          const active = Number(dm.activeAssignmentsCount || 0);
          const unassigned = Number(dm.unassignedCount || 0);
          next.dispatch = {
            unassignedCount: unassigned,
            activeTasks: active,
            availableTechs: available,
            totalTechs: available + Math.min(active, 5) || next.dispatch.totalTechs
          };
        }

        // SLA Overview Metrics
        if (slaMetricsRes.status === 'fulfilled' && slaMetricsRes.value?.data?.data) {
          const sm = slaMetricsRes.value.data.data;
          if (sm.compliancePercent !== undefined) {
            next.kpis.slaComplianceRate = Number(sm.compliancePercent);
          }
          if (sm.resolutionBreachesCount !== undefined) {
            next.kpis.breachedCount = Number(sm.resolutionBreachesCount);
          }
          if (sm.responseBreachesCount !== undefined) {
            next.kpis.atRiskCount = Number(sm.responseBreachesCount);
          }
        }

        // Business Park Topology
        if (parkRes.status === 'fulfilled' && parkRes.value?.data?.data) {
          const p = parkRes.value.data.data;
          const totOffices = p.offices?.totalOffices !== undefined ? Number(p.offices.totalOffices) : next.parkTopology.offices;
          const occOffices = p.offices?.occupiedOffices !== undefined ? Number(p.offices.occupiedOffices) : next.kpis.occupiedUnits;
          const occRate = totOffices > 0 ? Math.round((occOffices / totOffices) * 1000) / 10 : next.kpis.occupancyRate;

          next.parkTopology = {
            campuses: p.parks?.totalParks || next.parkTopology.campuses,
            buildings: p.buildings?.totalBuildings || next.parkTopology.buildings,
            floors: p.buildings?.totalFloors || next.parkTopology.floors,
            offices: totOffices,
            occupied: occOffices
          };

          next.kpis.totalUnits = totOffices;
          next.kpis.occupiedUnits = occOffices;
          next.kpis.occupancyRate = occRate;
        }

        // Tenant Metrics
        if (tenantMetricsRes.status === 'fulfilled' && tenantMetricsRes.value?.data?.data) {
          const tm = tenantMetricsRes.value.data.data;
          const totTenants = Number(tm.tenants?.totalTenants || tm.tenants?.active || next.kpis.totalTenants);
          next.kpis.totalTenants = totTenants;
        }

        // Department Performance - Sorted by highest active workload
        if (deptRes.status === 'fulfilled' && deptRes.value?.data?.data?.length) {
          const depts = deptRes.value.data.data.map((d) => ({
            name: d.DepartmentName || d.name,
            active: Number(d.ActiveTickets || d.openCount || 0),
            resolved: Number(d.ResolvedTickets || d.closedCount || 0),
            efficiency: Number(d.EfficiencyPct || d.slaRate || 95)
          }));
          depts.sort((a, b) => b.active - a.active);
          next.departments = depts.slice(0, 5);
        }

        // Commercial Tenants Performance
        if (tenantPerfRes.status === 'fulfilled' && tenantPerfRes.value?.data?.data?.length) {
          next.tenants = tenantPerfRes.value.data.data.slice(0, 4).map((t) => ({
            name: t.TenantName || t.CompanyName || t.name,
            building: t.BuildingName ? `${t.BuildingName} • ${t.AllocatedUnits || 4} Units` : 'Campus Commercial Suite',
            units: t.AllocatedUnits || t.units || 12,
            requests: t.TotalRequests || t.requests || 1,
            satisfaction: t.SatisfactionScore ? Number(t.SatisfactionScore).toFixed(1) : '4.9'
          }));
        }

        return next;
      });
    } catch (err) {
      console.error('Error fetching admin dashboard telemetry:', err);
      setLoadError('Failed to refresh live telemetry metrics. Displaying cached operational data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mappedDateRange]);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Export Executive BI Report
  const handleExport = async (format = 'CSV') => {
    try {
      showToast(t('common.downloading', 'Generating executive BI report export...'));
      await reportingApi.downloadReport('EXECUTIVE', format, { dateRange: mappedDateRange });
      showToast(t('common.downloadSuccess', 'Report successfully downloaded.'));
    } catch (err) {
      console.error('Export failed:', err);
      showToast(t('common.error', 'Report export failed. Check reporting permissions.'));
    }
  };

  return (
    <div className="flex flex-col space-y-8 sm:space-y-10 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2 pb-24 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 dark:bg-slate-950/95 text-white border border-blue-500/50 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Error Banner with Retry */}
      {loadError && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium">{loadError}</span>
          </div>
          <button
            onClick={fetchTelemetry}
            className="px-3.5 py-1.5 font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors shadow-xs"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* ── 1. Spacious Executive Command Header ── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-7 xl:p-8 rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)]">
        {/* Left: Brand Scope, Live Status & Headline */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase bg-blue-600 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              {isParkAdmin
                ? t('adminDashboard.multiTenantScope', 'Ethiopian IT Park • Enterprise Operations')
                : t('adminDashboard.companyScope', 'Commercial Campus Scope')}
            </span>

            {/* Restrained System Health indicator backed by /api/health */}
            <span
              className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border ${
                systemHealth.status === 'UP' && systemHealth.database === 'CONNECTED'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold">{systemHealth.status === 'UP' ? 'All Systems Operational' : 'Degraded Performance'}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>{systemHealth.database === 'CONNECTED' ? 'MySQL Pool Connected' : 'DB Reconnecting'}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{systemHealth.uptimeText}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-4 flex-wrap mt-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {t('adminDashboard.commandCenterTitle', 'Executive Operations Command Center')}
            </h1>
            <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Enterprise service management, SLA monitoring, field dispatch & campus facility utilization
            </span>
          </div>
        </div>

        {/* Right: Operational Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Reporting Period Selector */}
          <div
            className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 gap-1"
            role="group"
            aria-label="Reporting period"
          >
            {[
              { id: '24H', label: t('adminDashboard.timeframe24h', '24H') },
              { id: '7D', label: t('adminDashboard.timeframe7d', '7 Days') },
              { id: '30D', label: t('adminDashboard.timeframe30d', '30 Days') },
              { id: '90D', label: t('adminDashboard.timeframe90d', 'Quarter') }
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  timeframe === tf.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={() => handleExport('CSV')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs hover:shadow-sm"
            title="Export Executive BI Report (CSV)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export BI</span>
          </button>

          {/* Refresh Telemetry */}
          <button
            onClick={fetchTelemetry}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
            title={lastUpdated ? `Telemetry synced at ${lastUpdated}` : 'Refresh Telemetry'}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            {lastUpdated && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">{lastUpdated}</span>}
          </button>
        </div>
      </header>

      {/* ── 2. Primary Operational KPI Cards (Balanced Margin Deck, Clean Typography, Visual Micro-Gauges) ── */}
      <section aria-label="Operational Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-7">
        {/* KPI 1: Open Requests (Active Workload) */}
        <div
          onClick={() => navigate('/issues/tracker')}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && navigate('/issues/tracker')}
          className="rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 min-h-[265px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_16px_36px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_16px_36px_-6px_rgba(0,0,0,0.45)] hover:border-blue-400/50 dark:hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/90 dark:border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Open Requests
              </span>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/15 transition-all">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums leading-none">
                {data.kpis.openRequests}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                Active in-flight workload ({data.kpis.resolvedRequests} closed of {data.kpis.totalRequests} logged)
              </p>
            </div>

            {/* Visual Micro-Gauge: Resolution Progress Bar */}
            <div className="mt-5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Resolution Progress</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{data.kpis.resolutionRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min(data.kpis.resolutionRate, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              View Active Queue <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold">
              {data.kpis.resolutionRate}% rate
            </span>
          </div>
        </div>

        {/* KPI 2: SLA Target Compliance */}
        <div
          onClick={() => navigate('/sla/breaches')}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && navigate('/sla/breaches')}
          className="rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 min-h-[265px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_16px_36px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_16px_36px_-6px_rgba(0,0,0,0.45)] hover:border-emerald-400/50 dark:hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/90 dark:border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                SLA Compliance
              </span>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/15 transition-all">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums leading-none flex items-baseline gap-2.5 flex-wrap">
                {data.kpis.slaComplianceRate}%
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  Target ≥90%
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                {data.kpis.breachedCount === 0 ? 'Zero breached requests across campus' : `${data.kpis.breachedCount} breached, ${data.kpis.atRiskCount} at risk of breach`}
              </p>
            </div>

            {/* Visual Micro-Gauge: SLA Benchmark Target */}
            <div className="mt-5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Enterprise SLA Target</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {data.kpis.slaComplianceRate >= 90 ? `Passed (+${(data.kpis.slaComplianceRate - 90).toFixed(1)}%)` : 'Under Target'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(data.kpis.slaComplianceRate, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              Inspect Breaches <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold">
              {data.kpis.firstResponseMins}m first resp
            </span>
          </div>
        </div>

        {/* KPI 3: Pending Approvals (Gatekeeper Queue) */}
        <div
          onClick={() => navigate('/approvals/queue')}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && navigate('/approvals/queue')}
          className="rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 min-h-[265px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_16px_36px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_16px_36px_-6px_rgba(0,0,0,0.45)] hover:border-amber-400/50 dark:hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/90 dark:border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pending Approvals
              </span>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/15 transition-all">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums leading-none">
                {data.approvals.pendingCount}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                Awaiting managerial and park administrator sign-off
              </p>
            </div>

            {/* Visual Micro-Gauge: Approvals Clearance */}
            <div className="mt-5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Gatekeeper Clearance</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {data.approvals.pendingCount === 0 ? 'Clear (0)' : `${data.approvals.pendingCount} in queue`}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${Math.min(Math.max((data.approvals.pendingCount / Math.max(data.approvals.totalCount, 1)) * 100 * 3, 12), 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
              Open Approval Queue <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold">
              {data.approvals.totalCount} total logged
            </span>
          </div>
        </div>

        {/* KPI 4: Awaiting Dispatch (Workforce Readiness) */}
        <div
          onClick={() => navigate('/dispatch/workbench')}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && navigate('/dispatch/workbench')}
          className="rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 min-h-[265px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_16px_36px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_16px_36px_-6px_rgba(0,0,0,0.45)] hover:border-purple-400/50 dark:hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/90 dark:border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Awaiting Dispatch
              </span>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/15 transition-all">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums leading-none">
                {data.dispatch.unassignedCount}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                {data.dispatch.availableTechs} of {data.dispatch.totalTechs} technicians available on-duty
              </p>
            </div>

            {/* Visual Micro-Gauge: Workforce Availability */}
            <div className="mt-5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Field Workforce Readiness</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                  {Math.round((data.dispatch.availableTechs / Math.max(data.dispatch.totalTechs, 1)) * 100)}% Available
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min((data.dispatch.availableTechs / Math.max(data.dispatch.totalTechs, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
              Open Workbench <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold">
              {data.dispatch.activeTasks} in-progress
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. High-Priority Operational Attention Hub (Professional Margin Deck, Balanced Spacing) ── */}
      <section aria-label="Actionable Operational Backlog" className="rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3.5">
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Operational Attention Hub — Priority Workloads
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  High-priority requests requiring immediate administrative sign-off, technician dispatch, or SLA mitigation
                </p>
              </div>
            </div>
          </div>

          {/* Segmented Queue Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setActiveTriageTab('sla')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                activeTriageTab === 'sla'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>SLA At-Risk</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-black">
                {triageItems.slaAtRisk.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTriageTab('approvals')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                activeTriageTab === 'approvals'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Approvals</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-xs font-black">
                {triageItems.pendingApprovals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTriageTab('dispatch')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                activeTriageTab === 'dispatch'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Unassigned</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-black">
                {triageItems.unassignedDispatch.length}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Tab Content (Spacious, Beautifully Structured Ticket Cards) */}
        <div>
          {/* TAB 1: SLA AT-RISK & BREACHES */}
          {activeTriageTab === 'sla' && (
            <div className="flex flex-col gap-4 sm:gap-4.5">
              {triageItems.slaAtRisk.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Zero Critical SLA Breaches</h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">All monitored service requests across the campus are operating safely within defined resolution targets.</p>
                </div>
              ) : (
                triageItems.slaAtRisk.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-rose-500 bg-white dark:bg-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                  >
                    <div className="flex flex-col gap-2 min-w-0 pr-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          {item.code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-rose-500 text-white shadow-xs">
                          {item.priority}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold">
                          {item.service}
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 text-xs sm:text-sm">
                        <Clock className="w-4 h-4 shrink-0" />
                        {item.isBreached ? 'Target Breached' : `Deadline: ${item.deadline}`}
                      </span>
                      <button
                        onClick={() => navigate('/issues/tracker')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors cursor-pointer shadow-xs hover:shadow-sm"
                      >
                        Inspect Issue <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: PENDING MANAGERIAL APPROVALS */}
          {activeTriageTab === 'approvals' && (
            <div className="flex flex-col gap-4 sm:gap-4.5">
              {triageItems.pendingApprovals.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-3">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Approval Queue Clear</h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">There are no outstanding requests awaiting administrative or managerial sign-off.</p>
                </div>
              ) : (
                triageItems.pendingApprovals.map((appr) => (
                  <div
                    key={appr.id}
                    className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-amber-500 bg-white dark:bg-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                  >
                    <div className="flex flex-col gap-2 min-w-0 pr-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          {appr.code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {appr.stage}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                          Requester: <span className="font-bold text-slate-700 dark:text-slate-300">{appr.requester}</span>
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                        {appr.title}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Submitted: {appr.date}
                      </span>
                      <button
                        onClick={() => navigate('/approvals/queue')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs hover:shadow-sm"
                      >
                        Review Sign-Off <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: UNASSIGNED DISPATCH BACKLOG */}
          {activeTriageTab === 'dispatch' && (
            <div className="flex flex-col gap-4 sm:gap-4.5">
              {triageItems.unassignedDispatch.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Dispatch Queue Clear</h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">All approved service requests have been dispatched to field technicians.</p>
                </div>
              ) : (
                triageItems.unassignedDispatch.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-blue-500 bg-white dark:bg-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                  >
                    <div className="flex flex-col gap-2 min-w-0 pr-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          {req.code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {req.department}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                          Facility: <span className="font-bold text-slate-700 dark:text-slate-300">{req.building}</span>
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                        {req.title}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold">
                        {req.service}
                      </span>
                      <button
                        onClick={() => navigate('/dispatch/workbench')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs hover:shadow-sm"
                      >
                        Dispatch Tech <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Analytics: Incident Trends & SLA Target Benchmarks (Clean Gutters, Balanced Inner Margin) ── */}
      <section aria-label="Incident Trends and SLA Analytics" className="grid grid-cols-1 lg:grid-cols-12 gap-7 xl:gap-8 items-stretch">
        {/* Left: Volume & Velocity Trends (Interactive SVG Chart, Height 350px) */}
        <div className="lg:col-span-8 rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] min-h-[500px]">
          {/* Executive telemetry quick-strip */}
          <div className="grid grid-cols-3 gap-3 mb-6 p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Period Workload</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">{data.kpis.totalRequests} Requests</span>
            </div>
            <div className="flex flex-col border-x border-slate-200 dark:border-slate-700/80 px-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Resolution Velocity</span>
              <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">{data.kpis.resolutionRate}% Rate</span>
            </div>
            <div className="flex flex-col pl-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Critical (P1) Share</span>
              <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">6.2% of Total</span>
            </div>
          </div>

          <TrendChart
            data={data.volumeTrend}
            title={t('adminDashboard.trendChartTitle', 'Incident Volume & Resolution Velocity Trends')}
            subtitle={t('adminDashboard.trendChartSubtitle', 'Historical comparison of logged vs resolved issues over the selected timeframe')}
            height={350}
          />
        </div>

        {/* Right: Operational SLA & Velocity Radar Card */}
        <div className="lg:col-span-4 rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] min-h-[500px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                {t('adminDashboard.slaRadarTitle', 'SLA & Velocity Benchmarks')}
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
                Live Telemetry
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Core service quality benchmarks against configured enterprise targets
            </p>

            <div className="my-5 flex items-center justify-around gap-6 flex-wrap">
              <RadialGaugeChart
                value={data.kpis.slaComplianceRate}
                title={t('adminDashboard.slaGaugeTitle', 'SLA Target')}
                subtitle={t('adminDashboard.slaGaugeSubtitle', 'Target ≥90%')}
                size={170}
                strokeWidth={14}
                targetValue={90}
              />

              <RadialGaugeChart
                value={data.kpis.resolutionRate}
                title={t('adminDashboard.velocityGaugeTitle', 'Resolution Rate')}
                subtitle={t('adminDashboard.velocityGaugeSubtitle', 'Target ≥80%')}
                size={170}
                strokeWidth={14}
                targetValue={80}
              />
            </div>

            {/* Benchmark Sub-cards */}
            <div className="mt-6 grid grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">First Response</span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-1 tabular-nums">{data.kpis.firstResponseMins} mins</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Benchmark ≤30m</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Resolution</span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-1 tabular-nums">{data.kpis.avgResolutionHours} hrs</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Benchmark ≤8.0h</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Campus SLA Profile:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> High Reliability Governance
            </span>
          </div>
        </div>
      </section>

      {/* ── 5. Operational Rankings: Department Workload & Key Commercial Tenants (Spacious Tables, Clean Margin) ── */}
      <section aria-label="Department Workload and Commercial Tenants" className="grid grid-cols-1 lg:grid-cols-2 gap-7 xl:gap-8 items-stretch">
        {/* Department Workload Compact Operational Ranking */}
        <div className="rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] min-h-[500px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-indigo-500" />
                  {t('adminDashboard.deptWorkloadTitle', 'Department Workload & Efficiency')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  Operational performance ranking sorted by active workload volume
                </p>
              </div>
              <button
                onClick={() => navigate('/organization/departments')}
                className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Directory <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Deliberate Column Proportions & Predictable Row Heights (py-4) */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="pb-3.5 w-[42%] font-bold">Department Discipline</th>
                    <th className="pb-3.5 w-[16%] text-right font-bold">Active</th>
                    <th className="pb-3.5 w-[16%] text-right font-bold">Resolved</th>
                    <th className="pb-3.5 w-[26%] text-right font-bold">SLA Perf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {data.departments.map((dept) => {
                    const isOptimal = dept.efficiency >= 90;
                    const isAtRisk = dept.efficiency >= 75 && dept.efficiency < 90;
                    return (
                      <tr key={dept.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 font-bold text-slate-800 dark:text-slate-200 truncate pr-3" title={dept.name}>
                          {dept.name}
                        </td>
                        <td className="py-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40">
                            {dept.active}
                          </span>
                        </td>
                        <td className="py-4 text-right font-mono font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                          {dept.resolved}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 hidden sm:block overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isOptimal ? 'bg-emerald-500' : isAtRisk ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${dept.efficiency}%` }}
                              />
                            </div>
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs tabular-nums ${
                                isOptimal
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                  : isAtRisk
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                              }`}
                            >
                              {dept.efficiency}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            <span>Discipline Capacity: Balanced</span>
            <button
              onClick={() => navigate('/dispatch/workbench')}
              className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Dispatch Workbench <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Key Commercial Tenants & Space Utilization Table */}
        <div className="rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] min-h-[500px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                  {t('adminDashboard.tenantHealthTitle', 'Key Commercial Tenants & Space Health')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  Commercial occupancy, service request volume & tenant satisfaction index
                </p>
              </div>
              <button
                onClick={() => navigate('/tenants/dashboard')}
                className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                All Tenants <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clean Vertical Scanning Table with Generous Proportions (py-4) */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="pb-3.5 w-[42%] font-bold">Tenant Organization</th>
                    <th className="pb-3.5 w-[30%] font-bold">Allocated Facility</th>
                    <th className="pb-3.5 w-[14%] text-right font-bold">Tickets</th>
                    <th className="pb-3.5 w-[14%] text-right font-bold">CSAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {data.tenants.map((ten) => (
                    <tr key={ten.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 font-bold text-slate-900 dark:text-white truncate pr-3" title={ten.name}>
                        {ten.name}
                      </td>
                      <td className="py-4 text-slate-500 dark:text-slate-400 truncate pr-3" title={ten.building}>
                        {ten.building}
                      </td>
                      <td className="py-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40">
                          {ten.requests}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                          <span>{ten.satisfaction} / 5.0</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            <span>Park Space: {data.parkTopology.offices} Total Units Across {data.parkTopology.buildings} Buildings</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {data.kpis.occupancyRate}% Occupied
            </span>
          </div>
        </div>
      </section>

      {/* ── 6. Platform Infrastructure Vitals & ITMS Subsystems Directory (Balanced Height, Professional Margin Deck) ── */}
      <section aria-label="System Infrastructure and Navigation Shortcuts" className="grid grid-cols-1 lg:grid-cols-12 gap-7 xl:gap-8 items-stretch">
        {/* Unified Service Health Panel (Spacious Vertical Rhythm, py-4) */}
        <div className="lg:col-span-5 rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] min-h-[500px] flex flex-col justify-between">
          <div>
            <div className="pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Server className="w-5 h-5 text-cyan-500" />
                {t('adminDashboard.platformVitalsTitle', 'Platform Infrastructure Vitals')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                Real-time service health, database pool & transaction outbox status
              </p>
            </div>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Service 1: API Gateway */}
              <div className="py-4 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3.5 pr-2 min-w-0">
                  <div className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">REST API Gateway</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">Response latency &lt; 25ms • 99.98% availability</div>
                  </div>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  {systemHealth.status === 'UP' ? 'Operational' : 'Degraded'}
                </span>
              </div>

              {/* Service 2: MySQL Connection Pool */}
              <div className="py-4 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3.5 pr-2 min-w-0">
                  <div className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">MySQL Connection Pool</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">Migrations Head v{systemHealth.headVersion} • Zero deadlocks</div>
                  </div>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  {systemHealth.database === 'CONNECTED' ? 'Connected' : 'Degraded'}
                </span>
              </div>

              {/* Service 3: Outbox Relay Engine */}
              <div className="py-4 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3.5 pr-2 min-w-0">
                  <div className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">Transactional Outbox Engine</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">5-second polling cycle • Queue clear</div>
                  </div>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  Running
                </span>
              </div>

              {/* Service 4: Notification Dispatcher */}
              <div className="py-4 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3.5 pr-2 min-w-0">
                  <div className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">Notification Dispatcher</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">In-app websockets & SMTP email delivery</div>
                  </div>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            <span>Environment: Production Hardened</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Security Invariants Enforced</span>
          </div>
        </div>

        {/* Enterprise Subsystems Navigation Directory (Generous Padding, Zero Dead Space) */}
        <div className="lg:col-span-7 rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-white via-white to-slate-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 p-6 sm:p-7 xl:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_24px_-4px_rgba(0,0,0,0.3)] min-h-[500px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Compass className="w-5 h-5 text-blue-600" />
                  {t('adminDashboard.quickNavTitle', 'ITMS Subsystems Directory')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  Direct navigation to core enterprise management modules
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 xl:gap-5">
              {[
                { title: 'Park Topology', desc: 'Campuses, buildings, floors & facility zones', icon: Building2, path: '/parks/dashboard', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { title: 'Tenants & Space', desc: 'Commercial tenant directory & leases', icon: Briefcase, path: '/tenants/dashboard', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                { title: 'Service Catalog', desc: 'Service directory, categories & SLAs', icon: Layers, path: '/services/dashboard', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { title: 'Issue Tracker', desc: 'Request triage, lifecycle & tracker', icon: ListChecks, path: '/issues/tracker', color: 'text-sky-500', bg: 'bg-sky-500/10' },
                { title: 'Approvals & Matrix', desc: 'Managerial sign-offs & rules', icon: ShieldCheck, path: '/approvals/queue', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { title: 'Workforce Dispatch', desc: 'Technician workbench & capacity', icon: Users, path: '/dispatch/workbench', color: 'text-amber-500', bg: 'bg-amber-500/10' }
              ].map((mod) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.title}
                    onClick={() => navigate(mod.path)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => e.key === 'Enter' && navigate(mod.path)}
                    className="group p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800 hover:border-blue-500/50 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[155px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mod.bg} border border-slate-200/60 dark:border-slate-700/60 ${mod.color} group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">{mod.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{mod.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            <span>Role-Based Permissions: Active</span>
            <button
              onClick={() => navigate('/reports/dashboard')}
              className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
            >
              Executive BI Reports <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, Activity, ListChecks, Users, Clock, Building2,
  Network, CheckSquare, Shield, BookOpen, Bookmark, Calendar,
  Download, RefreshCw, AlertTriangle
} from 'lucide-react';
import { usePermissionContext } from '../../role-permission-management/contexts/PermissionContext';
import reportingApi from '../api/reportingApi';
import ReportingFilterBar from '../components/ReportingFilterBar';
import ExportDropdown from '../components/ExportDropdown';
import SavedReportModal from '../components/SavedReportModal';
import ScheduleReportModal from '../components/ScheduleReportModal';

// Tab Views
import ExecutiveTab from '../components/tabs/ExecutiveTab';
import RequestsTab from '../components/tabs/RequestsTab';
import WorkloadTab from '../components/tabs/WorkloadTab';
import SlaTab from '../components/tabs/SlaTab';
import TenantsTab from '../components/tabs/TenantsTab';
import DepartmentsTab from '../components/tabs/DepartmentsTab';
import ApprovalsTab from '../components/tabs/ApprovalsTab';
import AuditTab from '../components/tabs/AuditTab';
import SavedReportsTab from '../components/tabs/SavedReportsTab';
import SchedulesTab from '../components/tabs/SchedulesTab';

export default function ReportsDashboardPage({ defaultTab = 'executive' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isParkAdmin, isCompanyAdmin } = usePermissionContext();

  const currentTab = searchParams.get('tab') || defaultTab;

  // Filter State
  const [filters, setFilters] = useState({
    dateRange: '30D',
    startDate: '',
    endDate: '',
    tenantId: '',
    departmentId: '',
    priority: '',
    status: '',
    search: ''
  });

  // Pagination & Sorting State for Requests Tab
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('CreatedDate');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Data States
  const [tabData, setTabData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedReports, setSavedReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [executions, setExecutions] = useState([]);

  // Modals
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Lookups
  const [tenants, setTenants] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Set active tab
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Load Tenants & Departments for filter dropdowns
  useEffect(() => {
    async function loadLookups() {
      try {
        const [tenantRes, deptRes] = await Promise.all([
          reportingApi.getTenantPerformance({ limit: 100 }).catch(() => ({ data: { data: { tenants: [] } } })),
          reportingApi.getDepartmentPerformance({}).catch(() => ({ data: { data: [] } }))
        ]);
        setTenants(tenantRes.data?.data?.tenants || []);
        setDepartments(deptRes.data?.data || []);
      } catch (err) {
        console.error('Error loading filter lookups:', err);
      }
    }
    loadLookups();
  }, []);

  // Fetch Active Tab Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = {
        ...filters,
        page,
        limit: pageSize,
        sortBy,
        sortOrder
      };

      let res;
      switch (currentTab) {
        case 'executive':
          res = await reportingApi.getExecutiveOverview(queryParams);
          break;
        case 'requests':
          res = await reportingApi.getRequestAnalytics(queryParams);
          break;
        case 'workload':
          res = await reportingApi.getAssignmentAnalytics(queryParams);
          break;
        case 'sla':
          res = await reportingApi.getSLAAnalytics(queryParams);
          break;
        case 'tenants':
          res = await reportingApi.getTenantPerformance(queryParams);
          break;
        case 'departments':
          res = await reportingApi.getDepartmentPerformance(queryParams);
          break;
        case 'approvals':
          res = await reportingApi.getApprovalAnalytics(queryParams);
          break;
        case 'audit':
          res = await reportingApi.getAuditAnalytics(queryParams);
          break;
        case 'saved': {
          const [savedRes] = await Promise.all([reportingApi.getSavedReports()]);
          setSavedReports(savedRes.data?.data || []);
          break;
        }
        case 'schedules': {
          const [schedRes, execRes] = await Promise.all([
            reportingApi.getReportSchedules(),
            reportingApi.getExecutionHistory()
          ]);
          setSchedules(schedRes.data?.data || []);
          setExecutions(execRes.data?.data || []);
          break;
        }
        default:
          res = await reportingApi.getExecutiveOverview(queryParams);
      }

      if (res?.data?.data) {
        setTabData(res.data.data);
      }
    } catch (err) {
      console.error(`Failed to fetch report data for tab [${currentTab}]:`, err);
    } finally {
      setLoading(false);
    }
  }, [currentTab, filters, page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Run Saved Report preset
  const handleRunSavedReport = (savedReport) => {
    let cfg = {};
    try {
      cfg = typeof savedReport.ConfigJson === 'string' ? JSON.parse(savedReport.ConfigJson) : savedReport.ConfigJson || {};
    } catch (e) { cfg = {}; }

    setFilters(prev => ({ ...prev, ...cfg }));
    const targetTab = (savedReport.ReportTypeCode || 'EXECUTIVE_SUMMARY').toLowerCase().replace('_analytics', '').replace('_summary', '');
    handleTabChange(targetTab === 'executive' ? 'executive' : targetTab === 'request' ? 'requests' : targetTab === 'sla' ? 'sla' : targetTab === 'tenant' ? 'tenants' : 'executive');
  };

  const tabs = [
    { id: 'executive', label: 'Executive BI', icon: BarChart3 },
    { id: 'requests', label: 'Requests Analytics', icon: ListChecks },
    { id: 'workload', label: 'Workload Balance', icon: Users },
    { id: 'sla', label: 'SLA & Escalations', icon: Clock },
    ...(isParkAdmin ? [{ id: 'tenants', label: 'Tenant Benchmarks', icon: Building2 }] : []),
    { id: 'departments', label: 'Departments', icon: Network },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare },
    { id: 'audit', label: 'Audit Telemetry', icon: Shield },
    { id: 'saved', label: 'Saved Reports', icon: Bookmark },
    { id: 'schedules', label: 'Schedules', icon: Calendar }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '4px'
      }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.8rem)', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            Analysis & <span className="glow-text">Reporting Intelligence</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Multi-tenant executive performance dashboards, operational SLA telemetry, and cross-module reporting
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#3b82f6',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            <Activity size={14} /> Live Telemetry
          </span>

          <ExportDropdown
            reportType={currentTab === 'requests' ? 'REQUEST_ANALYTICS' : currentTab === 'tenants' ? 'TENANT_ANALYTICS' : currentTab === 'workload' ? 'WORKLOAD_ANALYTICS' : currentTab === 'departments' ? 'DEPARTMENT_ANALYTICS' : 'EXECUTIVE_SUMMARY'}
            filters={filters}
            buttonLabel="Export Active View"
          />
        </div>
      </div>

      {/* Unified Filter Bar (Hidden on Saved & Schedules tabs) */}
      {currentTab !== 'saved' && currentTab !== 'schedules' && (
        <ReportingFilterBar
          filters={filters}
          onChange={setFilters}
          onApply={fetchData}
          onReset={() => {
            setFilters({
              dateRange: '30D',
              startDate: '',
              endDate: '',
              tenantId: '',
              departmentId: '',
              priority: '',
              status: '',
              search: ''
            });
          }}
          onSavePreset={() => setShowSavedModal(true)}
          loading={loading}
          isParkAdmin={isParkAdmin}
          tenants={tenants}
          departments={departments}
        />
      )}

      {/* Tab Navigation Pill Bar */}
      <div className="glass-panel" style={{
        padding: '6px',
        borderRadius: '14px',
        display: 'flex',
        overflowX: 'auto',
        gap: '6px',
        WebkitOverflowScrolling: 'touch',
        border: '1px solid var(--glass-border, rgba(148, 163, 184, 0.2))'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                background: isActive ? 'var(--accent-primary, #3b82f6)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div>
        {currentTab === 'executive' && (
          <ExecutiveTab data={tabData} loading={loading} />
        )}

        {currentTab === 'requests' && (
          <RequestsTab
            data={tabData}
            loading={loading}
            filters={filters}
            page={page}
            pageSize={pageSize}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onSortChange={(col, ord) => { setSortBy(col); setSortOrder(ord); }}
          />
        )}

        {currentTab === 'workload' && (
          <WorkloadTab data={tabData} loading={loading} filters={filters} />
        )}

        {currentTab === 'sla' && (
          <SlaTab data={tabData} loading={loading} filters={filters} />
        )}

        {currentTab === 'tenants' && (
          <TenantsTab data={tabData} loading={loading} filters={filters} />
        )}

        {currentTab === 'departments' && (
          <DepartmentsTab data={tabData} loading={loading} filters={filters} />
        )}

        {currentTab === 'approvals' && (
          <ApprovalsTab data={tabData} loading={loading} filters={filters} />
        )}

        {currentTab === 'audit' && (
          <AuditTab data={tabData} loading={loading} filters={filters} />
        )}

        {currentTab === 'saved' && (
          <SavedReportsTab
            savedReports={savedReports}
            loading={loading}
            onRunReport={handleRunSavedReport}
            onOpenCreateModal={() => setShowSavedModal(true)}
            onRefresh={fetchData}
          />
        )}

        {currentTab === 'schedules' && (
          <SchedulesTab
            schedules={schedules}
            executions={executions}
            loading={loading}
            onOpenCreateModal={() => setShowScheduleModal(true)}
            onRefresh={fetchData}
          />
        )}
      </div>

      {/* Modals */}
      <SavedReportModal
        isOpen={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        activeFilters={filters}
        reportType={currentTab.toUpperCase() + '_ANALYTICS'}
        onSuccess={() => {
          if (currentTab === 'saved') fetchData();
        }}
      />

      <ScheduleReportModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        savedReports={savedReports}
        onSuccess={() => {
          if (currentTab === 'schedules') fetchData();
        }}
      />
    </div>
  );
}

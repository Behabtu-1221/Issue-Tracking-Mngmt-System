import reportingRepository from '../repositories/reporting.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { generateCSV, generateExcelHTML } from '../utils/export-generator.js';

/**
 * Resolves date range bounds based on quick preset or explicit ISO dates.
 */
function resolveDateRange(dateRange, startDate, endDate) {
  const now = new Date();
  let start = startDate ? new Date(startDate) : null;
  let end = endDate ? new Date(endDate) : null;

  if (dateRange && dateRange !== 'CUSTOM') {
    end = new Date(now);
    switch (dateRange) {
      case 'TODAY':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case '7D':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30D':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90D':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'YTD':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case '1Y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  return {
    startDate: start ? start.toISOString() : undefined,
    endDate: end ? end.toISOString() : undefined
  };
}

/**
 * Derives the maximum authorized data scope from the authenticated actor.
 * Enforces strict multi-tenant isolation and role-aware restrictions.
 */
function resolveScope(actor, queryFilters = {}) {
  const userType = actor?.userTypeCode || '';
  const isParkAdmin = userType === 'SUPER_ADMIN' || userType === 'PARK_ADMIN' || userType === 'PARK_SUPER_ADMIN';

  let tenantId = queryFilters.tenantId ? Number(queryFilters.tenantId) : undefined;
  let departmentId = queryFilters.departmentId ? Number(queryFilters.departmentId) : undefined;
  let teamId = queryFilters.teamId ? Number(queryFilters.teamId) : undefined;
  let assignedUserId = queryFilters.assignedUserId ? Number(queryFilters.assignedUserId) : undefined;
  let requesterUserId = queryFilters.requesterUserId ? Number(queryFilters.requesterUserId) : undefined;

  if (!isParkAdmin) {
    // Non-park-admins are strictly isolated to their own Tenant
    if (actor?.tenantId) {
      tenantId = Number(actor.tenantId);
    }

    if (userType === 'TECHNICIAN' || userType === 'PARK_TECHNICIAN') {
      assignedUserId = Number(actor.userId);
    } else if (userType === 'EMPLOYEE' || userType === 'TENANT_USER') {
      requesterUserId = Number(actor.userId);
    }
  }

  return {
    tenantId,
    departmentId,
    teamId,
    assignedUserId,
    requesterUserId,
    isGlobal: isParkAdmin
  };
}

export const reportingService = {
  // ── Executive Overview ──
  async getExecutiveOverview(filters, actor) {
    const scope = resolveScope(actor, filters);
    const dates = resolveDateRange(filters.dateRange || '30D', filters.startDate, filters.endDate);

    return reportingRepository.getExecutiveOverview({
      ...scope,
      ...dates,
      priority: filters.priority,
      status: filters.status
    });
  },

  // ── Request Analytics ──
  async getRequestAnalytics(filters, actor) {
    const scope = resolveScope(actor, filters);
    const dates = resolveDateRange(filters.dateRange, filters.startDate, filters.endDate);

    return reportingRepository.getRequestAnalytics({
      ...scope,
      ...dates,
      priority: filters.priority,
      status: filters.status,
      categoryId: filters.serviceCategoryId,
      serviceId: filters.serviceId,
      search: filters.search,
      page: Number(filters.page || 1),
      limit: Number(filters.limit || 50),
      sortBy: filters.sortBy || 'CreatedDate',
      sortOrder: filters.sortOrder || 'DESC'
    });
  },

  // ── Assignment & Workload ──
  async getAssignmentAnalytics(filters, actor) {
    const scope = resolveScope(actor, filters);
    const dates = resolveDateRange(filters.dateRange, filters.startDate, filters.endDate);

    return reportingRepository.getAssignmentAnalytics({
      ...scope,
      ...dates
    });
  },

  // ── SLA & Escalation Performance ──
  async getSLAAnalytics(filters, actor) {
    const scope = resolveScope(actor, filters);
    const dates = resolveDateRange(filters.dateRange, filters.startDate, filters.endDate);

    return reportingRepository.getSLAAnalytics({
      ...scope,
      ...dates,
      priority: filters.priority
    });
  },

  // ── Tenant Performance ──
  async getTenantPerformance(filters, actor) {
    const scope = resolveScope(actor, filters);
    const dates = resolveDateRange(filters.dateRange, filters.startDate, filters.endDate);

    return reportingRepository.getTenantPerformance({
      tenantId: scope.tenantId,
      ...dates,
      page: Number(filters.page || 1),
      limit: Number(filters.limit || 50)
    });
  },

  // ── Department Performance ──
  async getDepartmentPerformance(filters, actor) {
    const scope = resolveScope(actor, filters);
    const dates = resolveDateRange(filters.dateRange, filters.startDate, filters.endDate);

    return reportingRepository.getDepartmentPerformance({
      tenantId: scope.tenantId,
      departmentId: scope.departmentId,
      ...dates
    });
  },

  // ── Approval Analytics ──
  async getApprovalAnalytics(filters, actor) {
    const scope = resolveScope(actor, filters);
    const dates = resolveDateRange(filters.dateRange, filters.startDate, filters.endDate);

    return reportingRepository.getApprovalAnalytics({
      tenantId: scope.tenantId,
      departmentId: scope.departmentId,
      ...dates
    });
  },

  // ── Audit Analytics ──
  async getAuditAnalytics(filters, actor) {
    const scope = resolveScope(actor, filters);
    const dates = resolveDateRange(filters.dateRange, filters.startDate, filters.endDate);

    return reportingRepository.getAuditAnalytics({
      tenantId: scope.tenantId,
      userId: filters.userId ? Number(filters.userId) : undefined,
      ...dates,
      page: Number(filters.page || 1),
      limit: Number(filters.limit || 50)
    });
  },

  // ── Saved Reports CRUD ──
  async getSavedReports(actor) {
    const scope = resolveScope(actor);
    return reportingRepository.getSavedReports({
      tenantId: scope.tenantId,
      userId: actor?.userId,
      isGlobal: scope.isGlobal
    });
  },

  async createSavedReport(data, actor) {
    const scope = resolveScope(actor);
    return reportingRepository.createSavedReport({
      ...data,
      TenantID: scope.tenantId || null,
      CreatedBy: Number(actor?.userId || 1)
    });
  },

  async updateSavedReport(id, data, actor) {
    const report = await reportingRepository.findSavedReportById(id);
    if (!report) {
      throw new AppError(`Saved report with ID ${id} not found`, 404);
    }
    const scope = resolveScope(actor);
    if (!scope.isGlobal && Number(report.CreatedBy) !== Number(actor?.userId)) {
      throw new AppError('Access denied: You can only modify reports you created', 403);
    }
    return reportingRepository.updateSavedReport(id, {
      ...data,
      ModifiedBy: Number(actor?.userId || 1)
    });
  },

  async deleteSavedReport(id, actor) {
    const report = await reportingRepository.findSavedReportById(id);
    if (!report) {
      throw new AppError(`Saved report with ID ${id} not found`, 404);
    }
    const scope = resolveScope(actor);
    if (!scope.isGlobal && Number(report.CreatedBy) !== Number(actor?.userId)) {
      throw new AppError('Access denied: You can only delete reports you created', 403);
    }
    await reportingRepository.deleteSavedReport(id, Number(actor?.userId || 1));
    return { message: 'Saved report deleted successfully' };
  },

  // ── Report Schedules CRUD ──
  async getReportSchedules(actor) {
    const scope = resolveScope(actor);
    return reportingRepository.getReportSchedules({
      tenantId: scope.tenantId,
      isGlobal: scope.isGlobal
    });
  },

  async createReportSchedule(data, actor) {
    const scope = resolveScope(actor);
    return reportingRepository.createReportSchedule({
      ...data,
      TenantID: scope.tenantId || null,
      CreatedBy: Number(actor?.userId || 1)
    });
  },

  async updateReportSchedule(id, data, actor) {
    const sched = await reportingRepository.findReportScheduleById(id);
    if (!sched) {
      throw new AppError(`Report schedule with ID ${id} not found`, 404);
    }
    return reportingRepository.updateReportSchedule(id, {
      ...data,
      ModifiedBy: Number(actor?.userId || 1)
    });
  },

  async deleteReportSchedule(id, actor) {
    const sched = await reportingRepository.findReportScheduleById(id);
    if (!sched) {
      throw new AppError(`Report schedule with ID ${id} not found`, 404);
    }
    await reportingRepository.deleteReportSchedule(id, Number(actor?.userId || 1));
    return { message: 'Report schedule removed successfully' };
  },

  async triggerScheduleExecution(id, actor) {
    const startTime = Date.now();
    const sched = await reportingRepository.findReportScheduleById(id);
    if (!sched) {
      throw new AppError(`Report schedule with ID ${id} not found`, 404);
    }

    // Execute corresponding report domain based on schedule type
    let rowsCount = 0;
    const scope = resolveScope(actor, { tenantId: sched.TenantID });

    try {
      if (sched.ReportTypeCode === 'REQUEST_ANALYTICS') {
        const res = await reportingRepository.getRequestAnalytics({ ...scope, limit: 500 });
        rowsCount = res.total;
      } else if (sched.ReportTypeCode === 'TENANT_ANALYTICS') {
        const res = await reportingRepository.getTenantPerformance({ tenantId: scope.tenantId, limit: 500 });
        rowsCount = res.total;
      } else {
        const res = await reportingRepository.getExecutiveOverview(scope);
        rowsCount = res.kpis?.totalRequests || 1;
      }

      const durationMs = Date.now() - startTime;

      await reportingRepository.updateReportSchedule(id, {
        LastRunDateTime: new Date(),
        NextRunDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await reportingRepository.recordExecution({
        SavedReportID: sched.SavedReportID,
        ReportScheduleID: sched.ReportScheduleID,
        TenantID: sched.TenantID,
        ReportName: sched.ScheduleName,
        ReportTypeCode: sched.ReportTypeCode,
        TriggerType: 'SCHEDULED_TRIGGER',
        ExportFormat: sched.ExportFormat,
        RowCount: rowsCount,
        DurationMs: durationMs,
        StatusCode: 'SUCCESS',
        ExecutedByUserID: Number(actor?.userId || 1),
        ExecutionStartDateTime: new Date(startTime),
        ExecutionEndDateTime: new Date()
      });

      return { message: `Report schedule '${sched.ScheduleName}' executed successfully`, rowCount: rowsCount, durationMs };
    } catch (err) {
      await reportingRepository.recordExecution({
        SavedReportID: sched.SavedReportID,
        ReportScheduleID: sched.ReportScheduleID,
        TenantID: sched.TenantID,
        ReportName: sched.ScheduleName,
        ReportTypeCode: sched.ReportTypeCode,
        TriggerType: 'SCHEDULED_TRIGGER',
        ExportFormat: sched.ExportFormat,
        RowCount: 0,
        DurationMs: Date.now() - startTime,
        StatusCode: 'FAILED',
        ErrorMessage: err.message,
        ExecutedByUserID: Number(actor?.userId || 1),
        ExecutionStartDateTime: new Date(startTime),
        ExecutionEndDateTime: new Date()
      });
      throw err;
    }
  },

  async getExecutionHistory(actor) {
    const scope = resolveScope(actor);
    return reportingRepository.getExecutionHistory({
      tenantId: scope.tenantId,
      isGlobal: scope.isGlobal,
      limit: 50
    });
  },

  // ── Universal Export Engine ──
  async exportReport(reportType, format, filters, actor) {
    const startTime = Date.now();
    const scope = resolveScope(actor, filters);
    const dates = resolveDateRange(filters.dateRange, filters.startDate, filters.endDate);

    let columns = [];
    let rows = [];
    let title = 'Operational Intelligence Report';
    let summaryStats = null;

    if (reportType === 'REQUEST_ANALYTICS' || reportType === 'REQUESTS') {
      title = 'Issue & Request Analytics Report';
      const result = await reportingRepository.getRequestAnalytics({
        ...scope,
        ...dates,
        priority: filters.priority,
        status: filters.status,
        limit: 500
      });
      rows = result.requests || [];
      columns = [
        { key: 'RequestNumber', label: 'Ticket #' },
        { key: 'Title', label: 'Title / Subject' },
        { key: 'PriorityCode', label: 'Priority' },
        { key: 'StatusCode', label: 'Status' },
        { key: 'TenantName', label: 'Tenant Company' },
        { key: 'DepartmentName', label: 'Responsible Dept' },
        { key: 'AssignedTechnicianName', label: 'Assigned Technician' },
        { key: 'RequesterName', label: 'Requester' },
        { key: 'CreatedDate', label: 'Created Date' },
        { key: 'ElapsedHours', label: 'Elapsed (Hrs)' },
        { key: 'SLAStatus', label: 'SLA Status' }
      ];
    } else if (reportType === 'TENANT_ANALYTICS' || reportType === 'TENANTS') {
      title = 'Tenant Service Performance & Benchmarking';
      const result = await reportingRepository.getTenantPerformance({
        tenantId: scope.tenantId,
        ...dates,
        limit: 200
      });
      rows = result.tenants || [];
      columns = [
        { key: 'CompanyName', label: 'Company Name' },
        { key: 'TenantCode', label: 'Tenant Code' },
        { key: 'TenantStatus', label: 'Status' },
        { key: 'TotalRequests', label: 'Total Requests' },
        { key: 'OpenRequests', label: 'Open Work' },
        { key: 'ClosedRequests', label: 'Closed Work' },
        { key: 'ResolutionRatePct', label: 'Resolution Rate (%)' },
        { key: 'AvgResolutionHours', label: 'Avg Resolution (Hrs)' },
        { key: 'SLABreachCount', label: 'SLA Breaches' }
      ];
    } else if (reportType === 'WORKLOAD_ANALYTICS' || reportType === 'WORKLOAD') {
      title = 'Technician & Team Workload Distribution';
      const result = await reportingRepository.getAssignmentAnalytics({
        ...scope,
        ...dates
      });
      rows = result.technicianWorkload || [];
      columns = [
        { key: 'TechnicianName', label: 'Technician Name' },
        { key: 'Email', label: 'Email' },
        { key: 'TeamName', label: 'Assigned Team' },
        { key: 'DepartmentName', label: 'Department' },
        { key: 'ActiveWorkload', label: 'Active Workload' },
        { key: 'CompletedTasks', label: 'Completed Tasks' },
        { key: 'TotalAssigned', label: 'Total Assigned' },
        { key: 'AvgCompletionHours', label: 'Avg Turnaround (Hrs)' }
      ];
    } else if (reportType === 'DEPARTMENT_ANALYTICS' || reportType === 'DEPARTMENTS') {
      title = 'Department Performance & Workload Efficiency';
      rows = await reportingRepository.getDepartmentPerformance({
        tenantId: scope.tenantId,
        departmentId: scope.departmentId,
        ...dates
      });
      columns = [
        { key: 'DepartmentName', label: 'Department Name' },
        { key: 'DepartmentCode', label: 'Code' },
        { key: 'OrganizationUnitName', label: 'Org Unit' },
        { key: 'TotalAssignedRequests', label: 'Total Workload' },
        { key: 'ActiveWorkload', label: 'Active Open' },
        { key: 'ResolvedRequests', label: 'Resolved' },
        { key: 'CompletionRatePct', label: 'Completion (%)' },
        { key: 'AvgResolutionHours', label: 'Avg Resolution (Hrs)' },
        { key: 'SLABreaches', label: 'SLA Breaches' }
      ];
    } else {
      title = 'Executive BI Dashboard KPI Summary';
      const exec = await reportingRepository.getExecutiveOverview({ ...scope, ...dates });
      summaryStats = {
        'Total Request Volume': exec.kpis?.totalRequests || 0,
        'Active Open Requests': exec.kpis?.openRequests || 0,
        'Resolved / Closed Requests': exec.kpis?.closedRequests || 0,
        'Resolution Rate': `${exec.kpis?.resolutionRatePct || 0}%`,
        'SLA Compliance Rate': `${exec.kpis?.slaCompliancePct || 0}%`,
        'Total SLA Breaches': exec.kpis?.totalSlaBreaches || 0,
        'Overdue Requests': exec.kpis?.overdueRequests || 0,
        'Avg Resolution Turnaround': `${exec.kpis?.avgResolutionHours || 0} Hours`
      };
      rows = (exec.volumeTrend || []).map(t => ({
        PeriodDate: t.PeriodDate,
        TotalCount: t.TotalCount,
        ResolvedCount: t.ResolvedCount,
        CriticalCount: t.CriticalCount
      }));
      columns = [
        { key: 'PeriodDate', label: 'Period Date' },
        { key: 'TotalCount', label: 'Total Submissions' },
        { key: 'ResolvedCount', label: 'Resolved Tickets' },
        { key: 'CriticalCount', label: 'Critical (P1)' }
      ];
    }

    let fileContent = '';
    let mimeType = 'text/csv';
    let fileExt = 'csv';

    const normalizedFormat = format?.toUpperCase() || 'CSV';

    if (normalizedFormat === 'EXCEL' || normalizedFormat === 'XLSX') {
      fileContent = generateExcelHTML(title, columns, rows, summaryStats);
      mimeType = 'application/vnd.ms-excel';
      fileExt = 'xls';
    } else {
      fileContent = generateCSV(columns, rows);
      mimeType = 'text/csv';
      fileExt = 'csv';
    }

    // Record execution in history
    await reportingRepository.recordExecution({
      TenantID: scope.tenantId,
      ReportName: title,
      ReportTypeCode: reportType,
      TriggerType: 'EXPORT_DOWNLOAD',
      ExportFormat: normalizedFormat,
      RowCount: rows.length,
      DurationMs: Date.now() - startTime,
      StatusCode: 'SUCCESS',
      ExecutedByUserID: Number(actor?.userId || 1),
      ExecutionStartDateTime: new Date(startTime),
      ExecutionEndDateTime: new Date()
    });

    const filename = `${reportType.toLowerCase()}_export_${new Date().toISOString().slice(0, 10)}.${fileExt}`;

    return {
      fileContent,
      mimeType,
      filename,
      rowCount: rows.length
    };
  }
};

export default reportingService;

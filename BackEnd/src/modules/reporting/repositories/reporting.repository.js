import { query } from '../../../database/connection.js';

export const reportingRepository = {
  // ==========================================================================
  // 1. EXECUTIVE & OPERATIONAL OVERVIEW
  // ==========================================================================
  async getExecutiveOverview({ tenantId, departmentId, teamId, assignedUserId, requesterUserId, startDate, endDate, priority, status } = {}) {
    let whereSql = `WHERE ir.IsDeleted = 0`;
    const params = [];

    if (tenantId) {
      whereSql += ` AND ir.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (departmentId) {
      whereSql += ` AND ir.AssignedDepartmentID = ?`;
      params.push(Number(departmentId));
    }
    if (teamId) {
      whereSql += ` AND EXISTS (SELECT 1 FROM Assignment a WHERE a.RequestID = ir.IssueRequestID AND a.AssignedTeamID = ? AND a.IsDeleted = 0)`;
      params.push(Number(teamId));
    }
    if (assignedUserId) {
      whereSql += ` AND EXISTS (SELECT 1 FROM Assignment a WHERE a.RequestID = ir.IssueRequestID AND a.AssignedUserID = ? AND a.IsDeleted = 0)`;
      params.push(Number(assignedUserId));
    }
    if (requesterUserId) {
      whereSql += ` AND ir.RequesterUserID = ?`;
      params.push(Number(requesterUserId));
    }
    if (priority) {
      whereSql += ` AND ir.PriorityCode = ?`;
      params.push(priority);
    }
    if (status) {
      whereSql += ` AND ir.StatusCode = ?`;
      params.push(status);
    }
    if (startDate) {
      whereSql += ` AND ir.CreatedDate >= ?`;
      params.push(new Date(startDate));
    }
    if (endDate) {
      whereSql += ` AND ir.CreatedDate <= ?`;
      params.push(new Date(endDate));
    }

    // 1. Summary Counts & KPIs
    const summarySql = `
      SELECT 
        COUNT(*) AS TotalRequests,
        SUM(CASE WHEN ir.StatusCode IN ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'INVESTIGATING', 'WORK_COMPLETED') THEN 1 ELSE 0 END) AS OpenRequests,
        SUM(CASE WHEN ir.StatusCode IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) AS ClosedRequests,
        SUM(CASE WHEN ir.StatusCode = 'CANCELLED' THEN 1 ELSE 0 END) AS CancelledRequests,
        SUM(CASE WHEN ir.StatusCode IN ('NEW', 'ASSIGNED', 'IN_PROGRESS') AND ir.TargetResolutionDateTime IS NOT NULL AND ir.TargetResolutionDateTime < NOW() THEN 1 ELSE 0 END) AS OverdueRequests,
        SUM(CASE WHEN ir.IsMajorIncident = 1 THEN 1 ELSE 0 END) AS MajorIncidents,
        ROUND(AVG(CASE WHEN ir.ActualResolutionDateTime IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, ir.CreatedDate, ir.ActualResolutionDateTime) / 60.0 ELSE NULL END), 1) AS AvgResolutionHours,
        ROUND(AVG(CASE WHEN ir.StatusCode IN ('RESOLVED', 'CLOSED') THEN TIMESTAMPDIFF(MINUTE, ir.CreatedDate, COALESCE(ir.ActualResolutionDateTime, ir.ClosedDateTime)) / 60.0 ELSE NULL END), 1) AS AvgTurnaroundHours
      FROM IssueRequest ir
      ${whereSql}
    `;
    const [summary] = await query(summarySql, params);

    // 2. SLA Compliance & Breaches (from SLAClock & SLABreach)
    const slaSql = `
      SELECT 
        COUNT(sc.SLAClockID) AS TotalClocks,
        SUM(CASE WHEN sc.IsResolutionBreached = 0 AND sc.ClockStatus IN ('STOPPED', 'COMPLETED') THEN 1 ELSE 0 END) AS CompliantClocks,
        SUM(CASE WHEN sc.IsResolutionBreached = 1 OR sc.IsResponseBreached = 1 THEN 1 ELSE 0 END) AS BreachedClocks,
        SUM(CASE WHEN sc.ClockStatus = 'RUNNING' AND sc.ResolutionDeadline < NOW() THEN 1 ELSE 0 END) AS ActiveOverdueClocks
      FROM SLAClock sc
      JOIN IssueRequest ir ON sc.IssueRequestID = ir.IssueRequestID
      ${whereSql} AND sc.IsDeleted = 0
    `;
    const [slaMetrics] = await query(slaSql, params);

    // 3. Escalations Count
    const escSql = `
      SELECT COUNT(eh.EscalationHistoryID) AS TotalEscalations
      FROM EscalationHistory eh
      JOIN IssueRequest ir ON eh.IssueRequestID = ir.IssueRequestID
      ${whereSql} AND eh.IsDeleted = 0
    `;
    const [escMetrics] = await query(escSql, params);

    // 4. Volume Trend by Day / Month (Last 30 periods)
    const trendSql = `
      SELECT 
        DATE_FORMAT(ir.CreatedDate, '%Y-%m-%d') AS PeriodDate,
        COUNT(*) AS TotalCount,
        SUM(CASE WHEN ir.StatusCode IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) AS ResolvedCount,
        SUM(CASE WHEN ir.PriorityCode IN ('P1', 'CRITICAL') THEN 1 ELSE 0 END) AS CriticalCount
      FROM IssueRequest ir
      ${whereSql}
      GROUP BY DATE_FORMAT(ir.CreatedDate, '%Y-%m-%d')
      ORDER BY PeriodDate ASC
      LIMIT 60
    `;
    const volumeTrend = await query(trendSql, params);

    // 5. Distribution by Priority
    const prioritySql = `
      SELECT 
        ir.PriorityCode,
        COUNT(*) AS Count,
        ROUND((COUNT(*) / NULLIF((SELECT COUNT(*) FROM IssueRequest ir2 ${whereSql.replace(/ir\./g, 'ir2.')}), 0)) * 100, 1) AS Pct
      FROM IssueRequest ir
      ${whereSql}
      GROUP BY ir.PriorityCode
      ORDER BY FIELD(ir.PriorityCode, 'P1', 'CRITICAL', 'P2', 'HIGH', 'P3', 'MEDIUM', 'P4', 'LOW')
    `;
    const priorityDistribution = await query(prioritySql, [...params, ...params]);

    // 6. Distribution by Status
    const statusSql = `
      SELECT 
        ir.StatusCode,
        COUNT(*) AS Count
      FROM IssueRequest ir
      ${whereSql}
      GROUP BY ir.StatusCode
      ORDER BY Count DESC
    `;
    const statusDistribution = await query(statusSql, params);

    // Mathematical KPI calculations with division-by-zero protection
    const total = Number(summary?.TotalRequests) || 0;
    const closed = Number(summary?.ClosedRequests) || 0;
    const open = Number(summary?.OpenRequests) || 0;
    const escalations = Number(escMetrics?.TotalEscalations) || 0;
    const totalClocks = Number(slaMetrics?.TotalClocks) || 0;
    const compliantClocks = Number(slaMetrics?.CompliantClocks) || 0;

    const resolutionRatePct = total > 0 ? Number(((closed / total) * 100).toFixed(1)) : 0;
    const slaCompliancePct = totalClocks > 0 ? Number(((compliantClocks / totalClocks) * 100).toFixed(1)) : 100.0;
    const escalationRatePct = total > 0 ? Number(((escalations / total) * 100).toFixed(1)) : 0;

    return {
      kpis: {
        totalRequests: total,
        openRequests: open,
        closedRequests: closed,
        cancelledRequests: Number(summary?.CancelledRequests) || 0,
        overdueRequests: Number(summary?.OverdueRequests) || 0,
        majorIncidents: Number(summary?.MajorIncidents) || 0,
        resolutionRatePct,
        slaCompliancePct,
        escalationRatePct,
        totalEscalations: escalations,
        totalSlaBreaches: Number(slaMetrics?.BreachedClocks) || 0,
        avgResolutionHours: Number(summary?.AvgResolutionHours) || 0,
        avgTurnaroundHours: Number(summary?.AvgTurnaroundHours) || 0
      },
      volumeTrend,
      priorityDistribution,
      statusDistribution
    };
  },

  // ==========================================================================
  // 2. DETAILED REQUEST & ISSUE ANALYTICS (PAGINATED & FILTERABLE)
  // ==========================================================================
  async getRequestAnalytics({ tenantId, departmentId, teamId, assignedUserId, requesterUserId, startDate, endDate, priority, status, categoryId, serviceId, search, page = 1, limit = 50, sortBy = 'CreatedDate', sortOrder = 'DESC' } = {}) {
    const offset = (page - 1) * limit;
    let whereSql = `WHERE ir.IsDeleted = 0`;
    const params = [];

    if (tenantId) {
      whereSql += ` AND ir.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (departmentId) {
      whereSql += ` AND ir.AssignedDepartmentID = ?`;
      params.push(Number(departmentId));
    }
    if (teamId) {
      whereSql += ` AND a.AssignedTeamID = ?`;
      params.push(Number(teamId));
    }
    if (assignedUserId) {
      whereSql += ` AND a.AssignedUserID = ?`;
      params.push(Number(assignedUserId));
    }
    if (requesterUserId) {
      whereSql += ` AND ir.RequesterUserID = ?`;
      params.push(Number(requesterUserId));
    }
    if (categoryId) {
      whereSql += ` AND (ir.CategoryCode = (SELECT CategoryCode FROM ServiceCategory WHERE ServiceCategoryID = ?) OR s.ServiceCategoryID = ?)`;
      params.push(Number(categoryId), Number(categoryId));
    }
    if (serviceId) {
      whereSql += ` AND ir.ServiceID = ?`;
      params.push(Number(serviceId));
    }
    if (priority) {
      whereSql += ` AND ir.PriorityCode = ?`;
      params.push(priority);
    }
    if (status) {
      whereSql += ` AND ir.StatusCode = ?`;
      params.push(status);
    }
    if (startDate) {
      whereSql += ` AND ir.CreatedDate >= ?`;
      params.push(new Date(startDate));
    }
    if (endDate) {
      whereSql += ` AND ir.CreatedDate <= ?`;
      params.push(new Date(endDate));
    }
    if (search) {
      whereSql += ` AND (ir.RequestNumber LIKE ? OR ir.Title LIKE ? OR ir.Description LIKE ? OR t.CompanyName LIKE ? OR d.DepartmentName LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const safeSort = ['CreatedDate', 'RequestNumber', 'PriorityCode', 'StatusCode', 'Title', 'TargetResolutionDateTime', 'ActualResolutionDateTime'].includes(sortBy) ? `ir.${sortBy}` : 'ir.CreatedDate';
    const safeOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const listSql = `
      SELECT 
        ir.IssueRequestID,
        ir.RequestNumber,
        ir.Title,
        ir.Description,
        ir.PriorityCode,
        ir.StatusCode,
        ir.RequestTypeCode,
        ir.RequestChannelCode,
        ir.CategoryCode,
        ir.CreatedDate,
        ir.TargetResolutionDateTime,
        ir.ActualResolutionDateTime,
        ir.ClosedDateTime,
        ir.IsMajorIncident,
        t.TenantID,
        t.CompanyName AS TenantName,
        d.DepartmentID,
        d.DepartmentName,
        CONCAT(uReq.FirstName, ' ', COALESCE(uReq.LastName, '')) AS RequesterName,
        uReq.Email AS RequesterEmail,
        CONCAT(uAss.FirstName, ' ', COALESCE(uAss.LastName, '')) AS AssignedTechnicianName,
        tm.TeamName AS AssignedTeamName,
        s.ServiceName,
        sc.CategoryName,
        b.BuildingName,
        ROUND(TIMESTAMPDIFF(MINUTE, ir.CreatedDate, COALESCE(ir.ActualResolutionDateTime, NOW())) / 60.0, 1) AS ElapsedHours,
        CASE 
          WHEN ir.StatusCode IN ('RESOLVED', 'CLOSED') AND (ir.TargetResolutionDateTime IS NULL OR ir.ActualResolutionDateTime <= ir.TargetResolutionDateTime) THEN 'SLA_MET'
          WHEN ir.StatusCode IN ('RESOLVED', 'CLOSED') AND ir.ActualResolutionDateTime > ir.TargetResolutionDateTime THEN 'SLA_BREACHED'
          WHEN ir.StatusCode NOT IN ('RESOLVED', 'CLOSED') AND ir.TargetResolutionDateTime IS NOT NULL AND ir.TargetResolutionDateTime < NOW() THEN 'SLA_OVERDUE'
          ELSE 'ON_TRACK'
        END AS SLAStatus
      FROM IssueRequest ir
      LEFT JOIN Tenant t ON ir.TenantID = t.TenantID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN \`User\` uReq ON ir.RequesterUserID = uReq.UserID
      LEFT JOIN Assignment a ON ir.IssueRequestID = a.RequestID AND a.IsActive = 1 AND a.IsDeleted = 0
      LEFT JOIN \`User\` uAss ON a.AssignedUserID = uAss.UserID
      LEFT JOIN Team tm ON a.AssignedTeamID = tm.TeamID
      LEFT JOIN Service s ON ir.ServiceID = s.ServiceID
      LEFT JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
      LEFT JOIN Building b ON ir.BuildingID = b.BuildingID
      ${whereSql}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const rows = await query(listSql, params);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM IssueRequest ir
      LEFT JOIN Tenant t ON ir.TenantID = t.TenantID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN Assignment a ON ir.IssueRequestID = a.RequestID AND a.IsActive = 1 AND a.IsDeleted = 0
      LEFT JOIN Service s ON ir.ServiceID = s.ServiceID
      ${whereSql}
    `;
    const [countRes] = await query(countSql, params);

    // Distribution by Category
    const catDistSql = `
      SELECT 
        COALESCE(sc.CategoryName, ir.CategoryCode, 'General Maintenance') AS CategoryName,
        COUNT(*) AS Count
      FROM IssueRequest ir
      LEFT JOIN Service s ON ir.ServiceID = s.ServiceID
      LEFT JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
      LEFT JOIN Tenant t ON ir.TenantID = t.TenantID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN Assignment a ON ir.IssueRequestID = a.RequestID AND a.IsActive = 1 AND a.IsDeleted = 0
      ${whereSql}
      GROUP BY COALESCE(sc.CategoryName, ir.CategoryCode, 'General Maintenance')
      ORDER BY Count DESC
      LIMIT 10
    `;
    const categoryDistribution = await query(catDistSql, params);

    // Distribution by Channel
    const channelDistSql = `
      SELECT 
        COALESCE(ir.RequestChannelCode, 'PORTAL') AS ChannelCode,
        COUNT(*) AS Count
      FROM IssueRequest ir
      LEFT JOIN Tenant t ON ir.TenantID = t.TenantID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN Assignment a ON ir.IssueRequestID = a.RequestID AND a.IsActive = 1 AND a.IsDeleted = 0
      LEFT JOIN Service s ON ir.ServiceID = s.ServiceID
      ${whereSql}
      GROUP BY COALESCE(ir.RequestChannelCode, 'PORTAL')
      ORDER BY Count DESC
    `;
    const channelDistribution = await query(channelDistSql, params);

    return {
      requests: rows,
      total: countRes?.total || 0,
      page: Number(page),
      limit: Number(limit),
      categoryDistribution,
      channelDistribution
    };
  },

  // ==========================================================================
  // 3. ASSIGNMENT & DISPATCH WORKLOAD ANALYTICS
  // ==========================================================================
  async getAssignmentAnalytics({ tenantId, departmentId, teamId, startDate, endDate } = {}) {
    let whereSql = `WHERE ir.IsDeleted = 0`;
    const params = [];

    if (tenantId) {
      whereSql += ` AND ir.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (departmentId) {
      whereSql += ` AND ir.AssignedDepartmentID = ?`;
      params.push(Number(departmentId));
    }
    if (teamId) {
      whereSql += ` AND a.AssignedTeamID = ?`;
      params.push(Number(teamId));
    }
    if (startDate) {
      whereSql += ` AND ir.CreatedDate >= ?`;
      params.push(new Date(startDate));
    }
    if (endDate) {
      whereSql += ` AND ir.CreatedDate <= ?`;
      params.push(new Date(endDate));
    }

    // 1. Overall Assignment Summary
    const summarySql = `
      SELECT 
        COUNT(*) AS TotalRequests,
        SUM(CASE WHEN a.AssignmentID IS NOT NULL THEN 1 ELSE 0 END) AS AssignedRequests,
        SUM(CASE WHEN a.AssignmentID IS NULL AND ir.StatusCode IN ('NEW', 'PENDING_APPROVAL') THEN 1 ELSE 0 END) AS UnassignedBacklog,
        SUM(CASE WHEN a.AssignmentStatusCode = 'ASSIGNED' THEN 1 ELSE 0 END) AS AssignedPendingStart,
        SUM(CASE WHEN a.AssignmentStatusCode = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS ActiveInProgress,
        SUM(CASE WHEN a.AssignmentStatusCode = 'COMPLETED' THEN 1 ELSE 0 END) AS CompletedAssignments
      FROM IssueRequest ir
      LEFT JOIN Assignment a ON ir.IssueRequestID = a.RequestID AND a.IsActive = 1 AND a.IsDeleted = 0
      ${whereSql}
    `;
    const [summary] = await query(summarySql, params);

    // 2. Technician Workload Breakdown (Neutral Operational Terminology)
    const techSql = `
      SELECT 
        u.UserID,
        CONCAT(u.FirstName, ' ', COALESCE(u.LastName, '')) AS TechnicianName,
        u.Email,
        tm.TeamName,
        d.DepartmentName,
        COUNT(a.AssignmentID) AS TotalAssigned,
        SUM(CASE WHEN a.AssignmentStatusCode IN ('ASSIGNED', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS ActiveWorkload,
        SUM(CASE WHEN a.AssignmentStatusCode = 'COMPLETED' THEN 1 ELSE 0 END) AS CompletedTasks,
        ROUND(AVG(CASE WHEN a.CompleteDateTime IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, a.AssignedDateTime, a.CompleteDateTime) / 60.0 ELSE NULL END), 1) AS AvgCompletionHours
      FROM Assignment a
      JOIN \`User\` u ON a.AssignedUserID = u.UserID
      JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN Team tm ON a.AssignedTeamID = tm.TeamID
      ${whereSql.replace(/a\./g, 'a.')} AND a.IsDeleted = 0
      GROUP BY u.UserID, TechnicianName, u.Email, tm.TeamName, d.DepartmentName
      ORDER BY ActiveWorkload DESC, TotalAssigned DESC
      LIMIT 25
    `;
    const technicianWorkload = await query(techSql, params);

    // 3. Team Workload Breakdown
    const teamSql = `
      SELECT 
        tm.TeamID,
        tm.TeamName,
        d.DepartmentName,
        COUNT(a.AssignmentID) AS TotalAssignments,
        SUM(CASE WHEN a.AssignmentStatusCode IN ('ASSIGNED', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS ActiveWorkload,
        SUM(CASE WHEN a.AssignmentStatusCode = 'COMPLETED' THEN 1 ELSE 0 END) AS CompletedWork
      FROM Team tm
      JOIN Department d ON tm.DepartmentID = d.DepartmentID
      LEFT JOIN Assignment a ON tm.TeamID = a.AssignedTeamID AND a.IsDeleted = 0
      LEFT JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID AND ir.IsDeleted = 0
      WHERE tm.IsDeleted = 0
      ${departmentId ? 'AND tm.DepartmentID = ?' : ''}
      GROUP BY tm.TeamID, tm.TeamName, d.DepartmentName
      ORDER BY ActiveWorkload DESC
    `;
    const teamWorkload = await query(teamSql, departmentId ? [Number(departmentId)] : []);

    return {
      summary: {
        totalRequests: Number(summary?.TotalRequests) || 0,
        assignedRequests: Number(summary?.AssignedRequests) || 0,
        unassignedBacklog: Number(summary?.UnassignedBacklog) || 0,
        assignedPendingStart: Number(summary?.AssignedPendingStart) || 0,
        activeInProgress: Number(summary?.ActiveInProgress) || 0,
        completedAssignments: Number(summary?.CompletedAssignments) || 0
      },
      technicianWorkload,
      teamWorkload
    };
  },

  // ==========================================================================
  // 4. SLA & ESCALATION PERFORMANCE ANALYTICS
  // ==========================================================================
  async getSLAAnalytics({ tenantId, departmentId, teamId, startDate, endDate, priority } = {}) {
    let whereSql = `WHERE ir.IsDeleted = 0`;
    const params = [];

    if (tenantId) { whereSql += ` AND ir.TenantID = ?`; params.push(Number(tenantId)); }
    if (departmentId) { whereSql += ` AND ir.AssignedDepartmentID = ?`; params.push(Number(departmentId)); }
    if (teamId) {
      whereSql += ` AND EXISTS (SELECT 1 FROM Assignment a WHERE a.RequestID = ir.IssueRequestID AND a.AssignedTeamID = ?)`;
      params.push(Number(teamId));
    }
    if (priority) { whereSql += ` AND ir.PriorityCode = ?`; params.push(priority); }
    if (startDate) { whereSql += ` AND ir.CreatedDate >= ?`; params.push(new Date(startDate)); }
    if (endDate) { whereSql += ` AND ir.CreatedDate <= ?`; params.push(new Date(endDate)); }

    // 1. SLA Summary Metrics
    const slaSummarySql = `
      SELECT 
        COUNT(sc.SLAClockID) AS TotalClocks,
        SUM(CASE WHEN sc.IsResponseBreached = 0 THEN 1 ELSE 0 END) AS ResponseCompliant,
        SUM(CASE WHEN sc.IsResponseBreached = 1 THEN 1 ELSE 0 END) AS ResponseBreached,
        SUM(CASE WHEN sc.IsResolutionBreached = 0 THEN 1 ELSE 0 END) AS ResolutionCompliant,
        SUM(CASE WHEN sc.IsResolutionBreached = 1 THEN 1 ELSE 0 END) AS ResolutionBreached,
        SUM(CASE WHEN sc.ClockStatus = 'RUNNING' THEN 1 ELSE 0 END) AS ActiveRunningClocks,
        SUM(CASE WHEN sc.ClockStatus = 'PAUSED' THEN 1 ELSE 0 END) AS PausedClocks,
        SUM(CASE WHEN sc.ClockStatus = 'STOPPED' THEN 1 ELSE 0 END) AS CompletedClocks
      FROM SLAClock sc
      JOIN IssueRequest ir ON sc.IssueRequestID = ir.IssueRequestID
      ${whereSql} AND sc.IsDeleted = 0
    `;
    const [slaSummary] = await query(slaSummarySql, params);

    // 2. SLA Performance by Priority
    const prioritySlaSql = `
      SELECT 
        ir.PriorityCode,
        COUNT(sc.SLAClockID) AS TotalClocks,
        SUM(CASE WHEN sc.IsResolutionBreached = 0 THEN 1 ELSE 0 END) AS CompliantCount,
        SUM(CASE WHEN sc.IsResolutionBreached = 1 THEN 1 ELSE 0 END) AS BreachedCount,
        ROUND((SUM(CASE WHEN sc.IsResolutionBreached = 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(sc.SLAClockID), 0)) * 100, 1) AS CompliancePct
      FROM SLAClock sc
      JOIN IssueRequest ir ON sc.IssueRequestID = ir.IssueRequestID
      ${whereSql} AND sc.IsDeleted = 0
      GROUP BY ir.PriorityCode
      ORDER BY FIELD(ir.PriorityCode, 'P1', 'CRITICAL', 'P2', 'HIGH', 'P3', 'MEDIUM', 'P4', 'LOW')
    `;
    const performanceByPriority = await query(prioritySlaSql, params);

    // 3. SLA Performance by Department
    const deptSlaSql = `
      SELECT 
        d.DepartmentName,
        COUNT(sc.SLAClockID) AS TotalClocks,
        SUM(CASE WHEN sc.IsResolutionBreached = 0 THEN 1 ELSE 0 END) AS CompliantCount,
        SUM(CASE WHEN sc.IsResolutionBreached = 1 THEN 1 ELSE 0 END) AS BreachedCount,
        ROUND((SUM(CASE WHEN sc.IsResolutionBreached = 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(sc.SLAClockID), 0)) * 100, 1) AS CompliancePct
      FROM SLAClock sc
      JOIN IssueRequest ir ON sc.IssueRequestID = ir.IssueRequestID
      JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      ${whereSql} AND sc.IsDeleted = 0
      GROUP BY d.DepartmentName
      ORDER BY CompliancePct DESC
    `;
    const performanceByDepartment = await query(deptSlaSql, params);

    // 4. Recent Breaches Log
    const breachLogSql = `
      SELECT 
        sb.SLABreachID,
        sb.BreachType,
        sb.ActualBreachDateTime,
        sb.SeverityLevel,
        sb.IsAcknowledged,
        sb.AcknowledgedDateTime,
        CONCAT(uAck.FirstName, ' ', COALESCE(uAck.LastName, '')) AS AcknowledgedByName,
        ir.RequestNumber,
        ir.Title AS RequestTitle,
        ir.PriorityCode,
        d.DepartmentName
      FROM SLABreach sb
      JOIN SLAClock sc ON sb.SLAClockID = sc.SLAClockID
      JOIN IssueRequest ir ON sc.IssueRequestID = ir.IssueRequestID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN \`User\` uAck ON sb.AcknowledgedByUserID = uAck.UserID
      ${whereSql} AND sb.IsDeleted = 0
      ORDER BY sb.ActualBreachDateTime DESC
      LIMIT 20
    `;
    const recentBreaches = await query(breachLogSql, params);

    const totalClocks = Number(slaSummary?.TotalClocks) || 0;
    const resCompliant = Number(slaSummary?.ResolutionCompliant) || 0;
    const respCompliant = Number(slaSummary?.ResponseCompliant) || 0;

    return {
      kpis: {
        totalClocks,
        resolutionCompliancePct: totalClocks > 0 ? Number(((resCompliant / totalClocks) * 100).toFixed(1)) : 100.0,
        responseCompliancePct: totalClocks > 0 ? Number(((respCompliant / totalClocks) * 100).toFixed(1)) : 100.0,
        totalBreaches: (Number(slaSummary?.ResolutionBreached) || 0) + (Number(slaSummary?.ResponseBreached) || 0),
        activeRunningClocks: Number(slaSummary?.ActiveRunningClocks) || 0,
        pausedClocks: Number(slaSummary?.PausedClocks) || 0,
        completedClocks: Number(slaSummary?.CompletedClocks) || 0
      },
      performanceByPriority,
      performanceByDepartment,
      recentBreaches
    };
  },

  // ==========================================================================
  // 5. TENANT PERFORMANCE & BENCHMARKING (AUTHORIZED CROSS-TENANT)
  // ==========================================================================
  async getTenantPerformance({ tenantId, startDate, endDate, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    let whereSql = `WHERE t.IsDeleted = 0`;
    const params = [];

    if (tenantId) {
      whereSql += ` AND t.TenantID = ?`;
      params.push(Number(tenantId));
    }

    let irFilter = `ir.IsDeleted = 0`;
    const irParams = [];
    if (startDate) { irFilter += ` AND ir.CreatedDate >= ?`; irParams.push(new Date(startDate)); }
    if (endDate) { irFilter += ` AND ir.CreatedDate <= ?`; irParams.push(new Date(endDate)); }

    const sql = `
      SELECT 
        t.TenantID,
        t.TenantCode,
        t.CompanyName,
        t.Status AS TenantStatus,
        COUNT(ir.IssueRequestID) AS TotalRequests,
        SUM(CASE WHEN ir.StatusCode IN ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL') THEN 1 ELSE 0 END) AS OpenRequests,
        SUM(CASE WHEN ir.StatusCode IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) AS ClosedRequests,
        ROUND((SUM(CASE WHEN ir.StatusCode IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) / NULLIF(COUNT(ir.IssueRequestID), 0)) * 100, 1) AS ResolutionRatePct,
        ROUND(AVG(CASE WHEN ir.ActualResolutionDateTime IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, ir.CreatedDate, ir.ActualResolutionDateTime) / 60.0 ELSE NULL END), 1) AS AvgResolutionHours,
        (
          SELECT COUNT(*)
          FROM SLAClock sc
          JOIN IssueRequest ir2 ON sc.IssueRequestID = ir2.IssueRequestID
          WHERE ir2.TenantID = t.TenantID AND sc.IsResolutionBreached = 1 AND sc.IsDeleted = 0
        ) AS SLABreachCount
      FROM Tenant t
      LEFT JOIN IssueRequest ir ON t.TenantID = ir.TenantID AND ${irFilter}
      ${whereSql}
      GROUP BY t.TenantID, t.TenantCode, t.CompanyName, t.Status
      ORDER BY TotalRequests DESC, t.CompanyName ASC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const rows = await query(sql, [...irParams, ...params]);

    const countSql = `SELECT COUNT(*) AS total FROM Tenant t ${whereSql}`;
    const [countRes] = await query(countSql, params);

    return {
      tenants: rows,
      total: countRes?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  // ==========================================================================
  // 6. DEPARTMENT PERFORMANCE & RESOLUTION EFFICIENCY
  // ==========================================================================
  async getDepartmentPerformance({ tenantId, departmentId, startDate, endDate } = {}) {
    let whereSql = `WHERE d.IsDeleted = 0`;
    const params = [];

    if (departmentId) {
      whereSql += ` AND d.DepartmentID = ?`;
      params.push(Number(departmentId));
    }

    let irFilter = `ir.IsDeleted = 0`;
    const irParams = [];
    if (tenantId) { irFilter += ` AND ir.TenantID = ?`; irParams.push(Number(tenantId)); }
    if (startDate) { irFilter += ` AND ir.CreatedDate >= ?`; irParams.push(new Date(startDate)); }
    if (endDate) { irFilter += ` AND ir.CreatedDate <= ?`; irParams.push(new Date(endDate)); }

    const sql = `
      SELECT 
        d.DepartmentID,
        d.DepartmentCode,
        d.DepartmentName,
        ou.UnitName AS OrganizationUnitName,
        COUNT(ir.IssueRequestID) AS TotalAssignedRequests,
        SUM(CASE WHEN ir.StatusCode IN ('NEW', 'ASSIGNED', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS ActiveWorkload,
        SUM(CASE WHEN ir.StatusCode IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) AS ResolvedRequests,
        ROUND((SUM(CASE WHEN ir.StatusCode IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) / NULLIF(COUNT(ir.IssueRequestID), 0)) * 100, 1) AS CompletionRatePct,
        ROUND(AVG(CASE WHEN ir.ActualResolutionDateTime IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, ir.CreatedDate, ir.ActualResolutionDateTime) / 60.0 ELSE NULL END), 1) AS AvgResolutionHours,
        (
          SELECT COUNT(*) 
          FROM Team tm 
          WHERE tm.DepartmentID = d.DepartmentID AND tm.IsDeleted = 0
        ) AS TotalTeamsCount,
        (
          SELECT COUNT(*)
          FROM SLAClock sc
          JOIN IssueRequest ir2 ON sc.IssueRequestID = ir2.IssueRequestID
          WHERE ir2.AssignedDepartmentID = d.DepartmentID AND sc.IsResolutionBreached = 1 AND sc.IsDeleted = 0
        ) AS SLABreaches
      FROM Department d
      LEFT JOIN OrganizationUnit ou ON d.OrganizationUnitID = ou.OrganizationUnitID
      LEFT JOIN IssueRequest ir ON d.DepartmentID = ir.AssignedDepartmentID AND ${irFilter}
      ${whereSql}
      GROUP BY d.DepartmentID, d.DepartmentCode, d.DepartmentName, ou.UnitName
      ORDER BY ActiveWorkload DESC, TotalAssignedRequests DESC
    `;

    return query(sql, [...irParams, ...params]);
  },

  // ==========================================================================
  // 7. APPROVAL & GOVERNANCE ANALYTICS
  // ==========================================================================
  async getApprovalAnalytics({ tenantId, departmentId, startDate, endDate } = {}) {
    let whereSql = `WHERE app.IsDeleted = 0`;
    const params = [];

    if (tenantId) { whereSql += ` AND ir.TenantID = ?`; params.push(Number(tenantId)); }
    if (departmentId) { whereSql += ` AND ir.AssignedDepartmentID = ?`; params.push(Number(departmentId)); }
    if (startDate) { whereSql += ` AND app.CreatedDate >= ?`; params.push(new Date(startDate)); }
    if (endDate) { whereSql += ` AND app.CreatedDate <= ?`; params.push(new Date(endDate)); }

    const summarySql = `
      SELECT 
        COUNT(app.ApprovalID) AS TotalApprovals,
        SUM(CASE WHEN app.ApprovalStatusCode = 'PENDING' THEN 1 ELSE 0 END) AS PendingApprovals,
        SUM(CASE WHEN app.ApprovalStatusCode = 'APPROVED' THEN 1 ELSE 0 END) AS ApprovedCount,
        SUM(CASE WHEN app.ApprovalStatusCode = 'REJECTED' THEN 1 ELSE 0 END) AS RejectedCount,
        SUM(CASE WHEN app.ApprovalStatusCode = 'RETURNED' THEN 1 ELSE 0 END) AS ReturnedCount,
        ROUND(AVG(CASE WHEN app.FinalActionedDateTime IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, app.CreatedDate, app.FinalActionedDateTime) / 60.0 ELSE NULL END), 1) AS AvgTurnaroundHours
      FROM Approval app
      LEFT JOIN IssueRequest ir ON app.RequestID = ir.IssueRequestID
      ${whereSql}
    `;
    const [summary] = await query(summarySql, params);

    const stageBreakdownSql = `
      SELECT 
        ast.StageNumber,
        COUNT(ast.ApprovalStageID) AS TotalStages,
        SUM(CASE WHEN ast.StageStatusCode = 'PENDING' THEN 1 ELSE 0 END) AS PendingStages,
        SUM(CASE WHEN ast.StageStatusCode = 'APPROVED' THEN 1 ELSE 0 END) AS ApprovedStages,
        SUM(CASE WHEN ast.StageStatusCode = 'REJECTED' THEN 1 ELSE 0 END) AS RejectedStages
      FROM ApprovalStage ast
      JOIN Approval app ON ast.ApprovalID = app.ApprovalID
      LEFT JOIN IssueRequest ir ON app.RequestID = ir.IssueRequestID
      ${whereSql} AND ast.IsDeleted = 0
      GROUP BY ast.StageNumber
      ORDER BY ast.StageNumber ASC
    `;
    const stageBreakdown = await query(stageBreakdownSql, params);

    return {
      kpis: {
        totalApprovals: Number(summary?.TotalApprovals) || 0,
        pendingApprovals: Number(summary?.PendingApprovals) || 0,
        approvedCount: Number(summary?.ApprovedCount) || 0,
        rejectedCount: Number(summary?.RejectedCount) || 0,
        returnedCount: Number(summary?.ReturnedCount) || 0,
        avgTurnaroundHours: Number(summary?.AvgTurnaroundHours) || 0
      },
      stageBreakdown
    };
  },

  // ==========================================================================
  // 8. AUDIT & COMPLIANCE TELEMETRY
  // ==========================================================================
  async getAuditAnalytics({ tenantId, userId, startDate, endDate, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    let whereSql = `WHERE al.IsDeleted = 0`;
    const params = [];

    if (tenantId) { whereSql += ` AND al.TenantID = ?`; params.push(Number(tenantId)); }
    if (userId) { whereSql += ` AND al.UserID = ?`; params.push(Number(userId)); }
    if (startDate) { whereSql += ` AND al.AuditDateTime >= ?`; params.push(new Date(startDate)); }
    if (endDate) { whereSql += ` AND al.AuditDateTime <= ?`; params.push(new Date(endDate)); }

    const summarySql = `
      SELECT 
        COUNT(*) AS TotalAuditEvents,
        COUNT(DISTINCT al.UserID) AS ActiveUsersCount,
        COUNT(DISTINCT al.IPAddress) AS UniqueIPsCount
      FROM AuditLog al
      ${whereSql}
    `;
    const [summary] = await query(summarySql, params);

    const logSql = `
      SELECT 
        al.AuditLogID,
        al.TenantID,
        al.UserID,
        al.RecordID,
        al.IPAddress,
        al.UserAgent,
        al.AuditDateTime,
        CONCAT(u.FirstName, ' ', COALESCE(u.LastName, '')) AS UserName,
        u.Email AS UserEmail,
        t.CompanyName AS TenantName
      FROM AuditLog al
      LEFT JOIN \`User\` u ON al.UserID = u.UserID
      LEFT JOIN Tenant t ON al.TenantID = t.TenantID
      ${whereSql}
      ORDER BY al.AuditDateTime DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;
    const logs = await query(logSql, params);

    const [countRes] = await query(`SELECT COUNT(*) AS total FROM AuditLog al ${whereSql}`, params);

    return {
      summary: {
        totalAuditEvents: Number(summary?.TotalAuditEvents) || 0,
        activeUsersCount: Number(summary?.ActiveUsersCount) || 0,
        uniqueIPsCount: Number(summary?.UniqueIPsCount) || 0
      },
      logs,
      total: countRes?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  // ==========================================================================
  // 9. KNOWLEDGE BASE ANALYTICS
  // ==========================================================================
  async getKnowledgeAnalytics() {
    const summarySql = `
      SELECT 
        COUNT(*) AS TotalArticles,
        SUM(CASE WHEN ArticleStatusCode = 'PUBLISHED' THEN 1 ELSE 0 END) AS PublishedArticles,
        SUM(CASE WHEN ArticleStatusCode = 'DRAFT' THEN 1 ELSE 0 END) AS DraftArticles,
        COALESCE(SUM(ViewsCount), 0) AS TotalViews,
        COALESCE(SUM(LikesCount), 0) AS TotalLikes
      FROM KnowledgeArticle
      WHERE IsDeleted = 0
    `;
    const [summary] = await query(summarySql);

    const topArticlesSql = `
      SELECT 
        ka.KnowledgeArticleID,
        ka.Title,
        ka.ArticleStatusCode,
        ka.ViewsCount,
        ka.LikesCount,
        ka.CreatedDate,
        kc.CategoryName,
        CONCAT(u.FirstName, ' ', COALESCE(u.LastName, '')) AS AuthorName
      FROM KnowledgeArticle ka
      LEFT JOIN KnowledgeCategory kc ON ka.KnowledgeCategoryID = kc.KnowledgeCategoryID
      LEFT JOIN \`User\` u ON ka.AuthorUserID = u.UserID
      WHERE ka.IsDeleted = 0
      ORDER BY ka.ViewsCount DESC, ka.LikesCount DESC
      LIMIT 10
    `;
    const topArticles = await query(topArticlesSql);

    return {
      summary: {
        totalArticles: Number(summary?.TotalArticles) || 0,
        publishedArticles: Number(summary?.PublishedArticles) || 0,
        draftArticles: Number(summary?.DraftArticles) || 0,
        totalViews: Number(summary?.TotalViews) || 0,
        totalLikes: Number(summary?.TotalLikes) || 0
      },
      topArticles
    };
  },

  // ==========================================================================
  // 10. SAVED REPORTS PERSISTENCE
  // ==========================================================================
  async getSavedReports({ tenantId, userId, isGlobal } = {}) {
    let sql = `
      SELECT 
        sr.SavedReportID,
        sr.TenantID,
        sr.ReportName,
        sr.Description,
        sr.ReportTypeCode,
        sr.ConfigJson,
        sr.VisibilityCode,
        sr.CreatedBy,
        sr.CreatedDate,
        CONCAT(u.FirstName, ' ', COALESCE(u.LastName, '')) AS CreatorName
      FROM SavedReport sr
      LEFT JOIN \`User\` u ON sr.CreatedBy = u.UserID
      WHERE sr.IsDeleted = 0
    `;
    const params = [];

    if (!isGlobal) {
      sql += ` AND (sr.CreatedBy = ? OR sr.VisibilityCode = 'BUSINESS_PARK' OR (sr.TenantID = ? AND sr.VisibilityCode IN ('COMPANY', 'DEPARTMENT', 'TEAM')))`;
      params.push(Number(userId || 1), Number(tenantId || 0));
    }

    sql += ` ORDER BY sr.CreatedDate DESC`;
    return query(sql, params);
  },

  async findSavedReportById(id) {
    const sql = `SELECT * FROM SavedReport WHERE SavedReportID = ? AND IsDeleted = 0`;
    const [row] = await query(sql, [id]);
    return row || null;
  },

  async createSavedReport(data) {
    const sql = `
      INSERT INTO SavedReport (
        TenantID, ReportName, Description, ReportTypeCode, ConfigJson, VisibilityCode, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.TenantID || null,
      data.ReportName,
      data.Description || null,
      data.ReportTypeCode,
      data.ConfigJson ? JSON.stringify(data.ConfigJson) : null,
      data.VisibilityCode || 'PRIVATE',
      data.CreatedBy || 1
    ]);
    return this.findSavedReportById(result.insertId);
  },

  async updateSavedReport(id, data) {
    const fields = [];
    const params = [];

    if (data.ReportName !== undefined) { fields.push('ReportName = ?'); params.push(data.ReportName); }
    if (data.Description !== undefined) { fields.push('Description = ?'); params.push(data.Description); }
    if (data.ReportTypeCode !== undefined) { fields.push('ReportTypeCode = ?'); params.push(data.ReportTypeCode); }
    if (data.ConfigJson !== undefined) { fields.push('ConfigJson = ?'); params.push(JSON.stringify(data.ConfigJson)); }
    if (data.VisibilityCode !== undefined) { fields.push('VisibilityCode = ?'); params.push(data.VisibilityCode); }
    if (data.IsActive !== undefined) { fields.push('IsActive = ?'); params.push(Number(data.IsActive)); }
    if (data.ModifiedBy !== undefined) { fields.push('ModifiedBy = ?'); params.push(data.ModifiedBy); }

    if (fields.length === 0) return this.findSavedReportById(id);

    fields.push('ModifiedDate = CURRENT_TIMESTAMP(6)');
    params.push(id);

    const sql = `UPDATE SavedReport SET ${fields.join(', ')} WHERE SavedReportID = ? AND IsDeleted = 0`;
    await query(sql, params);
    return this.findSavedReportById(id);
  },

  async deleteSavedReport(id, userId) {
    const sql = `UPDATE SavedReport SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6) WHERE SavedReportID = ?`;
    await query(sql, [userId || 1, id]);
    return true;
  },

  // ==========================================================================
  // 11. REPORT SCHEDULES & EXECUTION HISTORY
  // ==========================================================================
  async getReportSchedules({ tenantId, isGlobal } = {}) {
    let sql = `
      SELECT 
        rs.*,
        sr.ReportName AS SavedReportName,
        CONCAT(u.FirstName, ' ', COALESCE(u.LastName, '')) AS CreatorName
      FROM ReportSchedule rs
      LEFT JOIN SavedReport sr ON rs.SavedReportID = sr.SavedReportID
      LEFT JOIN \`User\` u ON rs.CreatedBy = u.UserID
      WHERE rs.IsDeleted = 0
    `;
    const params = [];
    if (!isGlobal && tenantId) {
      sql += ` AND (rs.TenantID = ? OR rs.TenantID IS NULL)`;
      params.push(Number(tenantId));
    }
    sql += ` ORDER BY rs.CreatedDate DESC`;
    return query(sql, params);
  },

  async findReportScheduleById(id) {
    const sql = `SELECT * FROM ReportSchedule WHERE ReportScheduleID = ? AND IsDeleted = 0`;
    const [row] = await query(sql, [id]);
    return row || null;
  },

  async createReportSchedule(data) {
    const sql = `
      INSERT INTO ReportSchedule (
        SavedReportID, TenantID, ScheduleName, ReportTypeCode, FrequencyCode, CronExpression, RecipientsJson, ExportFormat, Status, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.SavedReportID || null,
      data.TenantID || null,
      data.ScheduleName,
      data.ReportTypeCode || 'EXECUTIVE_SUMMARY',
      data.FrequencyCode || 'WEEKLY',
      data.CronExpression || null,
      data.RecipientsJson ? JSON.stringify(data.RecipientsJson) : null,
      data.ExportFormat || 'CSV',
      data.Status || 'ACTIVE',
      data.CreatedBy || 1
    ]);
    return this.findReportScheduleById(result.insertId);
  },

  async updateReportSchedule(id, data) {
    const fields = [];
    const params = [];

    if (data.ScheduleName !== undefined) { fields.push('ScheduleName = ?'); params.push(data.ScheduleName); }
    if (data.ReportTypeCode !== undefined) { fields.push('ReportTypeCode = ?'); params.push(data.ReportTypeCode); }
    if (data.FrequencyCode !== undefined) { fields.push('FrequencyCode = ?'); params.push(data.FrequencyCode); }
    if (data.CronExpression !== undefined) { fields.push('CronExpression = ?'); params.push(data.CronExpression); }
    if (data.RecipientsJson !== undefined) { fields.push('RecipientsJson = ?'); params.push(JSON.stringify(data.RecipientsJson)); }
    if (data.ExportFormat !== undefined) { fields.push('ExportFormat = ?'); params.push(data.ExportFormat); }
    if (data.Status !== undefined) { fields.push('Status = ?'); params.push(data.Status); }
    if (data.IsActive !== undefined) { fields.push('IsActive = ?'); params.push(Number(data.IsActive)); }
    if (data.LastRunDateTime !== undefined) { fields.push('LastRunDateTime = ?'); params.push(data.LastRunDateTime); }
    if (data.NextRunDateTime !== undefined) { fields.push('NextRunDateTime = ?'); params.push(data.NextRunDateTime); }
    if (data.ModifiedBy !== undefined) { fields.push('ModifiedBy = ?'); params.push(data.ModifiedBy); }

    if (fields.length === 0) return this.findReportScheduleById(id);

    fields.push('ModifiedDate = CURRENT_TIMESTAMP(6)');
    params.push(id);

    const sql = `UPDATE ReportSchedule SET ${fields.join(', ')} WHERE ReportScheduleID = ? AND IsDeleted = 0`;
    await query(sql, params);
    return this.findReportScheduleById(id);
  },

  async deleteReportSchedule(id, userId) {
    const sql = `UPDATE ReportSchedule SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6) WHERE ReportScheduleID = ?`;
    await query(sql, [userId || 1, id]);
    return true;
  },

  async recordExecution(data) {
    const sql = `
      INSERT INTO ReportExecutionHistory (
        SavedReportID, ReportScheduleID, TenantID, ReportName, ReportTypeCode, TriggerType, ExportFormat, RowCount, DurationMs, StatusCode, ErrorMessage, ExecutedByUserID, ExecutionStartDateTime, ExecutionEndDateTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.SavedReportID || null,
      data.ReportScheduleID || null,
      data.TenantID || null,
      data.ReportName || 'Custom Report Export',
      data.ReportTypeCode || 'GENERAL',
      data.TriggerType || 'MANUAL',
      data.ExportFormat || 'CSV',
      data.RowCount || 0,
      data.DurationMs || 0,
      data.StatusCode || 'SUCCESS',
      data.ErrorMessage || null,
      data.ExecutedByUserID || 1,
      data.ExecutionStartDateTime || new Date(),
      data.ExecutionEndDateTime || new Date()
    ]);
    return result.insertId;
  },

  async getExecutionHistory({ tenantId, isGlobal, limit = 50 } = {}) {
    let sql = `
      SELECT 
        reh.*,
        CONCAT(u.FirstName, ' ', COALESCE(u.LastName, '')) AS ExecutedByName
      FROM ReportExecutionHistory reh
      LEFT JOIN \`User\` u ON reh.ExecutedByUserID = u.UserID
      WHERE 1=1
    `;
    const params = [];
    if (!isGlobal && tenantId) {
      sql += ` AND (reh.TenantID = ? OR reh.TenantID IS NULL)`;
      params.push(Number(tenantId));
    }
    sql += ` ORDER BY reh.ExecutionStartDateTime DESC LIMIT ${Number(limit)}`;
    return query(sql, params);
  }
};

export default reportingRepository;

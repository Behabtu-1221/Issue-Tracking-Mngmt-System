import { query } from '../../../database/connection.js';

export const serviceAnalyticsRepository = {
  async getOverviewMetrics(tenantId) {
    const summarySql = `
      SELECT 
        (SELECT COUNT(*) FROM ServiceCategory WHERE IsDeleted = 0) AS TotalCategories,
        (SELECT COUNT(*) FROM Service WHERE IsDeleted = 0 AND IsActive = 1) AS TotalActiveServices,
        (SELECT COUNT(*) FROM IssueRequest WHERE ServiceID IS NOT NULL AND IsDeleted = 0) AS TotalServiceRequests,
        (SELECT COUNT(*) FROM ApprovalRequest WHERE IsDeleted = 0 AND ApprovalStatusCode = 'APPROVED') AS TotalApprovedRequests,
        (SELECT COUNT(*) FROM SLAClock WHERE ClockStatus = 'RUNNING' AND IsDeleted = 0) AS ActiveSLAClocks,
        (SELECT COUNT(*) FROM SLAClock WHERE IsBreached = 1 AND IsDeleted = 0) AS SLABreachCount
    `;
    const [summary] = await query(summarySql);

    const categoryBreakdownSql = `
      SELECT 
        sc.CategoryName,
        sc.CategoryCode,
        COUNT(s.ServiceID) AS ServiceCount,
        COUNT(ir.IssueRequestID) AS TotalRequests,
        SUM(CASE WHEN ir.StatusCode = 'RESOLVED' OR ir.StatusCode = 'CLOSED' THEN 1 ELSE 0 END) AS ResolvedRequests,
        COALESCE(AVG(ir.EstimatedCost), 0) AS AvgEstimatedCost
      FROM ServiceCategory sc
      LEFT JOIN Service s ON sc.ServiceCategoryID = s.ServiceCategoryID AND s.IsDeleted = 0
      LEFT JOIN IssueRequest ir ON s.ServiceID = ir.ServiceID AND ir.IsDeleted = 0
      WHERE sc.IsDeleted = 0
      GROUP BY sc.ServiceCategoryID, sc.CategoryName, sc.CategoryCode
      ORDER BY TotalRequests DESC
    `;
    const categoryBreakdown = await query(categoryBreakdownSql);

    const slaComplianceSql = `
      SELECT 
        s.ServiceName,
        s.ServiceCode,
        COUNT(sc.SLAClockID) AS TotalMonitoredClocks,
        SUM(CASE WHEN sc.IsBreached = 1 THEN 1 ELSE 0 END) AS BreachedClocks,
        SUM(CASE WHEN sc.IsBreached = 0 THEN 1 ELSE 0 END) AS CompliantClocks,
        ROUND((SUM(CASE WHEN sc.IsBreached = 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(sc.SLAClockID), 0)) * 100, 1) AS ComplianceRatePct
      FROM Service s
      JOIN IssueRequest ir ON s.ServiceID = ir.ServiceID AND ir.IsDeleted = 0
      JOIN SLAClock sc ON ir.IssueRequestID = sc.IssueRequestID AND sc.IsDeleted = 0
      WHERE s.IsDeleted = 0
      GROUP BY s.ServiceID, s.ServiceName, s.ServiceCode
      ORDER BY TotalMonitoredClocks DESC
      LIMIT 5
    `;
    const slaCompliance = await query(slaComplianceSql);

    const approvalTurnaroundSql = `
      SELECT 
        s.ServiceName,
        COUNT(ar.ApprovalID) AS TotalApprovalsTriggered,
        SUM(CASE WHEN ar.ApprovalStatusCode = 'APPROVED' THEN 1 ELSE 0 END) AS ApprovedCount,
        SUM(CASE WHEN ar.ApprovalStatusCode = 'REJECTED' THEN 1 ELSE 0 END) AS RejectedCount,
        SUM(CASE WHEN ar.ApprovalStatusCode = 'PENDING' THEN 1 ELSE 0 END) AS PendingCount
      FROM Service s
      JOIN IssueRequest ir ON s.ServiceID = ir.ServiceID AND ir.IsDeleted = 0
      JOIN ApprovalRequest ar ON ir.IssueRequestID = ar.RequestID AND ar.IsDeleted = 0
      WHERE s.IsDeleted = 0
      GROUP BY s.ServiceID, s.ServiceName
      ORDER BY TotalApprovalsTriggered DESC
      LIMIT 5
    `;
    const approvalTurnaround = await query(approvalTurnaroundSql);

    return {
      summary: summary || {},
      categoryBreakdown: categoryBreakdown || [],
      slaCompliance: slaCompliance || [],
      approvalTurnaround: approvalTurnaround || []
    };
  }
};

export default serviceAnalyticsRepository;

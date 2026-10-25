import { query } from '../../../database/connection.js';
import { OptimisticLockError, NotFoundError } from '../../../shared/errors/AppError.js';

function applyDataScopeSQL(dataScope, baseSql, params) {
  if (!dataScope) return { sql: baseSql, params };
  let sql = baseSql;

  if (dataScope.type === 'OWN' && dataScope.userId) {
    sql += ` AND ir.RequesterUserID = ?`;
    params.push(Number(dataScope.userId));
  } else if (dataScope.type === 'ASSIGNED' && dataScope.userId) {
    sql += ` AND (ir.RequesterUserID = ? OR EXISTS (SELECT 1 FROM Assignment a WHERE a.IssueRequestID = ir.IssueRequestID AND a.AssignedTechnicianID = ? AND a.Status = 'ACTIVE'))`;
    params.push(Number(dataScope.userId), Number(dataScope.userId));
  } else if (dataScope.type === 'DEPARTMENT') {
    if (dataScope.tenantId) {
      sql += ` AND ir.TenantID = ?`;
      params.push(Number(dataScope.tenantId));
    }
    if (dataScope.departmentId) {
      sql += ` AND ir.AssignedDepartmentID = ?`;
      params.push(Number(dataScope.departmentId));
    }
  } else if (dataScope.type === 'TENANT') {
    if (dataScope.tenantId) {
      sql += ` AND ir.TenantID = ?`;
      params.push(Number(dataScope.tenantId));
    }
  }

  return { sql, params };
}

export const issueRequestRepository = {
  /**
   * Find all issue requests with extensive filters, joins, pagination, and RLS data scope.
   */
  async findAll({
    tenantId,
    requesterUserId,
    serviceId,
    buildingId,
    assignedDepartmentId,
    statusCode,
    priorityCode,
    requestTypeCode,
    isMajorIncident,
    search,
    page = 1,
    limit = 50,
    dataScope
  }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT ir.*,
        CAST(ir.RowVersion AS CHAR) AS RowVersion,
        t.CompanyName AS TenantName,
        COALESCE(s.ServiceName, 'General Request') AS ServiceName,
        COALESCE(sc.CategoryName, ir.CategoryCode, 'General') AS CategoryName,
        CONCAT(u.FirstName, ' ', u.LastName) AS RequesterName,
        u.Email AS RequesterEmail,
        b.BuildingName,
        os.OfficeNumber AS OfficeSpaceNumber,
        d.DepartmentName AS AssignedDepartmentName,
        rc.RootCauseID,
        res.ResolutionID
      FROM IssueRequest ir
      LEFT JOIN Tenant t ON ir.TenantID = t.TenantID
      LEFT JOIN Service s ON ir.ServiceID = s.ServiceID
      LEFT JOIN ServiceCategory sc ON (s.ServiceCategoryID = sc.ServiceCategoryID OR (ir.ServiceID IS NULL AND ir.CategoryCode = sc.CategoryCode))
      JOIN \`User\` u ON ir.RequesterUserID = u.UserID
      LEFT JOIN Building b ON ir.BuildingID = b.BuildingID
      LEFT JOIN OfficeSpace os ON ir.OfficeSpaceID = os.OfficeSpaceID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN RootCause rc ON ir.IssueRequestID = rc.IssueRequestID AND rc.IsDeleted = 0
      LEFT JOIN Resolution res ON ir.IssueRequestID = res.IssueRequestID AND res.IsDeleted = 0
      WHERE ir.IsDeleted = 0
    `;
    let params = [];

    if (tenantId) {
      sql += ` AND ir.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (requesterUserId) {
      sql += ` AND ir.RequesterUserID = ?`;
      params.push(Number(requesterUserId));
    }
    if (serviceId) {
      sql += ` AND ir.ServiceID = ?`;
      params.push(Number(serviceId));
    }
    if (buildingId) {
      sql += ` AND ir.BuildingID = ?`;
      params.push(Number(buildingId));
    }
    if (assignedDepartmentId) {
      sql += ` AND ir.AssignedDepartmentID = ?`;
      params.push(Number(assignedDepartmentId));
    }
    if (statusCode) {
      sql += ` AND ir.StatusCode = ?`;
      params.push(statusCode);
    }
    if (priorityCode) {
      sql += ` AND ir.PriorityCode = ?`;
      params.push(priorityCode);
    }
    if (requestTypeCode) {
      sql += ` AND ir.RequestTypeCode = ?`;
      params.push(requestTypeCode);
    }
    if (isMajorIncident !== undefined) {
      sql += ` AND ir.IsMajorIncident = ?`;
      params.push(Number(isMajorIncident));
    }
    if (search) {
      sql += ` AND (ir.RequestNumber LIKE ? OR ir.Title LIKE ? OR ir.Description LIKE ? OR u.FirstName LIKE ? OR u.LastName LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Apply RLS Data Scope
    const scoped = applyDataScopeSQL(dataScope, sql, params);
    sql = scoped.sql;
    params = scoped.params;

    sql += ` ORDER BY ir.CreatedDate DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const rows = await query(sql, params);

    // Total Count SQL
    let countSql = `
      SELECT COUNT(*) as total
      FROM IssueRequest ir
      JOIN \`User\` u ON ir.RequesterUserID = u.UserID
      WHERE ir.IsDeleted = 0
    `;
    let countParams = [];
    if (tenantId) { countSql += ` AND ir.TenantID = ?`; countParams.push(Number(tenantId)); }
    if (requesterUserId) { countSql += ` AND ir.RequesterUserID = ?`; countParams.push(Number(requesterUserId)); }
    if (serviceId) { countSql += ` AND ir.ServiceID = ?`; countParams.push(Number(serviceId)); }
    if (buildingId) { countSql += ` AND ir.BuildingID = ?`; countParams.push(Number(buildingId)); }
    if (assignedDepartmentId) { countSql += ` AND ir.AssignedDepartmentID = ?`; countParams.push(Number(assignedDepartmentId)); }
    if (statusCode) { countSql += ` AND ir.StatusCode = ?`; countParams.push(statusCode); }
    if (priorityCode) { countSql += ` AND ir.PriorityCode = ?`; countParams.push(priorityCode); }
    if (requestTypeCode) { countSql += ` AND ir.RequestTypeCode = ?`; countParams.push(requestTypeCode); }
    if (isMajorIncident !== undefined) { countSql += ` AND ir.IsMajorIncident = ?`; countParams.push(Number(isMajorIncident)); }
    if (search) {
      countSql += ` AND (ir.RequestNumber LIKE ? OR ir.Title LIKE ? OR ir.Description LIKE ? OR u.FirstName LIKE ? OR u.LastName LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countScoped = applyDataScopeSQL(dataScope, countSql, countParams);
    const countRes = await query(countScoped.sql, countScoped.params);

    return {
      issues: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  /**
   * Find issue request by ID with full details.
   */
  async findById(id, dataScope = null, tx = null) {
    let sql = `
      SELECT ir.*,
        CAST(ir.RowVersion AS CHAR) AS RowVersion,
        t.CompanyName AS TenantName,
        COALESCE(s.ServiceName, 'General Request') AS ServiceName,
        s.ServiceCode,
        COALESCE(sc.CategoryName, ir.CategoryCode, 'General') AS CategoryName,
        COALESCE(sc.CategoryCode, ir.CategoryCode) AS CategoryCode,
        CONCAT(u.FirstName, ' ', u.LastName) AS RequesterName,
        u.Email AS RequesterEmail,
        b.BuildingName,
        os.OfficeNumber AS OfficeSpaceNumber,
        d.DepartmentName AS AssignedDepartmentName,
        rc.RootCauseID,
        rc.RootCauseSummary,
        rc.RootCauseDetails,
        rc.CorrectiveActionsTaken,
        rc.PreventiveActionsProposed,
        rc.InvestigatorUserID,
        CONCAT(iu.FirstName, ' ', iu.LastName) AS InvestigatorName,
        res.ResolutionID,
        res.ResolutionTypeCode,
        res.ResolutionSummary,
        res.ActionStepsTaken,
        res.ResolvedDateTime,
        res.ResolverUserID,
        CONCAT(ru.FirstName, ' ', ru.LastName) AS ResolverName
      FROM IssueRequest ir
      LEFT JOIN Tenant t ON ir.TenantID = t.TenantID
      LEFT JOIN Service s ON ir.ServiceID = s.ServiceID
      LEFT JOIN ServiceCategory sc ON (s.ServiceCategoryID = sc.ServiceCategoryID OR (ir.ServiceID IS NULL AND ir.CategoryCode = sc.CategoryCode))
      JOIN \`User\` u ON ir.RequesterUserID = u.UserID
      LEFT JOIN Building b ON ir.BuildingID = b.BuildingID
      LEFT JOIN OfficeSpace os ON ir.OfficeSpaceID = os.OfficeSpaceID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN RootCause rc ON ir.IssueRequestID = rc.IssueRequestID AND rc.IsDeleted = 0
      LEFT JOIN \`User\` iu ON rc.InvestigatorUserID = iu.UserID
      LEFT JOIN Resolution res ON ir.IssueRequestID = res.IssueRequestID AND res.IsDeleted = 0
      LEFT JOIN \`User\` ru ON res.ResolverUserID = ru.UserID
      WHERE ir.IssueRequestID = ? AND ir.IsDeleted = 0
    `;
    let params = [id];

    const scoped = applyDataScopeSQL(dataScope, sql, params);
    const runner = (tx && typeof tx.query === 'function') ? tx.query.bind(tx) : query;
    const rows = await runner(scoped.sql, scoped.params);
    return rows[0] || null;
  },

  /**
   * Generate next unique RequestNumber (e.g. REQ-20260727-0001).
   */
  async generateRequestNumber(tx = null) {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `REQ-${todayStr}-`;
    const sql = `SELECT RequestNumber FROM IssueRequest WHERE RequestNumber LIKE ? ORDER BY IssueRequestID DESC LIMIT 1`;
    const runner = (tx && typeof tx.query === 'function') ? tx.query.bind(tx) : query;
    const rows = await runner(sql, [`${prefix}%`]);

    let seq = 1;
    if (rows.length > 0) {
      const lastNum = rows[0].RequestNumber;
      const parts = lastNum.split('-');
      if (parts.length === 3) {
        seq = parseInt(parts[2], 10) + 1;
      }
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
  },

  /**
   * Create a new issue request within an optional transaction.
   */
  async create(data, tx = null) {
    const requestNumber = await this.generateRequestNumber(tx);
    const sql = `
      INSERT INTO IssueRequest (
        TenantID, ServiceID, RequestNumber, Title, Description, RequestTypeCode,
        PriorityCode, StatusCode, RequestChannelCode, CategoryCode, SubCategoryCode,
        RequestSourceCode, RequesterUserID, BuildingID, OfficeSpaceID, AssignedDepartmentID,
        TargetResolutionDateTime, ResponseDueAt, ResolutionDueAt,
        IsMajorIncident, CustomFieldsDataJson, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const runner = (tx && typeof tx.query === 'function') ? tx.query.bind(tx) : query;
    const result = await runner(sql, [
      data.TenantID ?? null,
      data.ServiceID ? Number(data.ServiceID) : null,
      requestNumber,
      data.Title,
      data.Description,
      data.RequestTypeCode || 'INCIDENT',
      data.PriorityCode || 'MEDIUM',
      data.StatusCode || 'NEW',
      data.RequestChannelCode || 'WEB',
      data.CategoryCode || 'FACILITIES',
      data.SubCategoryCode ?? null,
      data.RequestSourceCode || 'TENANT',
      data.RequesterUserID,
      data.BuildingID ?? null,
      data.OfficeSpaceID ?? null,
      data.AssignedDepartmentID ?? null,
      data.TargetResolutionDateTime ?? null,
      data.ResponseDueAt ?? null,
      data.ResolutionDueAt ?? null,
      data.IsMajorIncident !== undefined ? Number(data.IsMajorIncident) : 0,
      data.CustomFieldsDataJson ? JSON.stringify(data.CustomFieldsDataJson) : null,
      data.CreatedBy || data.RequesterUserID || 1
    ]);
    return this.findById(result.insertId, null, tx);
  },

  /**
   * Update issue request fields with optional optimistic locking via expectedRowVersion.
   */
  async update(id, data, tx = null) {
    const runner = (tx && typeof tx.query === 'function') ? tx.query.bind(tx) : query;
    const expectedRowVersion = data.expectedRowVersion || data.RowVersion || null;

    let sql = `
      UPDATE IssueRequest SET
        Title = COALESCE(?, Title),
        Description = COALESCE(?, Description),
        PriorityCode = COALESCE(?, PriorityCode),
        StatusCode = COALESCE(?, StatusCode),
        BuildingID = COALESCE(?, BuildingID),
        OfficeSpaceID = COALESCE(?, OfficeSpaceID),
        AssignedDepartmentID = COALESCE(?, AssignedDepartmentID),
        IsMajorIncident = COALESCE(?, IsMajorIncident),
        CancellationReason = COALESCE(?, CancellationReason),
        ActualResolutionDateTime = COALESCE(?, ActualResolutionDateTime),
        ClosedDateTime = COALESCE(?, ClosedDateTime),
        ResponseDueAt = COALESCE(?, ResponseDueAt),
        ResolutionDueAt = COALESCE(?, ResolutionDueAt),
        SLAWarningSentAt = COALESCE(?, SLAWarningSentAt),
        SLAResponseBreachedAt = COALESCE(?, SLAResponseBreachedAt),
        SLAResolutionBreachedAt = COALESCE(?, SLAResolutionBreachedAt),
        CustomFieldsDataJson = COALESCE(?, CustomFieldsDataJson),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE IssueRequestID = ? AND IsDeleted = 0
    `;

    const params = [
      data.Title ?? null,
      data.Description ?? null,
      data.PriorityCode ?? null,
      data.StatusCode ?? null,
      data.BuildingID ?? null,
      data.OfficeSpaceID ?? null,
      data.AssignedDepartmentID ?? null,
      data.IsMajorIncident !== undefined ? Number(data.IsMajorIncident) : null,
      data.CancellationReason ?? null,
      data.ActualResolutionDateTime ?? null,
      data.ClosedDateTime ?? null,
      data.ResponseDueAt ?? null,
      data.ResolutionDueAt ?? null,
      data.SLAWarningSentAt ?? null,
      data.SLAResponseBreachedAt ?? null,
      data.SLAResolutionBreachedAt ?? null,
      data.CustomFieldsDataJson ? JSON.stringify(data.CustomFieldsDataJson) : null,
      data.ModifiedBy || 1,
      id
    ];

    if (expectedRowVersion) {
      sql += ` AND RowVersion = ?`;
      params.push(expectedRowVersion);
    }

    const result = await runner(sql, params);

    // Optimistic concurrency check: if 0 rows modified, verify cause
    if (result.affectedRows === 0 && expectedRowVersion) {
      const existing = await runner(`SELECT IssueRequestID FROM IssueRequest WHERE IssueRequestID = ? AND IsDeleted = 0`, [id]);
      if (existing && existing.length > 0) {
        throw new OptimisticLockError(`Issue request #${id} was updated by another concurrent transaction. Please reload.`);
      } else {
        throw new NotFoundError(`Issue request with ID ${id} not found.`);
      }
    }

    return this.findById(id, null, tx);
  },

  /**
   * Soft delete an issue request.
   */
  async softDelete(id, userId, tx = null) {
    const runner = (tx && typeof tx.query === 'function') ? tx.query.bind(tx) : query;
    const sql = `
      UPDATE IssueRequest SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE IssueRequestID = ? AND IsDeleted = 0
    `;
    await runner(sql, [userId || 1, id]);
    return true;
  },

  /**
   * Overview metrics for Issue Management Dashboard with RLS data scope.
   */
  async getOverviewMetrics(tenantId, dataScope) {
    let baseSql = `SELECT COUNT(*) as total FROM IssueRequest ir WHERE ir.IsDeleted = 0`;
    let params = [];

    if (tenantId) {
      baseSql += ` AND ir.TenantID = ?`;
      params.push(Number(tenantId));
    }

    const scoped = applyDataScopeSQL(dataScope, baseSql, params);

    const total = await query(scoped.sql, scoped.params);
    const newReqs = await query(`${scoped.sql} AND ir.StatusCode = 'NEW'`, scoped.params);
    const inProgress = await query(`${scoped.sql} AND ir.StatusCode IN ('ASSIGNED', 'IN_PROGRESS')`, scoped.params);
    const resolved = await query(`${scoped.sql} AND ir.StatusCode = 'RESOLVED'`, scoped.params);
    const closed = await query(`${scoped.sql} AND ir.StatusCode = 'CLOSED'`, scoped.params);
    const majorIncidents = await query(`${scoped.sql} AND ir.IsMajorIncident = 1`, scoped.params);

    return {
      totalIssues: total[0]?.total || 0,
      newIssues: newReqs[0]?.total || 0,
      inProgressIssues: inProgress[0]?.total || 0,
      resolvedIssues: resolved[0]?.total || 0,
      closedIssues: closed[0]?.total || 0,
      majorIncidents: majorIncidents[0]?.total || 0
    };
  }
};

export default issueRequestRepository;

import { query } from '../../../database/connection.js';

export const assignmentRepository = {
  async getOverviewMetrics(tenantId, departmentId) {
    let sql = `
      SELECT
        (SELECT COUNT(*) 
         FROM IssueRequest ir 
         LEFT JOIN Assignment a ON ir.IssueRequestID = a.RequestID AND a.IsDeleted = 0 AND a.AssignmentStatusCode != 'REJECTED' 
         WHERE ir.StatusCode = 'APPROVED' AND a.AssignmentID IS NULL AND ir.IsDeleted = 0 
           ${departmentId ? 'AND ir.AssignedDepartmentID = ' + Number(departmentId) : ''}
        ) AS unassignedCount,
        (SELECT COUNT(*) 
         FROM Assignment a 
         JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID 
         WHERE a.AssignmentStatusCode IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PAUSED') AND a.IsDeleted = 0 
           ${departmentId ? 'AND ir.AssignedDepartmentID = ' + Number(departmentId) : ''}
        ) AS activeAssignmentsCount,
        (SELECT COUNT(*) 
         FROM Assignment a 
         JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID 
         WHERE a.AssignmentStatusCode = 'IN_PROGRESS' AND a.IsDeleted = 0 
           ${departmentId ? 'AND ir.AssignedDepartmentID = ' + Number(departmentId) : ''}
        ) AS inProgressCount,
        (SELECT COUNT(*) 
         FROM IssueRequest ir 
         WHERE ir.PriorityCode = 'CRITICAL' AND ir.StatusCode NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED') AND ir.IsDeleted = 0 
           ${departmentId ? 'AND ir.AssignedDepartmentID = ' + Number(departmentId) : ''}
        ) AS emergencyCount,
        (SELECT COUNT(DISTINCT u.UserID) 
         FROM \`User\` u 
         JOIN EmployeeAssignment ea ON u.UserID = ea.UserID AND ea.IsActive = 1 AND ea.IsDeleted = 0 
         LEFT JOIN TechnicianAvailability ta ON u.UserID = ta.UserID 
         WHERE u.IsActive = 1 AND u.IsDeleted = 0 
           AND COALESCE(ta.AvailabilityStatusCode, 'AVAILABLE') = 'AVAILABLE' 
           ${departmentId ? 'AND ea.DepartmentID = ' + Number(departmentId) : ''}
        ) AS availableTechniciansCount
    `;
    const rows = await query(sql);
    return rows[0] || {
      unassignedCount: 0,
      activeAssignmentsCount: 0,
      inProgressCount: 0,
      emergencyCount: 0,
      availableTechniciansCount: 0
    };
  },

  async getUnassignedQueue({ search, priorityCode, departmentId, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT ir.*,
        s.ServiceName,
        b.BuildingName,
        d.DepartmentName AS AssignedDepartmentName,
        CONCAT(u.FirstName, ' ', u.LastName) AS RequesterName,
        u.Email AS RequesterEmail
      FROM IssueRequest ir
      JOIN Service s ON ir.ServiceID = s.ServiceID
      JOIN \`User\` u ON ir.RequesterUserID = u.UserID
      LEFT JOIN Building b ON ir.BuildingID = b.BuildingID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN Assignment a ON ir.IssueRequestID = a.RequestID AND a.IsDeleted = 0 AND a.AssignmentStatusCode != 'REJECTED'
      WHERE ir.IsDeleted = 0
        AND ir.StatusCode = 'APPROVED'
        AND a.AssignmentID IS NULL
    `;

    const params = [];
    if (departmentId) {
      sql += ` AND ir.AssignedDepartmentID = ?`;
      params.push(Number(departmentId));
    }
    if (search) {
      sql += ` AND (ir.Title LIKE ? OR ir.RequestNumber LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (priorityCode && priorityCode !== 'ALL') {
      sql += ` AND ir.PriorityCode = ?`;
      params.push(priorityCode);
    }

    sql += ` ORDER BY CASE ir.PriorityCode WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, ir.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const requests = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) AS total 
      FROM IssueRequest ir 
      LEFT JOIN Assignment a ON ir.IssueRequestID = a.RequestID AND a.IsDeleted = 0 AND a.AssignmentStatusCode != 'REJECTED'
      WHERE ir.IsDeleted = 0 AND ir.StatusCode = 'APPROVED' AND a.AssignmentID IS NULL
    `;
    const countParams = [];
    if (departmentId) {
      countSql += ` AND ir.AssignedDepartmentID = ?`;
      countParams.push(Number(departmentId));
    }
    const countRows = await query(countSql, countParams);

    return { requests, total: countRows[0]?.total || requests.length };
  },

  async getAssignments({ search, statusCode, priorityCode, serviceId, departmentId, assignedUserId, assignedTeamId, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT a.*,
        ir.RequestNumber,
        ir.Title AS RequestTitle,
        ir.Description AS RequestDescription,
        ir.PriorityCode,
        ir.StatusCode AS RequestStatusCode,
        ir.CreatedDate AS RequestCreatedDate,
        ir.TargetResolutionDateTime,
        ir.CategoryCode,
        ir.AssignedDepartmentID,
        s.ServiceName,
        sc.CategoryName,
        CONCAT(reqU.FirstName, ' ', reqU.LastName) AS RequesterName,
        reqU.Email AS RequesterEmail,
        d.DepartmentName,
        CONCAT(u.FirstName, ' ', u.LastName) AS AssignedUserName,
        u.Email AS AssignedUserEmail,
        tm.TeamName
      FROM Assignment a
      JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID
      JOIN Service s ON ir.ServiceID = s.ServiceID
      LEFT JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
      LEFT JOIN \`User\` reqU ON ir.RequesterUserID = reqU.UserID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN \`User\` u ON a.AssignedUserID = u.UserID
      LEFT JOIN Team tm ON a.AssignedTeamID = tm.TeamID
      WHERE a.IsDeleted = 0
    `;

    const params = [];
    if (departmentId) {
      sql += ` AND ir.AssignedDepartmentID = ?`;
      params.push(Number(departmentId));
    }
    if (search) {
      sql += ` AND (ir.Title LIKE ? OR ir.RequestNumber LIKE ? OR reqU.FirstName LIKE ? OR reqU.LastName LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (statusCode && statusCode !== 'ALL') {
      sql += ` AND (a.AssignmentStatusCode = ? OR ir.StatusCode = ?)`;
      params.push(statusCode, statusCode);
    }
    if (priorityCode && priorityCode !== 'ALL') {
      sql += ` AND ir.PriorityCode = ?`;
      params.push(priorityCode);
    }
    if (serviceId) {
      sql += ` AND ir.ServiceID = ?`;
      params.push(Number(serviceId));
    }
    if (assignedUserId) {
      sql += ` AND a.AssignedUserID = ?`;
      params.push(Number(assignedUserId));
    }
    if (assignedTeamId) {
      sql += ` AND a.AssignedTeamID = ?`;
      params.push(Number(assignedTeamId));
    }

    sql += ` ORDER BY a.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const assignments = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) AS total
      FROM Assignment a
      JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID
      WHERE a.IsDeleted = 0
    `;
    const countParams = [];
    if (departmentId) {
      countSql += ` AND ir.AssignedDepartmentID = ?`;
      countParams.push(Number(departmentId));
    }
    if (assignedUserId) {
      countSql += ` AND a.AssignedUserID = ?`;
      countParams.push(Number(assignedUserId));
    }
    if (statusCode && statusCode !== 'ALL') {
      countSql += ` AND (a.AssignmentStatusCode = ? OR ir.StatusCode = ?)`;
      countParams.push(statusCode, statusCode);
    }
    const countRows = await query(countSql, countParams);

    return { assignments, total: countRows[0]?.total || assignments.length };
  },

  async findById(assignmentId) {
    const sql = `
      SELECT a.*,
        ir.RequestNumber,
        ir.Title AS RequestTitle,
        ir.Description AS RequestDescription,
        ir.PriorityCode,
        ir.StatusCode AS RequestStatusCode,
        ir.AssignedDepartmentID,
        s.ServiceName,
        CONCAT(u.FirstName, ' ', u.LastName) AS AssignedUserName,
        u.Email AS AssignedUserEmail,
        tm.TeamName
      FROM Assignment a
      JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID
      JOIN Service s ON ir.ServiceID = s.ServiceID
      LEFT JOIN \`User\` u ON a.AssignedUserID = u.UserID
      LEFT JOIN Team tm ON a.AssignedTeamID = tm.TeamID
      WHERE a.AssignmentID = ? AND a.IsDeleted = 0
    `;
    const rows = await query(sql, [assignmentId]);
    return rows[0] || null;
  },

  async findByRequestId(requestId) {
    const sql = `
      SELECT a.*,
        CONCAT(u.FirstName, ' ', u.LastName) AS AssignedUserName,
        u.Email AS AssignedUserEmail,
        tm.TeamName
      FROM Assignment a
      LEFT JOIN \`User\` u ON a.AssignedUserID = u.UserID
      LEFT JOIN Team tm ON a.AssignedTeamID = tm.TeamID
      WHERE a.RequestID = ? AND a.IsDeleted = 0 AND a.AssignmentStatusCode != 'REJECTED'
      ORDER BY a.AssignmentID DESC LIMIT 1
    `;
    const rows = await query(sql, [requestId]);
    return rows[0] || null;
  },

  async createAssignment(data) {
    const sql = `
      INSERT INTO Assignment (
        RequestID, AssignedUserID, AssignedTeamID, AssignmentStatusCode, CreatedBy
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.RequestID,
      data.AssignedUserID || null,
      data.AssignedTeamID || null,
      data.AssignmentStatusCode || 'ASSIGNED',
      data.CreatedBy || 1
    ];
    const runner = (tx && typeof tx.query === 'function') ? tx.query.bind(tx) : query;
    const res = await runner(sql, params);
    return res.insertId;
  },

  async updateAssignment(id, data, tx = null) {
    const fields = [];
    const params = [];

    if (data.AssignedUserID !== undefined) { fields.push('AssignedUserID = ?'); params.push(data.AssignedUserID); }
    if (data.AssignedTeamID !== undefined) { fields.push('AssignedTeamID = ?'); params.push(data.AssignedTeamID); }
    if (data.AssignmentStatusCode) { fields.push('AssignmentStatusCode = ?'); params.push(data.AssignmentStatusCode); }
    if (data.StartDateTime) { fields.push('StartDateTime = ?'); params.push(data.StartDateTime); }
    if (data.CompleteDateTime) { fields.push('CompleteDateTime = ?'); params.push(data.CompleteDateTime); }
    if (data.PausedDurationSeconds !== undefined) { fields.push('PausedDurationSeconds = ?'); params.push(data.PausedDurationSeconds); }
    if (data.ModifiedBy) { fields.push('ModifiedBy = ?'); params.push(data.ModifiedBy); }

    if (fields.length === 0) return;

    params.push(id);
    const sql = `UPDATE Assignment SET ${fields.join(', ')} WHERE AssignmentID = ?`;
    const runner = (tx && typeof tx.query === 'function') ? tx.query.bind(tx) : query;
    await runner(sql, params);
  },

  async createHistory(data, tx = null) {
    const sql = `
      INSERT INTO AssignmentHistory (
        AssignmentID, ActionUserID, ActionTypeCode, Remarks, CreatedBy
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.AssignmentID,
      data.ActionUserID || 1,
      data.ActionTypeCode,
      data.Remarks || null,
      data.CreatedBy || data.ActionUserID || 1
    ];
    const runner = (tx && typeof tx.query === 'function') ? tx.query.bind(tx) : query;
    const res = await runner(sql, params);
    return res.insertId;
  },

  async findHistoryByAssignmentId(assignmentId) {
    const sql = `
      SELECT ah.*,
        CONCAT(u.FirstName, ' ', u.LastName) AS ActionUserName,
        u.Email AS ActionUserEmail
      FROM AssignmentHistory ah
      JOIN \`User\` u ON ah.ActionUserID = u.UserID
      WHERE ah.AssignmentID = ? AND ah.IsDeleted = 0
      ORDER BY ah.CreatedDate ASC
    `;
    return await query(sql, [assignmentId]);
  },

  // Auto-assignment routing algorithm: Lowest Workload for specified department
  async findLowestWorkloadTechnician(departmentId) {
    let sql = `
      SELECT u.UserID, CONCAT(u.FirstName, ' ', u.LastName) AS FullName,
        COUNT(a.AssignmentID) AS ActiveWorkload
      FROM \`User\` u
      JOIN EmployeeAssignment ea ON u.UserID = ea.UserID AND ea.IsActive = 1 AND ea.IsDeleted = 0
      LEFT JOIN UserRole ur ON u.UserID = ur.UserID
      LEFT JOIN Role r ON ur.RoleID = r.RoleID
      LEFT JOIN TechnicianAvailability ta ON u.UserID = ta.UserID
      LEFT JOIN Assignment a ON u.UserID = a.AssignedUserID AND a.AssignmentStatusCode IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PAUSED') AND a.IsDeleted = 0
      WHERE u.IsActive = 1 AND u.IsDeleted = 0
        AND COALESCE(ta.AvailabilityStatusCode, 'AVAILABLE') = 'AVAILABLE'
        AND (u.UserTypeCode IN ('TECHNICIAN', 'PARK_TECHNICIAN') OR r.RoleCode = 'TECHNICIAN')
    `;
    const params = [];
    if (departmentId) {
      sql += ` AND ea.DepartmentID = ?`;
      params.push(Number(departmentId));
    }
    sql += `
      GROUP BY u.UserID, u.FirstName, u.LastName
      ORDER BY ActiveWorkload ASC, u.UserID ASC
      LIMIT 1
    `;
    const rows = await query(sql, params);
    return rows[0] || null;
  }
};

export default assignmentRepository;

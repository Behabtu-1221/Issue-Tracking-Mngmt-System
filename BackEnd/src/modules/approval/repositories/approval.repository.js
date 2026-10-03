import { query } from '../../../database/connection.js';

export const approvalRepository = {
  async getMetrics(tenantId) {
    let sql = `
      SELECT
        COUNT(*) AS totalApprovals,
        SUM(CASE WHEN ApprovalStatusCode = 'PENDING' THEN 1 ELSE 0 END) AS pendingApprovals,
        SUM(CASE WHEN ApprovalStatusCode = 'APPROVED' THEN 1 ELSE 0 END) AS approvedApprovals,
        SUM(CASE WHEN ApprovalStatusCode = 'REJECTED' THEN 1 ELSE 0 END) AS rejectedApprovals,
        SUM(CASE WHEN ApprovalStatusCode = 'RETURNED' THEN 1 ELSE 0 END) AS returnedApprovals
      FROM Approval a
      LEFT JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID
      WHERE a.IsDeleted = 0
    `;
    const params = [];
    if (tenantId) {
      sql += ` AND ir.TenantID = ?`;
      params.push(Number(tenantId));
    }
    const rows = await query(sql, params);
    const r = rows[0] || {};
    return {
      totalApprovals: Number(r.totalApprovals || 0),
      pendingApprovals: Number(r.pendingApprovals || 0),
      approvedApprovals: Number(r.approvedApprovals || 0),
      rejectedApprovals: Number(r.rejectedApprovals || 0),
      returnedApprovals: Number(r.returnedApprovals || 0)
    };
  },

  async findAll({ search, statusCode, tenantId, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT a.*,
        ir.RequestNumber,
        ir.Title AS RequestTitle,
        CONCAT(u.FirstName, ' ', u.LastName) AS RequesterName,
        CONCAT(fa.FirstName, ' ', fa.LastName) AS FinalActionedByName
      FROM Approval a
      JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID
      JOIN \`User\` u ON ir.RequesterUserID = u.UserID
      LEFT JOIN \`User\` fa ON a.FinalActionedByUserID = fa.UserID
      WHERE a.IsDeleted = 0
    `;
    const params = [];

    if (tenantId) {
      sql += ` AND ir.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (statusCode) {
      sql += ` AND a.ApprovalStatusCode = ?`;
      params.push(statusCode);
    }
    if (search) {
      sql += ` AND (a.Title LIKE ? OR ir.RequestNumber LIKE ? OR ir.Title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY a.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total
      FROM Approval a
      JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID
      WHERE a.IsDeleted = 0
    `;
    const countParams = [];
    if (tenantId) { countSql += ` AND ir.TenantID = ?`; countParams.push(Number(tenantId)); }
    if (statusCode) { countSql += ` AND a.ApprovalStatusCode = ?`; countParams.push(statusCode); }
    if (search) {
      countSql += ` AND (a.Title LIKE ? OR ir.RequestNumber LIKE ? OR ir.Title LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      approvals: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT a.*,
        ir.RequestNumber,
        ir.Title AS RequestTitle,
        ir.Description AS RequestDescription,
        ir.StatusCode AS RequestStatusCode,
        ir.PriorityCode AS RequestPriorityCode,
        ir.RequestTypeCode,
        ir.IsMajorIncident,
        ir.CreatedDate AS RequestCreatedDate,
        t.CompanyName AS TenantName,
        s.ServiceName,
        s.ServiceCode,
        sc.CategoryName,
        b.BuildingName,
        os.OfficeNumber AS OfficeSpaceNumber,
        d.DepartmentName AS AssignedDepartmentName,
        CONCAT(u.FirstName, ' ', u.LastName) AS RequesterName,
        u.Email AS RequesterEmail,
        u.JobTitle AS RequesterJobTitle,
        CONCAT(fa.FirstName, ' ', fa.LastName) AS FinalActionedByName
      FROM Approval a
      JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID
      LEFT JOIN Tenant t ON ir.TenantID = t.TenantID
      LEFT JOIN Service s ON ir.ServiceID = s.ServiceID
      LEFT JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
      LEFT JOIN Building b ON ir.BuildingID = b.BuildingID
      LEFT JOIN OfficeSpace os ON ir.OfficeSpaceID = os.OfficeSpaceID
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      JOIN \`User\` u ON ir.RequesterUserID = u.UserID
      LEFT JOIN \`User\` fa ON a.FinalActionedByUserID = fa.UserID
      WHERE a.ApprovalID = ? AND a.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    if (!rows[0]) return null;

    const approval = rows[0];

    // Fetch stages with decision details
    const stagesSql = `
      SELECT st.*,
        CONCAT(u.FirstName, ' ', u.LastName) AS ApproverUserName,
        ag.GroupName AS ApproverGroupName,
        ad.ApprovalDecisionID,
        ad.DecisionUserID,
        CONCAT(du.FirstName, ' ', du.LastName) AS DecisionUserName,
        ad.DecisionCode,
        ad.Comments AS DecisionComments,
        ad.DecisionDateTime
      FROM ApprovalStage st
      LEFT JOIN \`User\` u ON st.ApproverUserID = u.UserID
      LEFT JOIN ApprovalGroup ag ON st.ApproverGroupID = ag.ApprovalGroupID
      LEFT JOIN ApprovalDecision ad ON st.ApprovalStageID = ad.ApprovalStageID AND ad.IsDeleted = 0
      LEFT JOIN \`User\` du ON ad.DecisionUserID = du.UserID
      WHERE st.ApprovalID = ? AND st.IsDeleted = 0
      ORDER BY st.StageNumber ASC, st.SequenceNumber ASC
    `;
    approval.stages = await query(stagesSql, [id]);

    // Fetch history logs
    const historySql = `
      SELECT h.*, CONCAT(u.FirstName, ' ', u.LastName) AS PerformedByName, u.Email AS PerformedByEmail
      FROM ApprovalHistory h
      JOIN \`User\` u ON h.UserID = u.UserID
      WHERE h.ApprovalID = ? AND h.IsDeleted = 0
      ORDER BY h.CreatedDate ASC
    `;
    approval.history = await query(historySql, [id]);

    // Fetch documents attached to this issue/approval
    const docsSql = `
      SELECT DocumentID, DocumentUUID, Title, Description, FileName, StoredFileName, FilePath, MimeType, FileExtension, FileSize, CreatedAt
      FROM sys_documents
      WHERE (
        (EntityRefType IN ('ISSUE', 'ISSUE_REQUEST') AND EntityRefID = ?) OR
        (EntityRefType = 'APPROVAL' AND EntityRefID = ?)
      ) AND IsArchived = 0
      ORDER BY CreatedAt DESC
    `;
    approval.documents = await query(docsSql, [approval.RequestID, approval.ApprovalID]);

    return approval;
  },

  async findByRequestId(requestId) {
    const rows = await query(
      `SELECT ApprovalID FROM Approval WHERE RequestID = ? AND IsDeleted = 0 ORDER BY ApprovalID DESC LIMIT 1`,
      [requestId]
    );
    if (!rows[0]) return null;
    return this.findById(rows[0].ApprovalID);
  },

  async getPendingForUser(userId, groupIds = []) {
    let groupCondition = '';
    const params = [userId];

    if (groupIds.length > 0) {
      groupCondition = ` OR st.ApproverGroupID IN (${groupIds.map(() => '?').join(',')})`;
      params.push(...groupIds);
    }

    // Check user role: Is user a Park Admin / Super Admin?
    const [adminRole] = await query(
      `SELECT r.RoleCode FROM UserRole ur JOIN Role r ON ur.RoleID = r.RoleID WHERE ur.UserID = ? AND r.RoleCode IN ('PARK_SUPER_ADMIN', 'PARK_ADMIN')`,
      [userId]
    );
    const isParkAdmin = Boolean(adminRole) || Number(userId) === 1;

    // Check user departments (where user is Department Manager or has DEPARTMENT_MANAGER role)
    const userDepts = await query(
      `SELECT DISTINCT d.DepartmentID 
       FROM Department d 
       LEFT JOIN EmployeeAssignment ea ON d.DepartmentID = ea.DepartmentID AND ea.UserID = ? AND ea.IsActive = 1 AND ea.IsDeleted = 0
       WHERE d.ManagerUserID = ? OR ea.UserID IS NOT NULL`,
      [userId, userId]
    );
    const managedDeptIds = userDepts.map(d => d.DepartmentID);

    let roleOrDeptCondition = '';
    if (isParkAdmin) {
      // Park Admins see Stage 2 higher-level approvals (and Stage 1 if direct/override)
      roleOrDeptCondition += ` OR st.StageNumber = 2`;
    }
    if (managedDeptIds.length > 0) {
      // Department Managers see Stage 1 approvals for their department
      roleOrDeptCondition += ` OR (st.StageNumber = 1 AND ir.AssignedDepartmentID IN (${managedDeptIds.join(',')}))`;
    }

    const sql = `
      SELECT DISTINCT a.*,
        st.ApprovalStageID,
        st.StageNumber,
        st.ApproverUserID,
        st.ApproverGroupID,
        ir.RequestNumber,
        ir.Title AS RequestTitle,
        ir.AssignedDepartmentID,
        CONCAT(u.FirstName, ' ', u.LastName) AS RequesterName
      FROM ApprovalStage st
      JOIN Approval a ON st.ApprovalID = a.ApprovalID
      JOIN IssueRequest ir ON a.RequestID = ir.IssueRequestID
      JOIN \`User\` u ON ir.RequesterUserID = u.UserID
      WHERE a.ApprovalStatusCode = 'PENDING'
        AND st.StageStatusCode = 'PENDING'
        AND st.StageNumber = a.CurrentStageNumber
        AND a.IsDeleted = 0
        AND st.IsDeleted = 0
        AND (
          st.ApproverUserID = ?
          ${groupCondition}
          ${roleOrDeptCondition}
          OR st.ApproverUserID IN (
            SELECT DelegatorUserID
            FROM ApprovalDelegation
            WHERE DelegateeUserID = ?
              AND NOW(6) BETWEEN StartDateTime AND EndDateTime
              AND IsActive = 1 AND IsDeleted = 0
          )
        )
      ORDER BY a.CreatedDate DESC
    `;
    params.push(userId);

    return query(sql, params);
  },

  async createApproval(data) {
    const sql = `
      INSERT INTO Approval (
        RequestID, ApprovalRuleID, Title, Description,
        TotalStages, CurrentStageNumber, ApprovalStatusCode, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `;
    const result = await query(sql, [
      data.RequestID,
      data.ApprovalRuleID || null,
      data.Title,
      data.Description || null,
      data.TotalStages || 1,
      1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async createStage(data) {
    const sql = `
      INSERT INTO ApprovalStage (
        ApprovalID, StageNumber, ApproverUserID, ApproverGroupID,
        StageStatusCode, SequenceNumber, CreatedBy
      ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)
    `;
    const result = await query(sql, [
      data.ApprovalID,
      data.StageNumber,
      data.ApproverUserID || null,
      data.ApproverGroupID || null,
      data.SequenceNumber || 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async updateApproval(id, data) {
    const sql = `
      UPDATE Approval SET
        CurrentStageNumber = COALESCE(?, CurrentStageNumber),
        ApprovalStatusCode = COALESCE(?, ApprovalStatusCode),
        FinalActionedByUserID = COALESCE(?, FinalActionedByUserID),
        FinalActionedDateTime = COALESCE(?, FinalActionedDateTime),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE ApprovalID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.CurrentStageNumber ?? null,
      data.ApprovalStatusCode ?? null,
      data.FinalActionedByUserID ?? null,
      data.FinalActionedDateTime ?? null,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async updateStageStatus(stageId, statusCode, userId) {
    const sql = `
      UPDATE ApprovalStage SET
        StageStatusCode = ?,
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE ApprovalStageID = ? AND IsDeleted = 0
    `;
    await query(sql, [statusCode, userId || 1, stageId]);
  },

  async recordDecision(data) {
    const sql = `
      INSERT INTO ApprovalDecision (
        ApprovalStageID, DecisionUserID, DecisionCode, Comments, CreatedBy
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.ApprovalStageID,
      data.DecisionUserID,
      data.DecisionCode,
      data.Comments || null,
      data.CreatedBy || data.DecisionUserID
    ]);
    return result.insertId;
  }
};

export default approvalRepository;

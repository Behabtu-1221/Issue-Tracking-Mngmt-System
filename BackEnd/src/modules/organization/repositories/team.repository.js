import { query } from '../../../database/connection.js';

export const teamRepository = {
  async findAll({ departmentId, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT tm.*,
        d.DepartmentName,
        d.DepartmentCode,
        u.Email AS LeaderEmail,
        CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, '')) AS LeaderFullName,
        (SELECT COUNT(*) FROM EmployeeAssignment ea WHERE ea.TeamID = tm.TeamID AND ea.IsActive = 1 AND ea.IsDeleted = 0) AS MemberCount
      FROM Team tm
      JOIN Department d ON tm.DepartmentID = d.DepartmentID
      LEFT JOIN \`User\` u ON tm.LeaderUserID = u.UserID
      WHERE tm.IsDeleted = 0 AND d.IsDeleted = 0
    `;
    const params = [];

    if (departmentId) {
      sql += ` AND tm.DepartmentID = ?`;
      params.push(Number(departmentId));
    }
    if (search) {
      sql += ` AND (tm.TeamName LIKE ? OR tm.TeamCode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY tm.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM Team tm
      JOIN Department d ON tm.DepartmentID = d.DepartmentID
      WHERE tm.IsDeleted = 0 AND d.IsDeleted = 0
    `;
    const countParams = [];
    if (departmentId) { countSql += ` AND tm.DepartmentID = ?`; countParams.push(Number(departmentId)); }
    if (search) {
      countSql += ` AND (tm.TeamName LIKE ? OR tm.TeamCode LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      teams: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT tm.*,
        d.DepartmentName,
        d.DepartmentCode,
        u.Email AS LeaderEmail,
        CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, '')) AS LeaderFullName,
        (SELECT COUNT(*) FROM EmployeeAssignment ea WHERE ea.TeamID = tm.TeamID AND ea.IsActive = 1 AND ea.IsDeleted = 0) AS MemberCount
      FROM Team tm
      JOIN Department d ON tm.DepartmentID = d.DepartmentID
      LEFT JOIN \`User\` u ON tm.LeaderUserID = u.UserID
      WHERE tm.TeamID = ? AND tm.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByDeptAndCode(departmentId, code) {
    const sql = `
      SELECT * FROM Team
      WHERE DepartmentID = ? AND TeamCode = ? AND IsDeleted = 0
    `;
    const rows = await query(sql, [departmentId, code]);
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO Team (
        DepartmentID, TeamCode, TeamName, LeaderUserID, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.DepartmentID,
      data.TeamCode,
      data.TeamName,
      data.LeaderUserID || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const sql = `
      UPDATE Team SET
        TeamName = COALESCE(?, TeamName),
        LeaderUserID = COALESCE(?, LeaderUserID),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE TeamID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.TeamName,
      data.LeaderUserID,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE Team SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE TeamID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  async findTeamMembers(teamId) {
    const sql = `
      SELECT ta.TeamAssignmentID, ta.TeamID, ta.UserID, ta.RoleInTeam, ta.CreatedDate AS JoinedDate,
        u.FirstName, u.LastName, u.Email, u.UserTypeCode,
        (SELECT COUNT(*) FROM Assignment a JOIN IssueRequest ir ON a.IssueRequestID = ir.IssueRequestID WHERE a.AssignedTechnicianID = u.UserID AND a.Status = 'ACTIVE' AND ir.StatusCode IN ('ASSIGNED', 'IN_PROGRESS')) AS ActiveRequestsCount,
        (SELECT COUNT(*) FROM Assignment a JOIN IssueRequest ir ON a.IssueRequestID = ir.IssueRequestID WHERE a.AssignedTechnicianID = u.UserID AND a.Status = 'ACTIVE' AND ir.StatusCode IN ('ASSIGNED', 'IN_PROGRESS') AND ir.PriorityCode IN ('URGENT', 'CRITICAL')) AS SLARiskCount
      FROM TeamAssignment ta
      JOIN \`User\` u ON ta.UserID = u.UserID
      WHERE ta.TeamID = ? AND ta.IsActive = 1 AND ta.IsDeleted = 0 AND u.IsDeleted = 0
      ORDER BY u.FirstName ASC
    `;
    return query(sql, [teamId]);
  },

  async addMember({ teamId, userId, roleInTeam = 'MEMBER', createdBy = 1 }) {
    const sql = `
      INSERT INTO TeamAssignment (TeamID, UserID, RoleInTeam, IsActive, CreatedBy)
      VALUES (?, ?, ?, 1, ?)
      ON DUPLICATE KEY UPDATE
        RoleInTeam = VALUES(RoleInTeam),
        IsActive = 1,
        IsDeleted = 0,
        ModifiedBy = VALUES(CreatedBy),
        ModifiedDate = CURRENT_TIMESTAMP(6)
    `;
    await query(sql, [teamId, userId, roleInTeam, createdBy]);

    // Also sync EmployeeAssignment TeamID
    await query(
      `UPDATE EmployeeAssignment SET TeamID = ?, ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE UserID = ? AND IsPrimary = 1 AND IsDeleted = 0`,
      [teamId, createdBy, userId]
    );

    return true;
  },

  async removeMember(teamId, userId, deletedBy = 1) {
    const sql = `
      UPDATE TeamAssignment SET
        IsActive = 0,
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE TeamID = ? AND UserID = ?
    `;
    await query(sql, [deletedBy, teamId, userId]);

    // Unset TeamID in EmployeeAssignment
    await query(
      `UPDATE EmployeeAssignment SET TeamID = NULL, ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE UserID = ? AND TeamID = ? AND IsDeleted = 0`,
      [deletedBy, userId, teamId]
    );

    return true;
  },

  async findEligibleTechnicians({ tenantId, departmentId }) {
    let sql = `
      SELECT DISTINCT u.UserID, u.FirstName, u.LastName, u.Email, u.UserTypeCode,
        d.DepartmentName, ea.DepartmentID, ea.TeamID, tm.TeamName
      FROM \`User\` u
      LEFT JOIN UserRole ur ON ur.UserID = u.UserID AND ur.IsActive = 1 AND ur.IsDeleted = 0
      LEFT JOIN \`Role\` r ON r.RoleID = ur.RoleID AND r.IsDeleted = 0
      LEFT JOIN EmployeeAssignment ea ON ea.UserID = u.UserID AND ea.IsPrimary = 1 AND ea.IsDeleted = 0
      LEFT JOIN Department d ON ea.DepartmentID = d.DepartmentID AND d.IsDeleted = 0
      LEFT JOIN Team tm ON ea.TeamID = tm.TeamID AND tm.IsDeleted = 0
      WHERE u.IsActive = 1 AND u.IsDeleted = 0
        AND (u.UserTypeCode IN ('TECHNICIAN', 'PARK_TECHNICIAN') OR r.RoleCode IN ('TECHNICIAN', 'PARK_TECHNICIAN'))
    `;
    const params = [];

    if (tenantId) {
      sql += ` AND u.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (departmentId) {
      sql += ` AND (ea.DepartmentID = ? OR ea.DepartmentID IS NULL)`;
      params.push(Number(departmentId));
    }

    sql += ` ORDER BY u.FirstName ASC`;
    return query(sql, params);
  },

  async getTeamWorkloadSummary({ tenantId, departmentId }) {
    let sql = `
      SELECT tm.TeamID, tm.TeamCode, tm.TeamName, tm.DepartmentID, d.DepartmentName,
        CONCAT(u.FirstName, ' ', u.LastName) AS LeaderName,
        (SELECT COUNT(*) FROM TeamAssignment ta WHERE ta.TeamID = tm.TeamID AND ta.IsActive = 1 AND ta.IsDeleted = 0) AS MemberCount,
        (SELECT COUNT(*) FROM Assignment a JOIN IssueRequest ir ON a.IssueRequestID = ir.IssueRequestID JOIN TeamAssignment ta ON ta.UserID = a.AssignedTechnicianID WHERE ta.TeamID = tm.TeamID AND a.Status = 'ACTIVE' AND ir.StatusCode IN ('ASSIGNED', 'IN_PROGRESS')) AS ActiveRequestsCount,
        (SELECT COUNT(*) FROM Assignment a JOIN IssueRequest ir ON a.IssueRequestID = ir.IssueRequestID JOIN TeamAssignment ta ON ta.UserID = a.AssignedTechnicianID WHERE ta.TeamID = tm.TeamID AND a.Status = 'ACTIVE' AND ir.StatusCode IN ('ASSIGNED', 'IN_PROGRESS') AND ir.PriorityCode IN ('URGENT', 'CRITICAL')) AS SLARiskCount
      FROM Team tm
      JOIN Department d ON tm.DepartmentID = d.DepartmentID
      LEFT JOIN \`User\` u ON tm.LeaderUserID = u.UserID
      WHERE tm.IsDeleted = 0 AND d.IsDeleted = 0
    `;
    const params = [];

    if (tenantId) {
      sql += ` AND d.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (departmentId) {
      sql += ` AND tm.DepartmentID = ?`;
      params.push(Number(departmentId));
    }

    sql += ` ORDER BY tm.TeamName ASC`;
    return query(sql, params);
  }
};

export default teamRepository;

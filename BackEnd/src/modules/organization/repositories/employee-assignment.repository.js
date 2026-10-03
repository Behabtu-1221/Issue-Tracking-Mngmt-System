import { query } from '../../../database/connection.js';

export const employeeAssignmentRepository = {
  async findAll({ userId, departmentId, teamId, positionId, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT ea.*,
        u.Email AS EmployeeEmail,
        CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, '')) AS EmployeeFullName,
        d.DepartmentName,
        d.DepartmentCode,
        tm.TeamName,
        tm.TeamCode,
        pos.PositionTitle,
        pos.PositionCode
      FROM EmployeeAssignment ea
      JOIN \`User\` u ON ea.UserID = u.UserID
      JOIN Department d ON ea.DepartmentID = d.DepartmentID
      LEFT JOIN Team tm ON ea.TeamID = tm.TeamID
      LEFT JOIN \`Position\` pos ON ea.PositionID = pos.PositionID
      WHERE ea.IsDeleted = 0 AND u.IsDeleted = 0 AND d.IsDeleted = 0
    `;
    const params = [];

    if (userId) {
      sql += ` AND ea.UserID = ?`;
      params.push(Number(userId));
    }
    if (departmentId) {
      sql += ` AND ea.DepartmentID = ?`;
      params.push(Number(departmentId));
    }
    if (teamId) {
      sql += ` AND ea.TeamID = ?`;
      params.push(Number(teamId));
    }
    if (positionId) {
      sql += ` AND ea.PositionID = ?`;
      params.push(Number(positionId));
    }

    sql += ` ORDER BY ea.JoinedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM EmployeeAssignment ea
      JOIN \`User\` u ON ea.UserID = u.UserID
      JOIN Department d ON ea.DepartmentID = d.DepartmentID
      WHERE ea.IsDeleted = 0 AND u.IsDeleted = 0 AND d.IsDeleted = 0
    `;
    const countParams = [];
    if (userId) { countSql += ` AND ea.UserID = ?`; countParams.push(Number(userId)); }
    if (departmentId) { countSql += ` AND ea.DepartmentID = ?`; countParams.push(Number(departmentId)); }
    if (teamId) { countSql += ` AND ea.TeamID = ?`; countParams.push(Number(teamId)); }
    if (positionId) { countSql += ` AND ea.PositionID = ?`; countParams.push(Number(positionId)); }
    const countRes = await query(countSql, countParams);

    return {
      assignments: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT ea.*,
        u.Email AS EmployeeEmail,
        CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, '')) AS EmployeeFullName,
        d.DepartmentName,
        d.DepartmentCode,
        tm.TeamName,
        tm.TeamCode,
        pos.PositionTitle,
        pos.PositionCode
      FROM EmployeeAssignment ea
      JOIN \`User\` u ON ea.UserID = u.UserID
      JOIN Department d ON ea.DepartmentID = d.DepartmentID
      LEFT JOIN Team tm ON ea.TeamID = tm.TeamID
      LEFT JOIN \`Position\` pos ON ea.PositionID = pos.PositionID
      WHERE ea.EmployeeAssignmentID = ? AND ea.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Clear primary assignment flag for user if setting a new primary.
   */
  async clearPrimaryFlag(userId) {
    const sql = `
      UPDATE EmployeeAssignment SET IsPrimary = 0, ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE UserID = ? AND IsPrimary = 1 AND IsDeleted = 0
    `;
    await query(sql, [userId]);
  },

  async create(data) {
    const sql = `
      INSERT INTO EmployeeAssignment (
        UserID, DepartmentID, TeamID, PositionID, IsPrimary, JoinedDate, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.UserID,
      data.DepartmentID,
      data.TeamID || null,
      data.PositionID || null,
      data.IsPrimary !== undefined ? data.IsPrimary : 1,
      data.JoinedDate || new Date().toISOString().split('T')[0],
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const sql = `
      UPDATE EmployeeAssignment SET
        DepartmentID = COALESCE(?, DepartmentID),
        TeamID = COALESCE(?, TeamID),
        PositionID = COALESCE(?, PositionID),
        IsPrimary = COALESCE(?, IsPrimary),
        JoinedDate = COALESCE(?, JoinedDate),
        LeftDate = COALESCE(?, LeftDate),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE EmployeeAssignmentID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.DepartmentID,
      data.TeamID,
      data.PositionID,
      data.IsPrimary,
      data.JoinedDate,
      data.LeftDate,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE EmployeeAssignment SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE EmployeeAssignmentID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default employeeAssignmentRepository;

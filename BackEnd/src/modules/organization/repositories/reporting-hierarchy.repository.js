import { query } from '../../../database/connection.js';

export const reportingHierarchyRepository = {
  async findAll({ employeeUserId, supervisorUserId, reportingTypeCode, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT rh.*,
        emp.Username AS EmployeeUsername,
        CONCAT(COALESCE(emp.FirstName, ''), ' ', COALESCE(emp.LastName, '')) AS EmployeeFullName,
        sup.Username AS SupervisorUsername,
        CONCAT(COALESCE(sup.FirstName, ''), ' ', COALESCE(sup.LastName, '')) AS SupervisorFullName
      FROM ReportingHierarchy rh
      JOIN \`User\` emp ON rh.EmployeeUserID = emp.UserID
      JOIN \`User\` sup ON rh.SupervisorUserID = sup.UserID
      WHERE rh.IsDeleted = 0 AND emp.IsDeleted = 0 AND sup.IsDeleted = 0
    `;
    const params = [];

    if (employeeUserId) {
      sql += ` AND rh.EmployeeUserID = ?`;
      params.push(Number(employeeUserId));
    }
    if (supervisorUserId) {
      sql += ` AND rh.SupervisorUserID = ?`;
      params.push(Number(supervisorUserId));
    }
    if (reportingTypeCode) {
      sql += ` AND rh.ReportingTypeCode = ?`;
      params.push(reportingTypeCode);
    }

    sql += ` ORDER BY rh.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM ReportingHierarchy rh
      JOIN \`User\` emp ON rh.EmployeeUserID = emp.UserID
      JOIN \`User\` sup ON rh.SupervisorUserID = sup.UserID
      WHERE rh.IsDeleted = 0 AND emp.IsDeleted = 0 AND sup.IsDeleted = 0
    `;
    const countParams = [];
    if (employeeUserId) { countSql += ` AND rh.EmployeeUserID = ?`; countParams.push(Number(employeeUserId)); }
    if (supervisorUserId) { countSql += ` AND rh.SupervisorUserID = ?`; countParams.push(Number(supervisorUserId)); }
    if (reportingTypeCode) { countSql += ` AND rh.ReportingTypeCode = ?`; countParams.push(reportingTypeCode); }
    const countRes = await query(countSql, countParams);

    return {
      hierarchies: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT rh.*,
        emp.Username AS EmployeeUsername,
        CONCAT(COALESCE(emp.FirstName, ''), ' ', COALESCE(emp.LastName, '')) AS EmployeeFullName,
        sup.Username AS SupervisorUsername,
        CONCAT(COALESCE(sup.FirstName, ''), ' ', COALESCE(sup.LastName, '')) AS SupervisorFullName
      FROM ReportingHierarchy rh
      JOIN \`User\` emp ON rh.EmployeeUserID = emp.UserID
      JOIN \`User\` sup ON rh.SupervisorUserID = sup.UserID
      WHERE rh.ReportingHierarchyID = ? AND rh.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findPair(employeeUserId, supervisorUserId) {
    const sql = `
      SELECT * FROM ReportingHierarchy
      WHERE EmployeeUserID = ? AND SupervisorUserID = ? AND IsDeleted = 0
    `;
    const rows = await query(sql, [employeeUserId, supervisorUserId]);
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO ReportingHierarchy (
        EmployeeUserID, SupervisorUserID, ReportingTypeCode, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.EmployeeUserID,
      data.SupervisorUserID,
      data.ReportingTypeCode || 'DIRECT',
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const sql = `
      UPDATE ReportingHierarchy SET
        ReportingTypeCode = COALESCE(?, ReportingTypeCode),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE ReportingHierarchyID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.ReportingTypeCode,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE ReportingHierarchy SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ReportingHierarchyID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default reportingHierarchyRepository;

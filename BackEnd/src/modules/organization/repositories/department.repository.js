import { query } from '../../../database/connection.js';

export const departmentRepository = {
  async findAll({ search, page = 1, limit = 100 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT d.*,
        (SELECT bp.BusinessParkName FROM BusinessPark bp WHERE bp.IsDeleted = 0 LIMIT 1) AS BusinessParkName,
        (SELECT bp.BusinessParkCode FROM BusinessPark bp WHERE bp.IsDeleted = 0 LIMIT 1) AS BusinessParkCode,
        u.Email AS ManagerEmail,
        CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, '')) AS ManagerFullName,
        (SELECT COUNT(*) FROM Team t WHERE t.DepartmentID = d.DepartmentID AND t.IsDeleted = 0) AS TeamCount,
        (SELECT COUNT(*) FROM EmployeeAssignment ea WHERE ea.DepartmentID = d.DepartmentID AND ea.IsActive = 1 AND ea.IsDeleted = 0) AS ActiveEmployeeCount,
        (SELECT COUNT(*) FROM DepartmentLocation dl WHERE dl.DepartmentID = d.DepartmentID AND dl.IsDeleted = 0) AS LocationCount
      FROM Department d
      LEFT JOIN \`User\` u ON d.ManagerUserID = u.UserID
      WHERE d.IsDeleted = 0
    `;
    const params = [];

    if (search) {
      sql += ` AND (d.DepartmentName LIKE ? OR d.DepartmentCode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY d.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM Department d
      WHERE d.IsDeleted = 0
    `;
    const countParams = [];
    if (search) {
      countSql += ` AND (d.DepartmentName LIKE ? OR d.DepartmentCode LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      departments: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT d.*,
        (SELECT bp.BusinessParkName FROM BusinessPark bp WHERE bp.IsDeleted = 0 LIMIT 1) AS BusinessParkName,
        (SELECT bp.BusinessParkCode FROM BusinessPark bp WHERE bp.IsDeleted = 0 LIMIT 1) AS BusinessParkCode,
        u.Email AS ManagerEmail,
        CONCAT(COALESCE(u.FirstName, ''), ' ', COALESCE(u.LastName, '')) AS ManagerFullName,
        (SELECT COUNT(*) FROM Team t WHERE t.DepartmentID = d.DepartmentID AND t.IsDeleted = 0) AS TeamCount,
        (SELECT COUNT(*) FROM EmployeeAssignment ea WHERE ea.DepartmentID = d.DepartmentID AND ea.IsActive = 1 AND ea.IsDeleted = 0) AS ActiveEmployeeCount
      FROM Department d
      LEFT JOIN \`User\` u ON d.ManagerUserID = u.UserID
      WHERE d.DepartmentID = ? AND d.IsDeleted = 0
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByCode(code) {
    const sql = `
      SELECT * FROM Department
      WHERE DepartmentCode = ? AND IsDeleted = 0
    `;
    const rows = await query(sql, [code]);
    return rows[0] || null;
  },

  async findByOrgUnitAndCode(orgUnitId, code) {
    return this.findByCode(code);
  },

  async create(data) {
    const orgUnitId = data.OrganizationUnitID || 1;
    const sql = `
      INSERT INTO Department (
        OrganizationUnitID, DepartmentCode, DepartmentName, ManagerUserID, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      orgUnitId,
      data.DepartmentCode,
      data.DepartmentName,
      data.ManagerUserID || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const sql = `
      UPDATE Department SET
        DepartmentName = COALESCE(?, DepartmentName),
        ManagerUserID = COALESCE(?, ManagerUserID),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE DepartmentID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.DepartmentName,
      data.ManagerUserID,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE Department SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE DepartmentID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  // ─── DEPARTMENT LOCATIONS (Department <-> OfficeSpace Mapping) ─────────────

  async getLocations(departmentId) {
    const sql = `
      SELECT dl.*,
        os.OfficeNumber,
        os.OfficeName,
        os.SquareMeters,
        f.FloorName,
        b.BuildingName
      FROM DepartmentLocation dl
      JOIN OfficeSpace os ON dl.OfficeSpaceID = os.OfficeSpaceID
      JOIN Floor f ON os.FloorID = f.FloorID
      JOIN Building b ON f.BuildingID = b.BuildingID
      WHERE dl.DepartmentID = ? AND dl.IsDeleted = 0
    `;
    return query(sql, [departmentId]);
  },

  async addLocation(departmentId, officeSpaceId, userId) {
    const sql = `
      INSERT INTO DepartmentLocation (DepartmentID, OfficeSpaceID, CreatedBy)
      VALUES (?, ?, ?)
    `;
    const res = await query(sql, [departmentId, officeSpaceId, userId || 1]);
    return res.insertId;
  },

  async removeLocation(departmentLocationId, userId) {
    const sql = `
      UPDATE DepartmentLocation SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE DepartmentLocationID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, departmentLocationId]);
    return true;
  }
};

export default departmentRepository;

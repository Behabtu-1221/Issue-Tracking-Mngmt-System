import { query } from '../../../database/connection.js';

export const positionRepository = {
  async findAll({ search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT pos.*,
        (SELECT COUNT(*) FROM EmployeeAssignment ea WHERE ea.PositionID = pos.PositionID AND ea.IsActive = 1 AND ea.IsDeleted = 0) AS AssignedCount
      FROM \`Position\` pos
      WHERE pos.IsDeleted = 0
    `;
    const params = [];

    if (search) {
      sql += ` AND (pos.PositionTitle LIKE ? OR pos.PositionCode LIKE ? OR pos.Description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY pos.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM \`Position\` pos
      WHERE pos.IsDeleted = 0
    `;
    const countParams = [];
    if (search) {
      countSql += ` AND (pos.PositionTitle LIKE ? OR pos.PositionCode LIKE ? OR pos.Description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      positions: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT pos.*,
        (SELECT COUNT(*) FROM EmployeeAssignment ea WHERE ea.PositionID = pos.PositionID AND ea.IsActive = 1 AND ea.IsDeleted = 0) AS AssignedCount
      FROM \`Position\` pos
      WHERE pos.PositionID = ? AND pos.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByCode(code) {
    const sql = `
      SELECT * FROM \`Position\`
      WHERE PositionCode = ? AND IsDeleted = 0
    `;
    const rows = await query(sql, [code]);
    return rows[0] || null;
  },

  async findByOrgUnitAndCode(orgUnitId, code) {
    return this.findByCode(code);
  },

  async create(data) {
    const sql = `
      INSERT INTO \`Position\` (
        PositionCode, PositionTitle, Description, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.PositionCode,
      data.PositionTitle,
      data.Description || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const sql = `
      UPDATE \`Position\` SET
        PositionTitle = COALESCE(?, PositionTitle),
        Description = COALESCE(?, Description),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE PositionID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.PositionTitle,
      data.Description,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE \`Position\` SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE PositionID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default positionRepository;

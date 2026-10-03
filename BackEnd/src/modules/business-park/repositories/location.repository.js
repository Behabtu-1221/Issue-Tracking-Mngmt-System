import { query } from '../../../database/connection.js';

export const locationRepository = {
  async findAll({ parkId, locationType, parentLocationId, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT l.*,
        pl.LocationName AS ParentLocationName, pl.LocationCode AS ParentLocationCode,
        p.BusinessParkName, p.BusinessParkCode
      FROM Location l
      JOIN BusinessPark p ON l.BusinessParkID = p.BusinessParkID
      LEFT JOIN Location pl ON l.ParentLocationID = pl.LocationID
      WHERE l.IsDeleted = 0
    `;
    const params = [];

    if (parkId) {
      sql += ` AND l.BusinessParkID = ?`;
      params.push(parkId);
    }
    if (locationType) {
      sql += ` AND l.LocationType = ?`;
      params.push(locationType);
    }
    if (parentLocationId) {
      sql += ` AND l.ParentLocationID = ?`;
      params.push(parentLocationId);
    }
    if (search) {
      sql += ` AND (l.LocationName LIKE ? OR l.LocationCode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY l.LocationCode ASC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM Location l WHERE l.IsDeleted = 0`;
    const countParams = [];
    if (parkId) {
      countSql += ` AND l.BusinessParkID = ?`;
      countParams.push(parkId);
    }
    if (locationType) {
      countSql += ` AND l.LocationType = ?`;
      countParams.push(locationType);
    }
    if (parentLocationId) {
      countSql += ` AND l.ParentLocationID = ?`;
      countParams.push(parentLocationId);
    }
    if (search) {
      countSql += ` AND (l.LocationName LIKE ? OR l.LocationCode LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      locations: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT l.*,
        pl.LocationName AS ParentLocationName, pl.LocationCode AS ParentLocationCode,
        p.BusinessParkName, p.BusinessParkCode
      FROM Location l
      JOIN BusinessPark p ON l.BusinessParkID = p.BusinessParkID
      LEFT JOIN Location pl ON l.ParentLocationID = pl.LocationID
      WHERE l.LocationID = ? AND l.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByParkAndCode(parkId, locationCode) {
    const sql = `SELECT * FROM Location WHERE BusinessParkID = ? AND LocationCode = ? AND IsDeleted = 0`;
    const rows = await query(sql, [parkId, locationCode]);
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO Location (
        BusinessParkID, ParentLocationID, LocationCode, LocationName,
        LocationType, Description, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.BusinessParkID,
      data.ParentLocationID || null,
      data.LocationCode,
      data.LocationName,
      data.LocationType || 'BLOCK',
      data.Description || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const sql = `
      UPDATE Location SET
        ParentLocationID = COALESCE(?, ParentLocationID),
        LocationCode = COALESCE(?, LocationCode),
        LocationName = COALESCE(?, LocationName),
        LocationType = COALESCE(?, LocationType),
        Description = COALESCE(?, Description),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE LocationID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.ParentLocationID,
      data.LocationCode,
      data.LocationName,
      data.LocationType,
      data.Description,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE Location SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE LocationID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default locationRepository;

import { query } from '../../../database/connection.js';

export const floorRepository = {
  async findAll({ buildingId, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT f.*,
        b.BuildingName, b.BuildingCode, b.TotalFloors AS BuildingTotalFloors, b.BusinessParkID, b.FacilityZoneID,
        (SELECT COUNT(*) FROM OfficeSpace o WHERE o.FloorID = f.FloorID AND o.IsDeleted = 0) AS OfficeSpaceCount,
        (SELECT COUNT(*) FROM FloorPlan fp WHERE fp.FloorID = f.FloorID AND fp.IsDeleted = 0) AS HasFloorPlan
      FROM Floor f
      JOIN Building b ON f.BuildingID = b.BuildingID
      WHERE f.IsDeleted = 0
    `;
    const params = [];

    if (buildingId) {
      sql += ` AND f.BuildingID = ?`;
      params.push(buildingId);
    }
    if (search) {
      sql += ` AND (f.FloorName LIKE ? OR f.FloorCode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY f.FloorNumber ASC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM Floor f WHERE f.IsDeleted = 0`;
    const countParams = [];
    if (buildingId) {
      countSql += ` AND f.BuildingID = ?`;
      countParams.push(buildingId);
    }
    if (search) {
      countSql += ` AND (f.FloorName LIKE ? OR f.FloorCode LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      floors: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT f.*,
        b.BuildingName, b.BuildingCode, b.TotalFloors AS BuildingTotalFloors, b.BusinessParkID, b.FacilityZoneID,
        (SELECT COUNT(*) FROM OfficeSpace o WHERE o.FloorID = f.FloorID AND o.IsDeleted = 0) AS OfficeSpaceCount
      FROM Floor f
      JOIN Building b ON f.BuildingID = b.BuildingID
      WHERE f.FloorID = ? AND f.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByBuildingAndNumber(buildingId, floorNumber) {
    const sql = `SELECT * FROM Floor WHERE BuildingID = ? AND FloorNumber = ? AND IsDeleted = 0`;
    const rows = await query(sql, [buildingId, floorNumber]);
    return rows[0] || null;
  },

  async findByBuildingAndCode(buildingId, floorCode) {
    const sql = `SELECT * FROM Floor WHERE BuildingID = ? AND FloorCode = ? AND IsDeleted = 0`;
    const rows = await query(sql, [buildingId, floorCode]);
    return rows[0] || null;
  },

  async countActiveOffices(floorId) {
    const sql = `SELECT COUNT(*) as count FROM OfficeSpace WHERE FloorID = ? AND IsDeleted = 0`;
    const rows = await query(sql, [floorId]);
    return Number(rows[0]?.count || 0);
  },

  async create(data) {
    const sql = `
      INSERT INTO Floor (
        BuildingID, FloorNumber, FloorCode, FloorName, Description,
        TotalOfficeSpaces, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.BuildingID,
      data.FloorNumber,
      data.FloorCode,
      data.FloorName,
      data.Description || null,
      data.TotalOfficeSpaces || 0,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);

    return result.insertId;
  },

  async update(id, data) {
    const sql = `
      UPDATE Floor SET
        FloorNumber = COALESCE(?, FloorNumber),
        FloorCode = COALESCE(?, FloorCode),
        FloorName = COALESCE(?, FloorName),
        Description = COALESCE(?, Description),
        TotalOfficeSpaces = COALESCE(?, TotalOfficeSpaces),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE FloorID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.FloorNumber,
      data.FloorCode,
      data.FloorName,
      data.Description,
      data.TotalOfficeSpaces,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE Floor SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE FloorID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default floorRepository;

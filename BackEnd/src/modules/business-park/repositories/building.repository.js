import { query } from '../../../database/connection.js';

export const buildingRepository = {
  async findAll({ parkId, zoneId, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT b.*,
        p.BusinessParkName, p.BusinessParkCode,
        fz.FacilityZoneName, fz.FacilityZoneCode, fz.ZoneType,
        (SELECT COUNT(*) FROM Floor f WHERE f.BuildingID = b.BuildingID AND f.IsDeleted = 0) AS FloorCount,
        (SELECT COUNT(*) FROM OfficeSpace o JOIN Floor f ON o.FloorID = f.FloorID WHERE f.BuildingID = b.BuildingID AND o.IsDeleted = 0) AS OfficeCount
      FROM Building b
      JOIN BusinessPark p ON b.BusinessParkID = p.BusinessParkID
      LEFT JOIN FacilityZone fz ON b.FacilityZoneID = fz.FacilityZoneID
      WHERE b.IsDeleted = 0
    `;
    const params = [];

    if (parkId) {
      sql += ` AND b.BusinessParkID = ?`;
      params.push(parkId);
    }
    if (zoneId) {
      sql += ` AND b.FacilityZoneID = ?`;
      params.push(zoneId);
    }
    if (search) {
      sql += ` AND (b.BuildingName LIKE ? OR b.BuildingCode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY b.BuildingCode ASC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM Building b WHERE b.IsDeleted = 0`;
    const countParams = [];
    if (parkId) {
      countSql += ` AND b.BusinessParkID = ?`;
      countParams.push(parkId);
    }
    if (zoneId) {
      countSql += ` AND b.FacilityZoneID = ?`;
      countParams.push(zoneId);
    }
    if (search) {
      countSql += ` AND (b.BuildingName LIKE ? OR b.BuildingCode LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      buildings: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT b.*,
        p.BusinessParkName, p.BusinessParkCode,
        fz.FacilityZoneName, fz.FacilityZoneCode, fz.ZoneType,
        (SELECT COUNT(*) FROM Floor f WHERE f.BuildingID = b.BuildingID AND f.IsDeleted = 0) AS FloorCount,
        (SELECT COUNT(*) FROM OfficeSpace o JOIN Floor f ON o.FloorID = f.FloorID WHERE f.BuildingID = b.BuildingID AND o.IsDeleted = 0) AS OfficeCount
      FROM Building b
      JOIN BusinessPark p ON b.BusinessParkID = p.BusinessParkID
      LEFT JOIN FacilityZone fz ON b.FacilityZoneID = fz.FacilityZoneID
      WHERE b.BuildingID = ? AND b.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByParkAndCode(parkId, buildingCode) {
    const sql = `SELECT * FROM Building WHERE BusinessParkID = ? AND BuildingCode = ? AND IsDeleted = 0`;
    const rows = await query(sql, [parkId, buildingCode]);
    return rows[0] || null;
  },

  async countByZone(zoneId) {
    const sql = `SELECT COUNT(*) as count FROM Building WHERE FacilityZoneID = ? AND IsDeleted = 0`;
    const rows = await query(sql, [zoneId]);
    return Number(rows[0]?.count || 0);
  },

  async countActiveFloors(buildingId) {
    const sql = `SELECT COUNT(*) as count FROM Floor WHERE BuildingID = ? AND IsDeleted = 0`;
    const rows = await query(sql, [buildingId]);
    return Number(rows[0]?.count || 0);
  },

  async create(data) {
    const sql = `
      INSERT INTO Building (
        BusinessParkID, FacilityZoneID, BuildingCode, BuildingName, ShortName, Description,
        TotalFloors, TotalAreaSquareMeter, Latitude, Longitude, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.BusinessParkID,
      data.FacilityZoneID,
      data.BuildingCode,
      data.BuildingName,
      data.ShortName || null,
      data.Description || null,
      data.TotalFloors || 1,
      data.TotalAreaSquareMeter || 0,
      data.Latitude || null,
      data.Longitude || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const sql = `
      UPDATE Building SET
        FacilityZoneID = COALESCE(?, FacilityZoneID),
        BuildingName = COALESCE(?, BuildingName),
        ShortName = COALESCE(?, ShortName),
        Description = COALESCE(?, Description),
        TotalFloors = COALESCE(?, TotalFloors),
        TotalAreaSquareMeter = COALESCE(?, TotalAreaSquareMeter),
        Latitude = COALESCE(?, Latitude),
        Longitude = COALESCE(?, Longitude),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE BuildingID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.FacilityZoneID,
      data.BuildingName,
      data.ShortName,
      data.Description,
      data.TotalFloors,
      data.TotalAreaSquareMeter,
      data.Latitude,
      data.Longitude,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE Building SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE BuildingID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default buildingRepository;

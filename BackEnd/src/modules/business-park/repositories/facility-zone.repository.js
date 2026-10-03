import { query } from '../../../database/connection.js';

export const facilityZoneRepository = {
  async findAll({ parkId, zoneType, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT fz.*,
        p.BusinessParkName, p.BusinessParkCode,
        (SELECT COUNT(*) FROM Building b WHERE b.FacilityZoneID = fz.FacilityZoneID AND b.IsDeleted = 0) AS BuildingCount
      FROM FacilityZone fz
      JOIN BusinessPark p ON fz.BusinessParkID = p.BusinessParkID
      WHERE fz.IsDeleted = 0
    `;
    const params = [];

    if (parkId) {
      sql += ` AND fz.BusinessParkID = ?`;
      params.push(parkId);
    }
    if (zoneType) {
      sql += ` AND fz.ZoneType = ?`;
      params.push(zoneType);
    }
    if (search) {
      sql += ` AND (fz.FacilityZoneName LIKE ? OR fz.FacilityZoneCode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY fz.FacilityZoneCode ASC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM FacilityZone fz WHERE fz.IsDeleted = 0`;
    const countParams = [];
    if (parkId) {
      countSql += ` AND fz.BusinessParkID = ?`;
      countParams.push(parkId);
    }
    if (zoneType) {
      countSql += ` AND fz.ZoneType = ?`;
      countParams.push(zoneType);
    }
    if (search) {
      countSql += ` AND (fz.FacilityZoneName LIKE ? OR fz.FacilityZoneCode LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      facilityZones: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT fz.*,
        p.BusinessParkName, p.BusinessParkCode,
        (SELECT COUNT(*) FROM Building b WHERE b.FacilityZoneID = fz.FacilityZoneID AND b.IsDeleted = 0) AS BuildingCount
      FROM FacilityZone fz
      JOIN BusinessPark p ON fz.BusinessParkID = p.BusinessParkID
      WHERE fz.FacilityZoneID = ? AND fz.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByParkAndCode(parkId, zoneCode) {
    const sql = `SELECT * FROM FacilityZone WHERE BusinessParkID = ? AND FacilityZoneCode = ? AND IsDeleted = 0`;
    const rows = await query(sql, [parkId, zoneCode]);
    return rows[0] || null;
  },

  async countActiveBuildings(zoneId) {
    const sql = `SELECT COUNT(*) as count FROM Building WHERE FacilityZoneID = ? AND IsDeleted = 0`;
    const rows = await query(sql, [zoneId]);
    return Number(rows[0]?.count || 0);
  },

  async create(data) {
    const capacity = (data.CapacityLimit !== undefined && data.CapacityLimit !== null && data.CapacityLimit !== '') ? Number(data.CapacityLimit) : null;
    const sql = `
      INSERT INTO FacilityZone (
        BusinessParkID, FacilityZoneCode, FacilityZoneName,
        ZoneType, Description, CapacityLimit, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.BusinessParkID,
      data.FacilityZoneCode,
      data.FacilityZoneName,
      data.ZoneType || 'OPERATIONAL',
      data.Description || null,
      capacity,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async update(id, data) {
    const capacity = (data.CapacityLimit !== undefined) 
      ? ((data.CapacityLimit !== null && data.CapacityLimit !== '') ? Number(data.CapacityLimit) : null)
      : undefined;
    const sql = `
      UPDATE FacilityZone SET
        FacilityZoneCode = COALESCE(?, FacilityZoneCode),
        FacilityZoneName = COALESCE(?, FacilityZoneName),
        ZoneType = COALESCE(?, ZoneType),
        Description = COALESCE(?, Description),
        CapacityLimit = ?,
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE FacilityZoneID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.FacilityZoneCode,
      data.FacilityZoneName,
      data.ZoneType,
      data.Description,
      capacity !== undefined ? capacity : null,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE FacilityZone SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE FacilityZoneID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default facilityZoneRepository;

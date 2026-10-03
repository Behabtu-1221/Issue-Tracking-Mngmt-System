import { query } from '../../../database/connection.js';

export const officeRepository = {
  async findAll({ floorId, buildingId, parkId, availabilityStatus, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT o.*,
        ot.OfficeTypeName, ot.OfficeTypeCode,
        f.FloorName, f.FloorNumber, f.FloorCode, f.TotalOfficeSpaces AS FloorTotalOfficeSpaces,
        b.BuildingID, b.BuildingName, b.BuildingCode, b.FacilityZoneID,
        p.BusinessParkID, p.BusinessParkName, p.BusinessParkCode
      FROM OfficeSpace o
      LEFT JOIN OfficeType ot ON o.OfficeTypeID = ot.OfficeTypeID
      JOIN Floor f ON o.FloorID = f.FloorID
      JOIN Building b ON f.BuildingID = b.BuildingID
      JOIN BusinessPark p ON b.BusinessParkID = p.BusinessParkID
      WHERE o.IsDeleted = 0
    `;
    const params = [];

    if (floorId) {
      sql += ` AND o.FloorID = ?`;
      params.push(floorId);
    }
    if (buildingId) {
      sql += ` AND f.BuildingID = ?`;
      params.push(buildingId);
    }
    if (parkId) {
      sql += ` AND b.BusinessParkID = ?`;
      params.push(parkId);
    }
    if (availabilityStatus) {
      sql += ` AND o.AvailabilityStatus = ?`;
      params.push(availabilityStatus);
    }
    if (search) {
      sql += ` AND (o.OfficeName LIKE ? OR o.OfficeNumber LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY o.OfficeNumber ASC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total 
      FROM OfficeSpace o
      JOIN Floor f ON o.FloorID = f.FloorID
      JOIN Building b ON f.BuildingID = b.BuildingID
      WHERE o.IsDeleted = 0
    `;
    const countParams = [];
    if (floorId) {
      countSql += ` AND o.FloorID = ?`;
      countParams.push(floorId);
    }
    if (buildingId) {
      countSql += ` AND f.BuildingID = ?`;
      countParams.push(buildingId);
    }
    if (parkId) {
      countSql += ` AND b.BusinessParkID = ?`;
      countParams.push(parkId);
    }
    if (availabilityStatus) {
      countSql += ` AND o.AvailabilityStatus = ?`;
      countParams.push(availabilityStatus);
    }
    if (search) {
      countSql += ` AND (o.OfficeName LIKE ? OR o.OfficeNumber LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      offices: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT o.*,
        ot.OfficeTypeName, ot.OfficeTypeCode,
        f.FloorName, f.FloorNumber, f.FloorCode, f.TotalOfficeSpaces AS FloorTotalOfficeSpaces,
        b.BuildingID, b.BuildingName, b.BuildingCode, b.FacilityZoneID,
        p.BusinessParkID, p.BusinessParkName, p.BusinessParkCode
      FROM OfficeSpace o
      LEFT JOIN OfficeType ot ON o.OfficeTypeID = ot.OfficeTypeID
      JOIN Floor f ON o.FloorID = f.FloorID
      JOIN Building b ON f.BuildingID = b.BuildingID
      JOIN BusinessPark p ON b.BusinessParkID = p.BusinessParkID
      WHERE o.OfficeSpaceID = ? AND o.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByFloorAndNumber(floorId, officeNumber) {
    const sql = `SELECT * FROM OfficeSpace WHERE FloorID = ? AND OfficeNumber = ? AND IsDeleted = 0`;
    const rows = await query(sql, [floorId, officeNumber]);
    return rows[0] || null;
  },

  async countActiveByFloor(floorId) {
    const sql = `SELECT COUNT(*) as count FROM OfficeSpace WHERE FloorID = ? AND IsDeleted = 0`;
    const rows = await query(sql, [floorId]);
    return Number(rows[0]?.count || 0);
  },

  async create(data) {
    const sql = `
      INSERT INTO OfficeSpace (
        FloorID, OfficeTypeID, OfficeNumber, OfficeName, Description,
        SquareMeters, MaxOccupancy, MonthlyRentAmount, AvailabilityStatus,
        IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.FloorID,
      data.OfficeTypeID || 1,
      data.OfficeNumber,
      data.OfficeName,
      data.Description || null,
      data.SquareMeters || 0,
      data.MaxOccupancy || null,
      data.MonthlyRentAmount || null,
      data.AvailabilityStatus || 'VACANT',
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);

    return result.insertId;
  },

  async update(id, data) {
    const sql = `
      UPDATE OfficeSpace SET
        OfficeTypeID = COALESCE(?, OfficeTypeID),
        OfficeNumber = COALESCE(?, OfficeNumber),
        OfficeName = COALESCE(?, OfficeName),
        Description = COALESCE(?, Description),
        SquareMeters = COALESCE(?, SquareMeters),
        MaxOccupancy = COALESCE(?, MaxOccupancy),
        MonthlyRentAmount = COALESCE(?, MonthlyRentAmount),
        AvailabilityStatus = COALESCE(?, AvailabilityStatus),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE OfficeSpaceID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.OfficeTypeID,
      data.OfficeNumber,
      data.OfficeName,
      data.Description,
      data.SquareMeters,
      data.MaxOccupancy,
      data.MonthlyRentAmount,
      data.AvailabilityStatus,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async updateStatus(id, status, userId) {
    const sql = `
      UPDATE OfficeSpace SET
        AvailabilityStatus = ?,
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE OfficeSpaceID = ? AND IsDeleted = 0
    `;
    await query(sql, [status, userId || 1, id]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE OfficeSpace SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE OfficeSpaceID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default officeRepository;

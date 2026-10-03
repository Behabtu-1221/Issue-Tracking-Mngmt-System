import { query } from '../../../database/connection.js';

export const parkRepository = {
  // --- BUSINESS PARK ---
  async findAll({ search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT p.*,
        (SELECT COUNT(*) FROM Building b WHERE b.BusinessParkID = p.BusinessParkID AND b.IsDeleted = 0) AS BuildingCount,
        (SELECT COUNT(*) FROM Location l WHERE l.BusinessParkID = p.BusinessParkID AND l.IsDeleted = 0) AS LocationCount,
        (SELECT COUNT(*) FROM FacilityZone fz WHERE fz.BusinessParkID = p.BusinessParkID AND fz.IsDeleted = 0) AS FacilityZoneCount
      FROM BusinessPark p
      WHERE p.IsDeleted = 0
    `;
    const params = [];

    if (search) {
      sql += ` AND (p.BusinessParkName LIKE ? OR p.BusinessParkCode LIKE ? OR p.City LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY p.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM BusinessPark p WHERE p.IsDeleted = 0`;
    const countParams = [];
    if (search) {
      countSql += ` AND (p.BusinessParkName LIKE ? OR p.BusinessParkCode LIKE ? OR p.City LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      parks: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT p.*,
        (SELECT COUNT(*) FROM Building b WHERE b.BusinessParkID = p.BusinessParkID AND b.IsDeleted = 0) AS BuildingCount,
        (SELECT COUNT(*) FROM Location l WHERE l.BusinessParkID = p.BusinessParkID AND l.IsDeleted = 0) AS LocationCount,
        (SELECT COUNT(*) FROM FacilityZone fz WHERE fz.BusinessParkID = p.BusinessParkID AND fz.IsDeleted = 0) AS FacilityZoneCount
      FROM BusinessPark p
      WHERE p.BusinessParkID = ? AND p.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findByCode(code) {
    const sql = `SELECT * FROM BusinessPark WHERE BusinessParkCode = ? AND IsDeleted = 0`;
    const rows = await query(sql, [code]);
    return rows[0] || null;
  },

  async create(parkData) {
    const sql = `
      INSERT INTO BusinessPark (
        BusinessParkCode, BusinessParkName, ShortName, Description,
        RegistrationNumber, TaxIdentificationNo, Email, PhoneNumber, MobileNumber, Website,
        Country, Region, City, SubCity, Woreda, PostalCode, AddressLine1, AddressLine2,
        Latitude, Longitude, TimeZone, CurrencyCode, LanguageCode, LogoPath, TotalAreaSquareMeter,
        IsOperational, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      parkData.BusinessParkCode,
      parkData.BusinessParkName,
      parkData.ShortName || null,
      parkData.Description || null,
      parkData.RegistrationNumber || null,
      parkData.TaxIdentificationNo || null,
      parkData.Email || null,
      parkData.PhoneNumber || null,
      parkData.MobileNumber || null,
      parkData.Website || null,
      parkData.Country || 'Ethiopia',
      parkData.Region || null,
      parkData.City || 'Addis Ababa',
      parkData.SubCity || null,
      parkData.Woreda || null,
      parkData.PostalCode || null,
      parkData.AddressLine1 || null,
      parkData.AddressLine2 || null,
      parkData.Latitude || null,
      parkData.Longitude || null,
      parkData.TimeZone || 'UTC+3',
      parkData.CurrencyCode || 'ETB',
      parkData.LanguageCode || 'en',
      parkData.LogoPath || null,
      parkData.TotalAreaSquareMeter || 0,
      parkData.IsOperational !== undefined ? parkData.IsOperational : 1,
      parkData.IsActive !== undefined ? parkData.IsActive : 1,
      parkData.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async update(id, parkData) {
    const sql = `
      UPDATE BusinessPark SET
        BusinessParkName = COALESCE(?, BusinessParkName),
        ShortName = COALESCE(?, ShortName),
        Description = COALESCE(?, Description),
        RegistrationNumber = COALESCE(?, RegistrationNumber),
        TaxIdentificationNo = COALESCE(?, TaxIdentificationNo),
        Email = COALESCE(?, Email),
        PhoneNumber = COALESCE(?, PhoneNumber),
        MobileNumber = COALESCE(?, MobileNumber),
        Website = COALESCE(?, Website),
        Country = COALESCE(?, Country),
        Region = COALESCE(?, Region),
        City = COALESCE(?, City),
        SubCity = COALESCE(?, SubCity),
        Woreda = COALESCE(?, Woreda),
        PostalCode = COALESCE(?, PostalCode),
        AddressLine1 = COALESCE(?, AddressLine1),
        AddressLine2 = COALESCE(?, AddressLine2),
        Latitude = COALESCE(?, Latitude),
        Longitude = COALESCE(?, Longitude),
        TimeZone = COALESCE(?, TimeZone),
        CurrencyCode = COALESCE(?, CurrencyCode),
        LanguageCode = COALESCE(?, LanguageCode),
        LogoPath = COALESCE(?, LogoPath),
        TotalAreaSquareMeter = COALESCE(?, TotalAreaSquareMeter),
        IsOperational = COALESCE(?, IsOperational),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE BusinessParkID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      parkData.BusinessParkName,
      parkData.ShortName,
      parkData.Description,
      parkData.RegistrationNumber,
      parkData.TaxIdentificationNo,
      parkData.Email,
      parkData.PhoneNumber,
      parkData.MobileNumber,
      parkData.Website,
      parkData.Country,
      parkData.Region,
      parkData.City,
      parkData.SubCity,
      parkData.Woreda,
      parkData.PostalCode,
      parkData.AddressLine1,
      parkData.AddressLine2,
      parkData.Latitude,
      parkData.Longitude,
      parkData.TimeZone,
      parkData.CurrencyCode,
      parkData.LanguageCode,
      parkData.LogoPath,
      parkData.TotalAreaSquareMeter,
      parkData.IsOperational,
      parkData.IsActive,
      parkData.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE BusinessPark SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE BusinessParkID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  async countActiveChildren(parkId) {
    const [zoneRes] = await query(`SELECT COUNT(*) as count FROM FacilityZone WHERE BusinessParkID = ? AND IsDeleted = 0`, [parkId]);
    const [bldgRes] = await query(`SELECT COUNT(*) as count FROM Building WHERE BusinessParkID = ? AND IsDeleted = 0`, [parkId]);
    return {
      zones: Number(zoneRes?.count || 0),
      buildings: Number(bldgRes?.count || 0)
    };
  },

  async getOverviewMetrics(parkId) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    if (parkId) {
      whereClause += ' AND BusinessParkID = ?';
      params.push(parkId);
    }

    const parkStats = await query(`
      SELECT 
        COUNT(*) as totalParks,
        SUM(TotalAreaSquareMeter) as totalParkArea
      FROM BusinessPark WHERE IsDeleted = 0
    `);

    const buildingStats = await query(`
      SELECT 
        COUNT(*) as totalBuildings,
        SUM(TotalFloors) as totalFloors,
        SUM(TotalAreaSquareMeter) as totalBuildingArea
      FROM Building WHERE IsDeleted = 0 ${parkId ? 'AND BusinessParkID = ?' : ''}
    `, params);

    const officeStats = await query(`
      SELECT 
        COUNT(*) as totalOffices,
        SUM(CASE WHEN AvailabilityStatus = 'VACANT' THEN 1 ELSE 0 END) as vacantOffices,
        SUM(CASE WHEN AvailabilityStatus = 'OCCUPIED' THEN 1 ELSE 0 END) as occupiedOffices,
        SUM(CASE WHEN AvailabilityStatus = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenanceOffices,
        SUM(CASE WHEN AvailabilityStatus = 'RESERVED' THEN 1 ELSE 0 END) as reservedOffices,
        SUM(SquareMeters) as totalOfficeArea
      FROM OfficeSpace o
      JOIN Floor f ON o.FloorID = f.FloorID
      JOIN Building b ON f.BuildingID = b.BuildingID
      WHERE o.IsDeleted = 0 AND f.IsDeleted = 0 AND b.IsDeleted = 0 ${parkId ? 'AND b.BusinessParkID = ?' : ''}
    `, params);

    return {
      parks: parkStats[0] || {},
      buildings: buildingStats[0] || {},
      offices: officeStats[0] || {}
    };
  }
};

export default parkRepository;

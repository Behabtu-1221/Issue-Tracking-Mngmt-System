import { query } from '../../../database/connection.js';

export const tenantAddressRepository = {
  /**
   * Find all addresses for a tenant, optionally filtered by AddressType.
   */
  async findAll({ tenantId, addressType, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT ta.*,
        t.CompanyName AS TenantCompanyName,
        t.TenantCode
      FROM TenantAddress ta
      JOIN Tenant t ON ta.TenantID = t.TenantID
      WHERE ta.IsDeleted = 0 AND t.IsDeleted = 0
    `;
    const params = [];

    if (tenantId) {
      sql += ` AND ta.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (addressType) {
      sql += ` AND ta.AddressType = ?`;
      params.push(addressType);
    }

    sql += ` ORDER BY ta.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM TenantAddress ta
      JOIN Tenant t ON ta.TenantID = t.TenantID
      WHERE ta.IsDeleted = 0 AND t.IsDeleted = 0
    `;
    const countParams = [];
    if (tenantId) {
      countSql += ` AND ta.TenantID = ?`;
      countParams.push(Number(tenantId));
    }
    if (addressType) {
      countSql += ` AND ta.AddressType = ?`;
      countParams.push(addressType);
    }
    const countRes = await query(countSql, countParams);

    return {
      addresses: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  /**
   * Find a single address by ID.
   */
  async findById(id) {
    const sql = `
      SELECT ta.*,
        t.CompanyName AS TenantCompanyName,
        t.TenantCode
      FROM TenantAddress ta
      JOIN Tenant t ON ta.TenantID = t.TenantID
      WHERE ta.TenantAddressID = ? AND ta.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Check if tenant already has an address of a given type.
   */
  async findByTenantAndType(tenantId, addressType) {
    const sql = `
      SELECT * FROM TenantAddress
      WHERE TenantID = ? AND AddressType = ? AND IsDeleted = 0
    `;
    const rows = await query(sql, [tenantId, addressType]);
    return rows[0] || null;
  },

  /**
   * Create a new address.
   */
  async create(data) {
    const sql = `
      INSERT INTO TenantAddress (
        TenantID, AddressType, Country, Region, City, SubCity, Woreda,
        PostalCode, AddressLine1, AddressLine2, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.TenantID,
      data.AddressType,
      data.Country,
      data.Region || null,
      data.City,
      data.SubCity || null,
      data.Woreda || null,
      data.PostalCode || null,
      data.AddressLine1,
      data.AddressLine2 || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  /**
   * Update an address.
   */
  async update(id, data) {
    const sql = `
      UPDATE TenantAddress SET
        AddressType = COALESCE(?, AddressType),
        Country = COALESCE(?, Country),
        Region = COALESCE(?, Region),
        City = COALESCE(?, City),
        SubCity = COALESCE(?, SubCity),
        Woreda = COALESCE(?, Woreda),
        PostalCode = COALESCE(?, PostalCode),
        AddressLine1 = COALESCE(?, AddressLine1),
        AddressLine2 = COALESCE(?, AddressLine2),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE TenantAddressID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.AddressType,
      data.Country,
      data.Region,
      data.City,
      data.SubCity,
      data.Woreda,
      data.PostalCode,
      data.AddressLine1,
      data.AddressLine2,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  /**
   * Soft delete an address.
   */
  async softDelete(id, userId) {
    const sql = `
      UPDATE TenantAddress SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE TenantAddressID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default tenantAddressRepository;

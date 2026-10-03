import { query } from '../../../database/connection.js';

export const subTenantRepository = {
  /**
   * Find all sub-tenants, optionally filtered by parentTenantId.
   */
  async findAll({ parentTenantId, search, status, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT st.*,
        t.CompanyName AS ParentCompanyName,
        t.TenantCode AS ParentTenantCode
      FROM SubTenant st
      JOIN Tenant t ON st.ParentTenantID = t.TenantID
      WHERE st.IsDeleted = 0 AND t.IsDeleted = 0
    `;
    const params = [];

    if (parentTenantId) {
      sql += ` AND st.ParentTenantID = ?`;
      params.push(Number(parentTenantId));
    }
    if (search) {
      sql += ` AND (st.CompanyName LIKE ? OR st.RegistrationNumber LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      sql += ` AND st.Status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY st.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    // Count
    let countSql = `
      SELECT COUNT(*) as total FROM SubTenant st
      JOIN Tenant t ON st.ParentTenantID = t.TenantID
      WHERE st.IsDeleted = 0 AND t.IsDeleted = 0
    `;
    const countParams = [];
    if (parentTenantId) {
      countSql += ` AND st.ParentTenantID = ?`;
      countParams.push(Number(parentTenantId));
    }
    if (search) {
      countSql += ` AND (st.CompanyName LIKE ? OR st.RegistrationNumber LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      countSql += ` AND st.Status = ?`;
      countParams.push(status);
    }
    const countRes = await query(countSql, countParams);

    return {
      subTenants: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  /**
   * Find a single sub-tenant by ID.
   */
  async findById(id) {
    const sql = `
      SELECT st.*,
        t.CompanyName AS ParentCompanyName,
        t.TenantCode AS ParentTenantCode
      FROM SubTenant st
      JOIN Tenant t ON st.ParentTenantID = t.TenantID
      WHERE st.SubTenantID = ? AND st.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Check for duplicate sub-tenant under same parent.
   */
  async findByParentAndName(parentTenantId, companyName) {
    const sql = `
      SELECT * FROM SubTenant
      WHERE ParentTenantID = ? AND CompanyName = ? AND IsDeleted = 0
    `;
    const rows = await query(sql, [parentTenantId, companyName]);
    return rows[0] || null;
  },

  /**
   * Create a new sub-tenant.
   */
  async create(data) {
    const sql = `
      INSERT INTO SubTenant (
        ParentTenantID, CompanyName, RegistrationNumber, RelationshipType,
        Status, Description, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.ParentTenantID,
      data.CompanyName,
      data.RegistrationNumber || null,
      data.RelationshipType,
      data.Status || 'ACTIVE',
      data.Description || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  /**
   * Update a sub-tenant.
   */
  async update(id, data) {
    const sql = `
      UPDATE SubTenant SET
        CompanyName = COALESCE(?, CompanyName),
        RegistrationNumber = COALESCE(?, RegistrationNumber),
        RelationshipType = COALESCE(?, RelationshipType),
        Status = COALESCE(?, Status),
        Description = COALESCE(?, Description),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE SubTenantID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.CompanyName,
      data.RegistrationNumber,
      data.RelationshipType,
      data.Status,
      data.Description,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  /**
   * Soft delete a sub-tenant.
   */
  async softDelete(id, userId) {
    const sql = `
      UPDATE SubTenant SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE SubTenantID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default subTenantRepository;

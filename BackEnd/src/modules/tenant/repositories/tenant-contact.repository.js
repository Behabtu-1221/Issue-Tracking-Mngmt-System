import { query } from '../../../database/connection.js';

export const tenantContactRepository = {
  /**
   * Find all contacts for a tenant with optional type filtering.
   */
  async findAll({ tenantId, contactType, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT tc.*,
        t.CompanyName AS TenantCompanyName,
        t.TenantCode
      FROM TenantContact tc
      JOIN Tenant t ON tc.TenantID = t.TenantID
      WHERE tc.IsDeleted = 0 AND t.IsDeleted = 0
    `;
    const params = [];

    if (tenantId) {
      sql += ` AND tc.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (contactType) {
      sql += ` AND tc.ContactType = ?`;
      params.push(contactType);
    }

    sql += ` ORDER BY tc.IsPrimary DESC, tc.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM TenantContact tc
      JOIN Tenant t ON tc.TenantID = t.TenantID
      WHERE tc.IsDeleted = 0 AND t.IsDeleted = 0
    `;
    const countParams = [];
    if (tenantId) {
      countSql += ` AND tc.TenantID = ?`;
      countParams.push(Number(tenantId));
    }
    if (contactType) {
      countSql += ` AND tc.ContactType = ?`;
      countParams.push(contactType);
    }
    const countRes = await query(countSql, countParams);

    return {
      contacts: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  /**
   * Find a single contact by ID.
   */
  async findById(id) {
    const sql = `
      SELECT tc.*,
        t.CompanyName AS TenantCompanyName,
        t.TenantCode
      FROM TenantContact tc
      JOIN Tenant t ON tc.TenantID = t.TenantID
      WHERE tc.TenantContactID = ? AND tc.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Check for duplicate primary contact of same type for a tenant.
   */
  async findPrimaryByType(tenantId, contactType) {
    const sql = `
      SELECT * FROM TenantContact
      WHERE TenantID = ? AND ContactType = ? AND IsPrimary = 1 AND IsDeleted = 0
    `;
    const rows = await query(sql, [tenantId, contactType]);
    return rows[0] || null;
  },

  /**
   * Create a new contact.
   */
  async create(data) {
    const sql = `
      INSERT INTO TenantContact (
        TenantID, ContactType, Label, ContactValue, IsPrimary, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.TenantID,
      data.ContactType,
      data.Label,
      data.ContactValue,
      data.IsPrimary || 0,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  /**
   * Unset the primary flag for all contacts of a given type for a tenant.
   * Used before setting a new primary contact.
   */
  async clearPrimaryFlag(tenantId, contactType) {
    const sql = `
      UPDATE TenantContact SET IsPrimary = 0, ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE TenantID = ? AND ContactType = ? AND IsPrimary = 1 AND IsDeleted = 0
    `;
    await query(sql, [tenantId, contactType]);
  },

  /**
   * Update a contact.
   */
  async update(id, data) {
    const sql = `
      UPDATE TenantContact SET
        ContactType = COALESCE(?, ContactType),
        Label = COALESCE(?, Label),
        ContactValue = COALESCE(?, ContactValue),
        IsPrimary = COALESCE(?, IsPrimary),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE TenantContactID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.ContactType,
      data.Label,
      data.ContactValue,
      data.IsPrimary,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  /**
   * Soft delete a contact.
   */
  async softDelete(id, userId) {
    const sql = `
      UPDATE TenantContact SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE TenantContactID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default tenantContactRepository;

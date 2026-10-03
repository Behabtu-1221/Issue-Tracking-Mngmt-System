import { query } from '../../../database/connection.js';

export const serviceCategoryMappingRepository = {
  /**
   * Find all category department mappings with category & department details.
   */
  async findAll({ search, isActive, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT 
        m.MappingID,
        m.ServiceCategoryID,
        m.DepartmentID,
        m.IsActive,
        m.CreatedBy,
        m.CreatedDate,
        m.ModifiedBy,
        m.ModifiedDate,
        sc.CategoryCode,
        sc.CategoryName,
        sc.Description AS CategoryDescription,
        d.DepartmentCode,
        d.DepartmentName,
        ou.UnitName AS OrganizationUnitName,
        CONCAT(u.FirstName, ' ', COALESCE(u.LastName, '')) AS CreatorName
      FROM ServiceCategoryDepartmentMapping m
      JOIN ServiceCategory sc ON m.ServiceCategoryID = sc.ServiceCategoryID
      JOIN Department d ON m.DepartmentID = d.DepartmentID
      LEFT JOIN OrganizationUnit ou ON d.OrganizationUnitID = ou.OrganizationUnitID
      LEFT JOIN \`User\` u ON m.CreatedBy = u.UserID
      WHERE m.IsDeleted = 0
    `;
    const params = [];

    if (isActive !== undefined && isActive !== null && isActive !== '') {
      sql += ` AND m.IsActive = ?`;
      params.push(Number(isActive));
    }

    if (search) {
      sql += ` AND (sc.CategoryName LIKE ? OR sc.CategoryCode LIKE ? OR d.DepartmentName LIKE ? OR d.DepartmentCode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY sc.CategoryName ASC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const rows = await query(sql, params);

    // Count Total
    let countSql = `
      SELECT COUNT(*) AS total
      FROM ServiceCategoryDepartmentMapping m
      JOIN ServiceCategory sc ON m.ServiceCategoryID = sc.ServiceCategoryID
      JOIN Department d ON m.DepartmentID = d.DepartmentID
      WHERE m.IsDeleted = 0
    `;
    const countParams = [];
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      countSql += ` AND m.IsActive = ?`;
      countParams.push(Number(isActive));
    }
    if (search) {
      countSql += ` AND (sc.CategoryName LIKE ? OR sc.CategoryCode LIKE ? OR d.DepartmentName LIKE ? OR d.DepartmentCode LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countRes = await query(countSql, countParams);

    return {
      mappings: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  /**
   * Find single mapping by ID.
   */
  async findById(mappingId) {
    const sql = `
      SELECT 
        m.MappingID,
        m.ServiceCategoryID,
        m.DepartmentID,
        m.IsActive,
        sc.CategoryCode,
        sc.CategoryName,
        d.DepartmentCode,
        d.DepartmentName
      FROM ServiceCategoryDepartmentMapping m
      JOIN ServiceCategory sc ON m.ServiceCategoryID = sc.ServiceCategoryID
      JOIN Department d ON m.DepartmentID = d.DepartmentID
      WHERE m.MappingID = ? AND m.IsDeleted = 0
    `;
    const rows = await query(sql, [mappingId]);
    return rows[0] || null;
  },

  /**
   * Find active mapping for a specific category (for automatic ticket routing).
   */
  async findActiveByCategory(serviceCategoryId) {
    const sql = `
      SELECT 
        m.MappingID,
        m.ServiceCategoryID,
        m.DepartmentID,
        d.DepartmentName,
        d.DepartmentCode
      FROM ServiceCategoryDepartmentMapping m
      JOIN Department d ON m.DepartmentID = d.DepartmentID
      WHERE m.ServiceCategoryID = ? 
        AND m.IsActive = 1 
        AND m.IsDeleted = 0
      LIMIT 1
    `;
    const rows = await query(sql, [serviceCategoryId]);
    return rows[0] || null;
  },

  /**
   * Backward-compatible alias for findActiveByCategory.
   */
  async findActiveByCategoryAndTenant(serviceCategoryId) {
    return this.findActiveByCategory(serviceCategoryId);
  },

  /**
   * Check if active mapping exists for service category (excluding current ID for updates).
   */
  async findExistingMapping(serviceCategoryId, excludeMappingId = null) {
    let sql = `
      SELECT MappingID 
      FROM ServiceCategoryDepartmentMapping 
      WHERE ServiceCategoryID = ? AND IsDeleted = 0
    `;
    const params = [serviceCategoryId];

    if (excludeMappingId) {
      sql += ` AND MappingID != ?`;
      params.push(excludeMappingId);
    }

    const rows = await query(sql, params);
    return rows[0] || null;
  },

  /**
   * Create a new category-to-department mapping.
   */
  async create(data) {
    const sql = `
      INSERT INTO ServiceCategoryDepartmentMapping (
        ServiceCategoryID, DepartmentID, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.ServiceCategoryID,
      data.DepartmentID,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  /**
   * Update an existing mapping.
   */
  async update(mappingId, data) {
    const fields = [];
    const params = [];

    if (data.ServiceCategoryID !== undefined) {
      fields.push('ServiceCategoryID = ?');
      params.push(data.ServiceCategoryID);
    }
    if (data.DepartmentID !== undefined) {
      fields.push('DepartmentID = ?');
      params.push(data.DepartmentID);
    }
    if (data.IsActive !== undefined) {
      fields.push('IsActive = ?');
      params.push(data.IsActive);
    }
    if (data.ModifiedBy !== undefined) {
      fields.push('ModifiedBy = ?');
      params.push(data.ModifiedBy);
    }

    if (fields.length === 0) return this.findById(mappingId);

    fields.push('ModifiedDate = CURRENT_TIMESTAMP(6)');
    params.push(mappingId);

    const sql = `UPDATE ServiceCategoryDepartmentMapping SET ${fields.join(', ')} WHERE MappingID = ? AND IsDeleted = 0`;
    await query(sql, params);
    return this.findById(mappingId);
  },

  /**
   * Soft delete a mapping.
   */
  async softDelete(mappingId, userId) {
    const sql = `
      UPDATE ServiceCategoryDepartmentMapping 
      SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6) 
      WHERE MappingID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId, mappingId]);
    return true;
  }
};

export default serviceCategoryMappingRepository;

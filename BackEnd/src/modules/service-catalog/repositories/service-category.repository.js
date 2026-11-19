import { query } from '../../../database/connection.js';

export const serviceCategoryRepository = {
  /**
   * Find all service categories with service count aggregation and filters.
   */
  async findAll({ search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT sc.*,
        COALESCE(bp.BusinessParkName, 'Ethiopian IT Park') AS BusinessParkName,
        COALESCE(bp.BusinessParkCode, 'ICT_PARK_AA') AS BusinessParkCode,
        (SELECT COUNT(*) FROM Service s WHERE s.ServiceCategoryID = sc.ServiceCategoryID AND s.IsDeleted = 0) AS ServiceCount,
        COALESCE(scdm.DepartmentID, sc.DepartmentID, d.DepartmentID) AS RoutedDepartmentID,
        d.DepartmentName AS RoutedDepartmentName,
        d.DepartmentCode AS RoutedDepartmentCode,
        scdm.MappingID,
        scdm.IsActive AS IsMappingActive
      FROM ServiceCategory sc
      LEFT JOIN BusinessPark bp ON sc.BusinessParkID = bp.BusinessParkID
      LEFT JOIN ServiceCategoryDepartmentMapping scdm ON scdm.ServiceCategoryID = sc.ServiceCategoryID AND scdm.IsDeleted = 0
      LEFT JOIN Department d ON (COALESCE(scdm.DepartmentID, sc.DepartmentID) = d.DepartmentID) AND d.IsDeleted = 0
      WHERE sc.IsDeleted = 0
    `;
    const params = [];

    if (search) {
      sql += ` AND (sc.CategoryName LIKE ? OR sc.CategoryCode LIKE ? OR sc.Description LIKE ? OR bp.BusinessParkName LIKE ? OR d.DepartmentName LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY sc.CreatedDate DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total
      FROM ServiceCategory sc
      LEFT JOIN BusinessPark bp ON sc.BusinessParkID = bp.BusinessParkID
      LEFT JOIN ServiceCategoryDepartmentMapping scdm ON scdm.ServiceCategoryID = sc.ServiceCategoryID AND scdm.IsDeleted = 0
      LEFT JOIN Department d ON (COALESCE(scdm.DepartmentID, sc.DepartmentID) = d.DepartmentID) AND d.IsDeleted = 0
      WHERE sc.IsDeleted = 0
    `;
    const countParams = [];
    if (search) {
      countSql += ` AND (sc.CategoryName LIKE ? OR sc.CategoryCode LIKE ? OR sc.Description LIKE ? OR bp.BusinessParkName LIKE ? OR d.DepartmentName LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      categories: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  /**
   * Find a category by ID.
   */
  async findById(id) {
    const sql = `
      SELECT sc.*,
        COALESCE(bp.BusinessParkName, 'Ethiopian IT Park') AS BusinessParkName,
        COALESCE(bp.BusinessParkCode, 'ICT_PARK_AA') AS BusinessParkCode,
        (SELECT COUNT(*) FROM Service s WHERE s.ServiceCategoryID = sc.ServiceCategoryID AND s.IsDeleted = 0) AS ServiceCount,
        COALESCE(scdm.DepartmentID, sc.DepartmentID, d.DepartmentID) AS RoutedDepartmentID,
        d.DepartmentName AS RoutedDepartmentName,
        d.DepartmentCode AS RoutedDepartmentCode,
        scdm.MappingID,
        scdm.IsActive AS IsMappingActive
      FROM ServiceCategory sc
      LEFT JOIN BusinessPark bp ON sc.BusinessParkID = bp.BusinessParkID
      LEFT JOIN ServiceCategoryDepartmentMapping scdm ON scdm.ServiceCategoryID = sc.ServiceCategoryID AND scdm.IsDeleted = 0
      LEFT JOIN Department d ON (COALESCE(scdm.DepartmentID, sc.DepartmentID) = d.DepartmentID) AND d.IsDeleted = 0
      WHERE sc.ServiceCategoryID = ? AND sc.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find by code for park-wide uniqueness checking.
   */
  async findByCode(categoryCode) {
    const sql = `SELECT * FROM ServiceCategory WHERE CategoryCode = ? AND IsDeleted = 0 LIMIT 1`;
    const rows = await query(sql, [categoryCode]);
    return rows[0] || null;
  },

  /**
   * Backward-compatible alias for findByCode.
   */
  async findByTenantAndCode(tenantId, categoryCode) {
    return this.findByCode(categoryCode);
  },

  /**
   * Create a service category.
   */
  async create(data) {
    const sql = `
      INSERT INTO ServiceCategory (
        BusinessParkID, DepartmentID, CategoryCode, CategoryName, Description, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.BusinessParkID || 1,
      data.DepartmentID || null,
      data.CategoryCode,
      data.CategoryName,
      data.Description || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  /**
   * Update a service category.
   */
  async update(id, data) {
    const fields = [];
    const params = [];

    if (data.BusinessParkID !== undefined) {
      fields.push('BusinessParkID = ?');
      params.push(data.BusinessParkID || 1);
    }
    if (data.DepartmentID !== undefined) {
      fields.push('DepartmentID = ?');
      params.push(data.DepartmentID || null);
    }
    if (data.CategoryName !== undefined) {
      fields.push('CategoryName = ?');
      params.push(data.CategoryName);
    }
    if (data.Description !== undefined) {
      fields.push('Description = ?');
      params.push(data.Description || null);
    }
    if (data.IsActive !== undefined) {
      fields.push('IsActive = ?');
      params.push(Number(data.IsActive));
    }

    fields.push('ModifiedBy = ?');
    params.push(data.ModifiedBy || 1);

    fields.push('ModifiedDate = CURRENT_TIMESTAMP(6)');

    params.push(id);

    const sql = `
      UPDATE ServiceCategory SET
        ${fields.join(', ')}
      WHERE ServiceCategoryID = ? AND IsDeleted = 0
    `;

    await query(sql, params);
    return this.findById(id);
  },

  /**
   * Soft delete a service category.
   */
  async softDelete(id, userId) {
    const sql = `
      UPDATE ServiceCategory SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceCategoryID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default serviceCategoryRepository;

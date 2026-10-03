import { query } from '../../../database/connection.js';

export const serviceRepository = {
  /**
   * Find all services with joins to category, type, level, pricing, and SLA details.
   */
  async findAll({ categoryId, serviceTypeId, serviceLevelId, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT s.*,
        sc.CategoryName,
        sc.CategoryCode,
        st.ServiceTypeName,
        sl.ServiceLevelName,
        sp.PricingModel,
        sp.UnitPrice,
        sp.BillingType,
        (SELECT COUNT(*) FROM ServiceRequirement sr WHERE sr.ServiceID = s.ServiceID AND sr.IsDeleted = 0) AS RequirementCount,
        (SELECT COUNT(*) FROM ServiceAttachmentRequirement sar WHERE sar.ServiceID = s.ServiceID AND sar.IsDeleted = 0) AS AttachmentRequirementCount
      FROM Service s
      JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
      LEFT JOIN ServiceType st ON s.ServiceTypeID = st.ServiceTypeID
      LEFT JOIN ServiceLevel sl ON s.ServiceLevelID = sl.ServiceLevelID
      LEFT JOIN ServicePricing sp ON s.ServiceID = sp.ServiceID AND sp.IsDeleted = 0
      WHERE s.IsDeleted = 0 AND sc.IsDeleted = 0
    `;
    const params = [];

    if (categoryId) {
      sql += ` AND s.ServiceCategoryID = ?`;
      params.push(Number(categoryId));
    }
    if (serviceTypeId) {
      sql += ` AND s.ServiceTypeID = ?`;
      params.push(Number(serviceTypeId));
    }
    if (serviceLevelId) {
      sql += ` AND s.ServiceLevelID = ?`;
      params.push(Number(serviceLevelId));
    }
    if (search) {
      sql += ` AND (s.ServiceName LIKE ? OR s.ServiceCode LIKE ? OR s.Description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY s.CreatedDate DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM Service s
      JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
      WHERE s.IsDeleted = 0 AND sc.IsDeleted = 0
    `;
    const countParams = [];
    if (categoryId) { countSql += ` AND s.ServiceCategoryID = ?`; countParams.push(Number(categoryId)); }
    if (serviceTypeId) { countSql += ` AND s.ServiceTypeID = ?`; countParams.push(Number(serviceTypeId)); }
    if (serviceLevelId) { countSql += ` AND s.ServiceLevelID = ?`; countParams.push(Number(serviceLevelId)); }
    if (search) {
      countSql += ` AND (s.ServiceName LIKE ? OR s.ServiceCode LIKE ? OR s.Description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      services: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  /**
   * Find a service by ID with detailed joins.
   */
  async findById(id) {
    const sql = `
      SELECT s.*,
        sc.CategoryName,
        sc.CategoryCode,
        st.ServiceTypeName,
        sl.ServiceLevelName,
        sp.ServicePricingID,
        sp.PricingModel,
        sp.UnitPrice,
        sp.BillingType,
        sp.CurrencyCode AS PricingCurrencyCode,
        sa.ServiceAvailabilityID,
        sa.BusinessCalendarID,
        bc.CalendarName
      FROM Service s
      JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
      LEFT JOIN ServiceType st ON s.ServiceTypeID = st.ServiceTypeID
      LEFT JOIN ServiceLevel sl ON s.ServiceLevelID = sl.ServiceLevelID
      LEFT JOIN ServicePricing sp ON s.ServiceID = sp.ServiceID AND sp.IsDeleted = 0
      LEFT JOIN ServiceAvailability sa ON s.ServiceID = sa.ServiceID AND sa.IsDeleted = 0
      LEFT JOIN BusinessCalendar bc ON sa.BusinessCalendarID = bc.BusinessCalendarID
      WHERE s.ServiceID = ? AND s.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find by code and category for uniqueness validation.
   */
  async findByCategoryAndCode(categoryId, serviceCode) {
    const sql = `
      SELECT * FROM Service
      WHERE ServiceCategoryID = ? AND ServiceCode = ? AND IsDeleted = 0
    `;
    const rows = await query(sql, [categoryId, serviceCode]);
    return rows[0] || null;
  },

  /**
   * Create a core service.
   */
  async create(data) {
    const sql = `
      INSERT INTO Service (
        ServiceCategoryID, ServiceTypeID, ServiceLevelID, ServiceCode, ServiceName, Description, EstimatedCost, CurrencyCode, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.ServiceCategoryID,
      data.ServiceTypeID || 1,
      data.ServiceLevelID || 1,
      data.ServiceCode,
      data.ServiceName,
      data.Description || null,
      data.EstimatedCost || 0.00,
      data.CurrencyCode || 'ETB',
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  /**
   * Update a service.
   */
  async update(id, data) {
    const sql = `
      UPDATE Service SET
        ServiceCategoryID = COALESCE(?, ServiceCategoryID),
        ServiceTypeID = COALESCE(?, ServiceTypeID),
        ServiceLevelID = COALESCE(?, ServiceLevelID),
        ServiceName = COALESCE(?, ServiceName),
        Description = COALESCE(?, Description),
        EstimatedCost = COALESCE(?, EstimatedCost),
        CurrencyCode = COALESCE(?, CurrencyCode),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.ServiceCategoryID ?? null,
      data.ServiceTypeID ?? null,
      data.ServiceLevelID ?? null,
      data.ServiceName ?? null,
      data.Description ?? null,
      data.EstimatedCost ?? null,
      data.CurrencyCode ?? null,
      data.IsActive ?? null,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  /**
   * Soft delete a service.
   */
  async softDelete(id, userId) {
    const sql = `
      UPDATE Service SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  /**
   * Overview metrics for Service Catalog dashboard.
   */
  async getOverviewMetrics(tenantId) {
    const params = [];
    const tenantFilter = tenantId ? ' AND sc.TenantID = ?' : '';
    if (tenantId) params.push(Number(tenantId));

    const totalCats = await query(
      `SELECT COUNT(*) as total FROM ServiceCategory sc WHERE sc.IsDeleted = 0 ${tenantFilter}`,
      params
    );

    const totalSvcs = await query(`
      SELECT COUNT(*) as total
      FROM Service s
      JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
      WHERE s.IsDeleted = 0 AND sc.IsDeleted = 0 ${tenantFilter}
    `, params);

    const activeSvcs = await query(`
      SELECT COUNT(*) as total
      FROM Service s
      JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
      WHERE s.IsDeleted = 0 AND s.IsActive = 1 AND sc.IsDeleted = 0 ${tenantFilter}
    `, params);

    const billableSvcs = await query(`
      SELECT COUNT(*) as total
      FROM ServicePricing sp
      JOIN Service s ON sp.ServiceID = s.ServiceID
      JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID
      WHERE sp.IsDeleted = 0 AND sp.BillingType = 'BILLABLE' AND s.IsDeleted = 0 ${tenantFilter}
    `, params);

    return {
      totalCategories: totalCats[0]?.total || 0,
      totalServices: totalSvcs[0]?.total || 0,
      activeServices: activeSvcs[0]?.total || 0,
      billableServices: billableSvcs[0]?.total || 0
    };
  }
};

export default serviceRepository;

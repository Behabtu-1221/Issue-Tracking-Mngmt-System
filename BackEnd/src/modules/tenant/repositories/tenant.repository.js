import { query } from '../../../database/connection.js';

export const tenantRepository = {
  /**
   * Find all tenants with search, filtering, and pagination.
   * Joins TenantType, Industry, and BusinessPark for display names.
   */
  async findAll({ search, status, businessParkId, tenantTypeId, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT t.*,
        tt.TenantTypeName,
        tt.TenantTypeCode,
        i.IndustryName,
        i.IndustryCode,
        bp.BusinessParkName,
        bp.BusinessParkCode,
        (SELECT COUNT(*) FROM SubTenant st WHERE st.ParentTenantID = t.TenantID AND st.IsDeleted = 0) AS SubTenantCount,
        (SELECT COUNT(*) FROM TenantContact tc WHERE tc.TenantID = t.TenantID AND tc.IsDeleted = 0) AS ContactCount,
        (SELECT COUNT(*) FROM LeaseAgreement la WHERE la.TenantID = t.TenantID AND la.IsDeleted = 0) AS LeaseCount,
        (SELECT COUNT(*) FROM TenantOfficeAllocation toa WHERE toa.TenantID = t.TenantID AND toa.Status = 'ACTIVE' AND toa.IsDeleted = 0) AS ActiveAllocationCount
      FROM Tenant t
      LEFT JOIN TenantType tt ON t.TenantTypeID = tt.TenantTypeID
      LEFT JOIN Industry i ON t.IndustryID = i.IndustryID
      LEFT JOIN BusinessPark bp ON t.BusinessParkID = bp.BusinessParkID
      WHERE t.IsDeleted = 0
    `;
    const params = [];

    if (search) {
      sql += ` AND (t.CompanyName LIKE ? OR t.TenantCode LIKE ? OR t.RegistrationNumber LIKE ? OR t.TaxIdentificationNo LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      sql += ` AND t.Status = ?`;
      params.push(status);
    }
    if (businessParkId) {
      sql += ` AND t.BusinessParkID = ?`;
      params.push(Number(businessParkId));
    }
    if (tenantTypeId) {
      sql += ` AND t.TenantTypeID = ?`;
      params.push(Number(tenantTypeId));
    }

    sql += ` ORDER BY t.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    // Count query
    let countSql = `SELECT COUNT(*) as total FROM Tenant t WHERE t.IsDeleted = 0`;
    const countParams = [];
    if (search) {
      countSql += ` AND (t.CompanyName LIKE ? OR t.TenantCode LIKE ? OR t.RegistrationNumber LIKE ? OR t.TaxIdentificationNo LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      countSql += ` AND t.Status = ?`;
      countParams.push(status);
    }
    if (businessParkId) {
      countSql += ` AND t.BusinessParkID = ?`;
      countParams.push(Number(businessParkId));
    }
    if (tenantTypeId) {
      countSql += ` AND t.TenantTypeID = ?`;
      countParams.push(Number(tenantTypeId));
    }
    const countRes = await query(countSql, countParams);

    return {
      tenants: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  /**
   * Find a single tenant by ID with all joined details.
   */
  async findById(id) {
    const sql = `
      SELECT t.*,
        tt.TenantTypeName,
        tt.TenantTypeCode,
        i.IndustryName,
        i.IndustryCode,
        bp.BusinessParkName,
        bp.BusinessParkCode,
        (SELECT COUNT(*) FROM SubTenant st WHERE st.ParentTenantID = t.TenantID AND st.IsDeleted = 0) AS SubTenantCount,
        (SELECT COUNT(*) FROM TenantContact tc WHERE tc.TenantID = t.TenantID AND tc.IsDeleted = 0) AS ContactCount,
        (SELECT COUNT(*) FROM TenantAddress ta WHERE ta.TenantID = t.TenantID AND ta.IsDeleted = 0) AS AddressCount,
        (SELECT COUNT(*) FROM LeaseAgreement la WHERE la.TenantID = t.TenantID AND la.IsDeleted = 0) AS LeaseCount,
        (SELECT COUNT(*) FROM TenantOfficeAllocation toa WHERE toa.TenantID = t.TenantID AND toa.Status = 'ACTIVE' AND toa.IsDeleted = 0) AS ActiveAllocationCount
      FROM Tenant t
      LEFT JOIN TenantType tt ON t.TenantTypeID = tt.TenantTypeID
      LEFT JOIN Industry i ON t.IndustryID = i.IndustryID
      LEFT JOIN BusinessPark bp ON t.BusinessParkID = bp.BusinessParkID
      WHERE t.TenantID = ? AND t.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find tenant by unique TenantCode.
   */
  async findByCode(code) {
    const sql = `SELECT * FROM Tenant WHERE TenantCode = ? AND IsDeleted = 0`;
    const rows = await query(sql, [code]);
    return rows[0] || null;
  },

  /**
   * Find tenant by RegistrationNumber (for uniqueness checks).
   */
  async findByRegistrationNumber(regNum) {
    const sql = `SELECT * FROM Tenant WHERE RegistrationNumber = ? AND IsDeleted = 0`;
    const rows = await query(sql, [regNum]);
    return rows[0] || null;
  },

  /**
   * Create a new tenant record.
   */
  async create(data) {
    const sql = `
      INSERT INTO Tenant (
        BusinessParkID, TenantTypeID, IndustryID, TenantCode, CompanyName,
        RegistrationNumber, TaxIdentificationNo, Status, OnboardedDate,
        Website, LogoPath, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.BusinessParkID,
      data.TenantTypeID,
      data.IndustryID || null,
      data.TenantCode,
      data.CompanyName,
      data.RegistrationNumber || null,
      data.TaxIdentificationNo || null,
      data.Status || 'ONBOARDING',
      data.OnboardedDate || null,
      data.Website || null,
      data.LogoPath || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  /**
   * Update a tenant record with partial data using COALESCE.
   */
  async update(id, data) {
    const sql = `
      UPDATE Tenant SET
        BusinessParkID = COALESCE(?, BusinessParkID),
        TenantTypeID = COALESCE(?, TenantTypeID),
        IndustryID = COALESCE(?, IndustryID),
        CompanyName = COALESCE(?, CompanyName),
        RegistrationNumber = COALESCE(?, RegistrationNumber),
        TaxIdentificationNo = COALESCE(?, TaxIdentificationNo),
        Website = COALESCE(?, Website),
        LogoPath = COALESCE(?, LogoPath),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE TenantID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.BusinessParkID,
      data.TenantTypeID,
      data.IndustryID,
      data.CompanyName,
      data.RegistrationNumber,
      data.TaxIdentificationNo,
      data.Website,
      data.LogoPath,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  /**
   * Update tenant lifecycle status and track transition dates.
   */
  async updateStatus(id, status, userId) {
    let sql = `
      UPDATE Tenant SET
        Status = ?,
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
    `;
    const params = [status, userId || 1];

    // Set lifecycle dates based on the status transition
    if (status === 'ACTIVE') {
      sql += `, OnboardedDate = COALESCE(OnboardedDate, CURDATE())`;
    }
    if (status === 'TERMINATED') {
      sql += `, OffboardedDate = CURDATE()`;
    }

    sql += ` WHERE TenantID = ? AND IsDeleted = 0`;
    params.push(id);
    await query(sql, params);
    return this.findById(id);
  },

  /**
   * Soft delete a tenant.
   */
  async softDelete(id, userId) {
    const sql = `
      UPDATE Tenant SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE TenantID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  /**
   * Get dashboard / overview metrics for the tenant module.
   */
  async getDashboardMetrics(businessParkId, tenantId = null) {
    const params = [];
    let filter = '';
    if (businessParkId) {
      filter += ' AND t.BusinessParkID = ?';
      params.push(Number(businessParkId));
    }
    if (tenantId) {
      filter += ' AND t.TenantID = ?';
      params.push(Number(tenantId));
    }

    const tenantStats = await query(`
      SELECT
        COUNT(*) as totalTenants,
        SUM(CASE WHEN t.Status = 'ONBOARDING' THEN 1 ELSE 0 END) as onboarding,
        SUM(CASE WHEN t.Status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN t.Status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended,
        SUM(CASE WHEN t.Status = 'TERMINATED' THEN 1 ELSE 0 END) as \`terminated\`
      FROM Tenant t
      WHERE t.IsDeleted = 0 ${filter}
    `, params);

    const leaseStats = await query(`
      SELECT
        COUNT(*) as totalLeases,
        SUM(CASE WHEN la.Status = 'DRAFT' THEN 1 ELSE 0 END) as draftLeases,
        SUM(CASE WHEN la.Status = 'ACTIVE' THEN 1 ELSE 0 END) as activeLeases,
        SUM(CASE WHEN la.Status = 'EXPIRED' THEN 1 ELSE 0 END) as expiredLeases,
        SUM(CASE WHEN la.Status = 'TERMINATED' THEN 1 ELSE 0 END) as terminatedLeases,
        SUM(CASE WHEN la.Status = 'ACTIVE' THEN la.MonthlyRentAmount ELSE 0 END) as totalMonthlyRevenue
      FROM LeaseAgreement la
      JOIN Tenant t ON la.TenantID = t.TenantID
      WHERE la.IsDeleted = 0 AND t.IsDeleted = 0 ${filter}
    `, params);

    const allocationStats = await query(`
      SELECT
        COUNT(*) as totalAllocations,
        SUM(CASE WHEN toa.Status = 'ACTIVE' THEN 1 ELSE 0 END) as activeAllocations,
        SUM(CASE WHEN toa.Status = 'RELEASED' THEN 1 ELSE 0 END) as releasedAllocations
      FROM TenantOfficeAllocation toa
      JOIN Tenant t ON toa.TenantID = t.TenantID
      WHERE toa.IsDeleted = 0 AND t.IsDeleted = 0 ${filter}
    `, params);

    return {
      tenants: tenantStats[0] || {},
      leases: leaseStats[0] || {},
      allocations: allocationStats[0] || {}
    };
  }
};

export default tenantRepository;

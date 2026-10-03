import { query } from '../../../database/connection.js';

export const leaseRepository = {
  /**
   * Find all lease agreements with tenant context and filtering.
   */
  async findAll({ tenantId, status, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT la.*,
        t.CompanyName AS TenantCompanyName,
        t.TenantCode,
        t.Status AS TenantStatus,
        (SELECT COUNT(*) FROM TenantOfficeAllocation toa WHERE toa.LeaseAgreementID = la.LeaseAgreementID AND toa.IsDeleted = 0) AS AllocationCount
      FROM LeaseAgreement la
      JOIN Tenant t ON la.TenantID = t.TenantID
      WHERE la.IsDeleted = 0 AND t.IsDeleted = 0
    `;
    const params = [];

    if (tenantId) {
      sql += ` AND la.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (status) {
      sql += ` AND la.Status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (la.AgreementNumber LIKE ? OR t.CompanyName LIKE ? OR t.TenantCode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY la.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM LeaseAgreement la
      JOIN Tenant t ON la.TenantID = t.TenantID
      WHERE la.IsDeleted = 0 AND t.IsDeleted = 0
    `;
    const countParams = [];
    if (tenantId) {
      countSql += ` AND la.TenantID = ?`;
      countParams.push(Number(tenantId));
    }
    if (status) {
      countSql += ` AND la.Status = ?`;
      countParams.push(status);
    }
    if (search) {
      countSql += ` AND (la.AgreementNumber LIKE ? OR t.CompanyName LIKE ? OR t.TenantCode LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      leases: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  /**
   * Find a single lease by ID with tenant info.
   */
  async findById(id) {
    const sql = `
      SELECT la.*,
        t.CompanyName AS TenantCompanyName,
        t.TenantCode,
        t.Status AS TenantStatus,
        (SELECT COUNT(*) FROM TenantOfficeAllocation toa WHERE toa.LeaseAgreementID = la.LeaseAgreementID AND toa.IsDeleted = 0) AS AllocationCount
      FROM LeaseAgreement la
      JOIN Tenant t ON la.TenantID = t.TenantID
      WHERE la.LeaseAgreementID = ? AND la.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find by agreement number (unique constraint).
   */
  async findByAgreementNumber(agreementNumber) {
    const sql = `SELECT * FROM LeaseAgreement WHERE AgreementNumber = ? AND IsDeleted = 0`;
    const rows = await query(sql, [agreementNumber]);
    return rows[0] || null;
  },

  /**
   * Check for active leases for a tenant (only one ACTIVE lease should exist at a time).
   */
  async findActiveByTenant(tenantId) {
    const sql = `
      SELECT * FROM LeaseAgreement
      WHERE TenantID = ? AND Status = 'ACTIVE' AND IsDeleted = 0
    `;
    const rows = await query(sql, [tenantId]);
    return rows;
  },

  /**
   * Find leases expiring within N days (for renewal alerts).
   */
  async findExpiringSoon(days = 30) {
    const sql = `
      SELECT la.*,
        t.CompanyName AS TenantCompanyName,
        t.TenantCode,
        DATEDIFF(la.EndDate, CURDATE()) AS DaysUntilExpiry
      FROM LeaseAgreement la
      JOIN Tenant t ON la.TenantID = t.TenantID
      WHERE la.Status = 'ACTIVE'
        AND la.IsDeleted = 0
        AND t.IsDeleted = 0
        AND la.EndDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY la.EndDate ASC
    `;
    const rows = await query(sql, [days]);
    return rows;
  },

  /**
   * Create a new lease agreement.
   */
  async create(data) {
    const sql = `
      INSERT INTO LeaseAgreement (
        TenantID, AgreementNumber, StartDate, EndDate, ExecutionDate,
        MonthlyRentAmount, SecurityDepositAmount, CurrencyCode,
        GracePeriodDays, Status, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.TenantID,
      data.AgreementNumber,
      data.StartDate,
      data.EndDate,
      data.ExecutionDate,
      data.MonthlyRentAmount,
      data.SecurityDepositAmount,
      data.CurrencyCode || 'ETB',
      data.GracePeriodDays || 0,
      data.Status || 'DRAFT',
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  /**
   * Update a lease agreement.
   */
  async update(id, data) {
    const sql = `
      UPDATE LeaseAgreement SET
        StartDate = COALESCE(?, StartDate),
        EndDate = COALESCE(?, EndDate),
        ExecutionDate = COALESCE(?, ExecutionDate),
        MonthlyRentAmount = COALESCE(?, MonthlyRentAmount),
        SecurityDepositAmount = COALESCE(?, SecurityDepositAmount),
        CurrencyCode = COALESCE(?, CurrencyCode),
        GracePeriodDays = COALESCE(?, GracePeriodDays),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE LeaseAgreementID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.StartDate,
      data.EndDate,
      data.ExecutionDate,
      data.MonthlyRentAmount,
      data.SecurityDepositAmount,
      data.CurrencyCode,
      data.GracePeriodDays,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  /**
   * Update lease status (DRAFT -> ACTIVE -> EXPIRED / TERMINATED).
   */
  async updateStatus(id, status, terminationReason, userId) {
    let sql = `
      UPDATE LeaseAgreement SET
        Status = ?,
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
    `;
    const params = [status, userId || 1];

    if (status === 'TERMINATED') {
      sql += `, TerminationDate = CURDATE(), TerminationReason = ?`;
      params.push(terminationReason || null);
    }

    sql += ` WHERE LeaseAgreementID = ? AND IsDeleted = 0`;
    params.push(id);
    await query(sql, params);
    return this.findById(id);
  },

  /**
   * Soft delete a lease.
   */
  async softDelete(id, userId) {
    const sql = `
      UPDATE LeaseAgreement SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE LeaseAgreementID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default leaseRepository;

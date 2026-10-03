import { query } from '../../../database/connection.js';

export const officeAllocationRepository = {
  /**
   * Find all office allocations with tenant/office/lease context.
   */
  async findAll({ tenantId, officeSpaceId, leaseAgreementId, status, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT toa.*,
        t.CompanyName AS TenantCompanyName,
        t.TenantCode,
        os.OfficeNumber,
        os.OfficeName,
        os.SquareMeters,
        os.AvailabilityStatus AS OfficeAvailabilityStatus,
        f.FloorName,
        b.BuildingName,
        bp.BusinessParkName,
        la.AgreementNumber
      FROM TenantOfficeAllocation toa
      JOIN Tenant t ON toa.TenantID = t.TenantID
      JOIN OfficeSpace os ON toa.OfficeSpaceID = os.OfficeSpaceID
      JOIN Floor f ON os.FloorID = f.FloorID
      JOIN Building b ON f.BuildingID = b.BuildingID
      JOIN BusinessPark bp ON b.BusinessParkID = bp.BusinessParkID
      LEFT JOIN LeaseAgreement la ON toa.LeaseAgreementID = la.LeaseAgreementID
      WHERE toa.IsDeleted = 0 AND t.IsDeleted = 0
    `;
    const params = [];

    if (tenantId) {
      sql += ` AND toa.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (officeSpaceId) {
      sql += ` AND toa.OfficeSpaceID = ?`;
      params.push(Number(officeSpaceId));
    }
    if (leaseAgreementId) {
      sql += ` AND toa.LeaseAgreementID = ?`;
      params.push(Number(leaseAgreementId));
    }
    if (status) {
      sql += ` AND toa.Status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY toa.AllocatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    // Count
    let countSql = `
      SELECT COUNT(*) as total FROM TenantOfficeAllocation toa
      JOIN Tenant t ON toa.TenantID = t.TenantID
      WHERE toa.IsDeleted = 0 AND t.IsDeleted = 0
    `;
    const countParams = [];
    if (tenantId) { countSql += ` AND toa.TenantID = ?`; countParams.push(Number(tenantId)); }
    if (officeSpaceId) { countSql += ` AND toa.OfficeSpaceID = ?`; countParams.push(Number(officeSpaceId)); }
    if (leaseAgreementId) { countSql += ` AND toa.LeaseAgreementID = ?`; countParams.push(Number(leaseAgreementId)); }
    if (status) { countSql += ` AND toa.Status = ?`; countParams.push(status); }
    const countRes = await query(countSql, countParams);

    return {
      allocations: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  /**
   * Find a single allocation by ID with full context.
   */
  async findById(id) {
    const sql = `
      SELECT toa.*,
        t.CompanyName AS TenantCompanyName,
        t.TenantCode,
        os.OfficeNumber,
        os.OfficeName,
        os.SquareMeters,
        f.FloorName,
        b.BuildingName,
        bp.BusinessParkName,
        la.AgreementNumber
      FROM TenantOfficeAllocation toa
      JOIN Tenant t ON toa.TenantID = t.TenantID
      JOIN OfficeSpace os ON toa.OfficeSpaceID = os.OfficeSpaceID
      JOIN Floor f ON os.FloorID = f.FloorID
      JOIN Building b ON f.BuildingID = b.BuildingID
      JOIN BusinessPark bp ON b.BusinessParkID = bp.BusinessParkID
      LEFT JOIN LeaseAgreement la ON toa.LeaseAgreementID = la.LeaseAgreementID
      WHERE toa.TenantOfficeAllocationID = ? AND toa.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Check if an office is currently actively allocated.
   */
  async findActiveByOffice(officeSpaceId) {
    const sql = `
      SELECT toa.*, t.CompanyName AS TenantCompanyName
      FROM TenantOfficeAllocation toa
      JOIN Tenant t ON toa.TenantID = t.TenantID
      WHERE toa.OfficeSpaceID = ? AND toa.Status = 'ACTIVE' AND toa.IsDeleted = 0
    `;
    const rows = await query(sql, [officeSpaceId]);
    return rows[0] || null;
  },

  /**
   * Create a new office allocation.
   */
  async create(data) {
    const sql = `
      INSERT INTO TenantOfficeAllocation (
        TenantID, OfficeSpaceID, LeaseAgreementID, AllocatedDate,
        Status, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.TenantID,
      data.OfficeSpaceID,
      data.LeaseAgreementID || null,
      data.AllocatedDate,
      data.Status || 'ACTIVE',
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  /**
   * Release an allocation (set status to RELEASED, record release date).
   */
  async release(id, userId) {
    const sql = `
      UPDATE TenantOfficeAllocation SET
        Status = 'RELEASED',
        ReleasedDate = CURDATE(),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE TenantOfficeAllocationID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return this.findById(id);
  },

  /**
   * Soft delete an allocation.
   */
  async softDelete(id, userId) {
    const sql = `
      UPDATE TenantOfficeAllocation SET
        IsDeleted = 1,
        DeletedBy = ?,
        DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE TenantOfficeAllocationID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  // ─── OFFICE ALLOCATION HISTORY ────────────────────────────────────────

  /**
   * Record a history entry whenever an allocation/release/vacate occurs.
   */
  async createHistory(data) {
    const sql = `
      INSERT INTO OfficeAllocationHistory (
        OfficeSpaceID, TenantID, LeaseAgreementID, ActionType, Remarks, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.OfficeSpaceID,
      data.TenantID || null,
      data.LeaseAgreementID || null,
      data.ActionType,
      data.Remarks || null,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  /**
   * Get allocation history for an office or tenant.
   */
  async getHistory({ officeSpaceId, tenantId, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT oah.*,
        os.OfficeNumber,
        os.OfficeName,
        t.CompanyName AS TenantCompanyName,
        t.TenantCode,
        la.AgreementNumber
      FROM OfficeAllocationHistory oah
      JOIN OfficeSpace os ON oah.OfficeSpaceID = os.OfficeSpaceID
      LEFT JOIN Tenant t ON oah.TenantID = t.TenantID
      LEFT JOIN LeaseAgreement la ON oah.LeaseAgreementID = la.LeaseAgreementID
      WHERE oah.IsDeleted = 0
    `;
    const params = [];

    if (officeSpaceId) {
      sql += ` AND oah.OfficeSpaceID = ?`;
      params.push(Number(officeSpaceId));
    }
    if (tenantId) {
      sql += ` AND oah.TenantID = ?`;
      params.push(Number(tenantId));
    }

    sql += ` ORDER BY oah.ActionDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM OfficeAllocationHistory oah WHERE oah.IsDeleted = 0`;
    const countParams = [];
    if (officeSpaceId) { countSql += ` AND oah.OfficeSpaceID = ?`; countParams.push(Number(officeSpaceId)); }
    if (tenantId) { countSql += ` AND oah.TenantID = ?`; countParams.push(Number(tenantId)); }
    const countRes = await query(countSql, countParams);

    return {
      history: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  }
};

export default officeAllocationRepository;

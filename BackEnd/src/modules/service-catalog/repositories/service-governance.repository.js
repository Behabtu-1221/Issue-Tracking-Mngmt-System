import { query } from '../../../database/connection.js';

export const serviceGovernanceRepository = {
  // ── Service Visibility ──
  async findVisibilityByServiceId(serviceId) {
    const sql = `
      SELECT sv.*,
        t.CompanyName AS TenantName,
        r.RoleName
      FROM ServiceVisibility sv
      LEFT JOIN Tenant t ON sv.TenantID = t.TenantID
      LEFT JOIN \`Role\` r ON sv.RoleID = r.RoleID
      WHERE sv.ServiceID = ? AND sv.IsDeleted = 0
    `;
    return query(sql, [serviceId]);
  },

  async createVisibility(data) {
    const sql = `
      INSERT INTO ServiceVisibility (
        ServiceID, TenantTypeID, TenantID, RoleID, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.ServiceID,
      data.TenantTypeID || null,
      data.TenantID || null,
      data.RoleID || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async deleteVisibility(id, userId) {
    const sql = `
      UPDATE ServiceVisibility SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceVisibilityID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  // ── Service Department Mapping ──
  async findDepartmentsByServiceId(serviceId) {
    const sql = `
      SELECT sd.*, d.DepartmentName, d.DepartmentCode
      FROM ServiceDepartment sd
      JOIN Department d ON sd.DepartmentID = d.DepartmentID
      WHERE sd.ServiceID = ? AND sd.IsDeleted = 0
    `;
    return query(sql, [serviceId]);
  },

  async createServiceDepartment(data) {
    const sql = `
      INSERT INTO ServiceDepartment (
        ServiceID, DepartmentID, IsPrimary, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.ServiceID,
      data.DepartmentID,
      data.IsPrimary !== undefined ? data.IsPrimary : 1,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async deleteServiceDepartment(id, userId) {
    const sql = `
      UPDATE ServiceDepartment SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceDepartmentID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  // ── Service SLA ──
  async findSLAByServiceId(serviceId) {
    const sql = `
      SELECT ss.*, sp.PolicyName, sp.Description,
        (SELECT MIN(TargetResponseMinutes) FROM SLAStage st WHERE st.SLAPolicyID = sp.SLAPolicyID AND st.IsDeleted = 0) AS TargetResponseTimeMinutes,
        (SELECT MIN(TargetResolutionMinutes) FROM SLAStage st WHERE st.SLAPolicyID = sp.SLAPolicyID AND st.IsDeleted = 0) AS TargetResolutionTimeMinutes
      FROM ServiceSLA ss
      JOIN SLAPolicy sp ON ss.SLAPolicyID = sp.SLAPolicyID
      WHERE ss.ServiceID = ? AND ss.IsDeleted = 0
    `;
    const rows = await query(sql, [serviceId]);
    return rows[0] || null;
  },

  async upsertSLA(data) {
    const existing = await this.findSLAByServiceId(data.ServiceID);
    if (existing) {
      const updateSql = `
        UPDATE ServiceSLA SET
          SLAPolicyID = COALESCE(?, SLAPolicyID),
          IsActive = COALESCE(?, IsActive),
          ModifiedBy = ?,
          ModifiedDate = CURRENT_TIMESTAMP(6)
        WHERE ServiceSLAID = ? AND IsDeleted = 0
      `;
      await query(updateSql, [data.SLAPolicyID ?? null, data.IsActive ?? null, data.CreatedBy || 1, existing.ServiceSLAID]);
      return this.findSLAByServiceId(data.ServiceID);
    }

    const insertSql = `
      INSERT INTO ServiceSLA (
        ServiceID, SLAPolicyID, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?)
    `;
    const result = await query(insertSql, [
      data.ServiceID,
      data.SLAPolicyID,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return this.findSLAByServiceId(data.ServiceID);
  },

  async deleteSLA(id, userId) {
    const sql = `
      UPDATE ServiceSLA SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceSLAID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  // ── Service Approval Rules ──
  async findApprovalRulesByServiceId(serviceId) {
    const sql = `
      SELECT sar.*
      FROM ServiceApprovalRule sar
      WHERE sar.ServiceID = ? AND sar.IsDeleted = 0
    `;
    return query(sql, [serviceId]);
  },

  async createApprovalRule(data) {
    const sql = `
      INSERT INTO ServiceApprovalRule (
        ServiceID, ApprovalRuleName, RequiredStagesCount, AutoApproveLimit, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.ServiceID,
      data.ApprovalRuleName,
      data.RequiredStagesCount || 1,
      data.AutoApproveLimit || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async deleteApprovalRule(id, userId) {
    const sql = `
      UPDATE ServiceApprovalRule SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ServiceApprovalRuleID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default serviceGovernanceRepository;

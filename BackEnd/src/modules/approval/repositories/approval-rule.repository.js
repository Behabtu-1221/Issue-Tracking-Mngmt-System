import { query } from '../../../database/connection.js';

export const approvalRuleRepository = {
  async findAllRules({ tenantId, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT ar.*, t.CompanyName AS TenantName
      FROM ApprovalRule ar
      LEFT JOIN Tenant t ON ar.TenantID = t.TenantID
      WHERE ar.IsDeleted = 0
    `;
    const params = [];

    if (tenantId) {
      sql += ` AND ar.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (search) {
      sql += ` AND (ar.RuleName LIKE ? OR ar.Description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY ar.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM ApprovalRule ar WHERE ar.IsDeleted = 0`;
    const countParams = [];
    if (tenantId) { countSql += ` AND ar.TenantID = ?`; countParams.push(Number(tenantId)); }
    const countRes = await query(countSql, countParams);

    return {
      rules: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findRuleById(id) {
    const sql = `
      SELECT ar.*, t.CompanyName AS TenantName
      FROM ApprovalRule ar
      LEFT JOIN Tenant t ON ar.TenantID = t.TenantID
      WHERE ar.ApprovalRuleID = ? AND ar.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async createRule(data) {
    const sql = `
      INSERT INTO ApprovalRule (
        TenantID, RuleName, Description, MinCost, MaxCost, CurrencyCode, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.TenantID || null,
      data.RuleName,
      data.Description || null,
      data.MinCost || 0.00,
      data.MaxCost ?? null,
      data.CurrencyCode || 'USD',
      data.CreatedBy || 1
    ]);
    return this.findRuleById(result.insertId);
  },

  async updateRule(id, data) {
    const sql = `
      UPDATE ApprovalRule SET
        RuleName = COALESCE(?, RuleName),
        Description = COALESCE(?, Description),
        MinCost = COALESCE(?, MinCost),
        MaxCost = COALESCE(?, MaxCost),
        CurrencyCode = COALESCE(?, CurrencyCode),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE ApprovalRuleID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.RuleName ?? null,
      data.Description ?? null,
      data.MinCost ?? null,
      data.MaxCost ?? null,
      data.CurrencyCode ?? null,
      data.IsActive ?? null,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findRuleById(id);
  },

  async softDeleteRule(id, userId) {
    const sql = `
      UPDATE ApprovalRule SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ApprovalRuleID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  // Approval Thresholds
  async findAllThresholds({ tenantId }) {
    let sql = `
      SELECT at.*, t.CompanyName AS TenantName
      FROM ApprovalThreshold at
      LEFT JOIN Tenant t ON at.TenantID = t.TenantID
      WHERE at.IsDeleted = 0
    `;
    const params = [];
    if (tenantId) {
      sql += ` AND at.TenantID = ?`;
      params.push(Number(tenantId));
    }
    sql += ` ORDER BY at.MinCost ASC`;
    return query(sql, params);
  },

  async createThreshold(data) {
    const sql = `
      INSERT INTO ApprovalThreshold (
        TenantID, MinCost, MaxCost, RequiredApprovalLevels, Description, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.TenantID || null,
      data.MinCost || 0.00,
      data.MaxCost ?? null,
      data.RequiredApprovalLevels || 1,
      data.Description || null,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  }
};

export default approvalRuleRepository;

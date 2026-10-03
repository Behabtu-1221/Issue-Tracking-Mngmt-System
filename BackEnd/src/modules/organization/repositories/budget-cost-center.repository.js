import { query } from '../../../database/connection.js';

export const budgetCostCenterRepository = {
  // ─── COST CENTERS ─────────────────────────────────────────────────────────

  async findAllCostCenters({ tenantId, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT cc.*,
        t.CompanyName AS TenantName,
        (SELECT COUNT(*) FROM DepartmentBudget db WHERE db.CostCenterID = cc.CostCenterID AND db.IsDeleted = 0) AS BudgetCount
      FROM CostCenter cc
      LEFT JOIN Tenant t ON cc.TenantID = t.TenantID
      WHERE cc.IsDeleted = 0
    `;
    const params = [];

    if (tenantId) {
      sql += ` AND cc.TenantID = ?`;
      params.push(Number(tenantId));
    }
    if (search) {
      sql += ` AND (cc.CostCenterName LIKE ? OR cc.CostCenterCode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY cc.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM CostCenter cc WHERE cc.IsDeleted = 0`;
    const countParams = [];
    if (tenantId) { countSql += ` AND cc.TenantID = ?`; countParams.push(Number(tenantId)); }
    if (search) {
      countSql += ` AND (cc.CostCenterName LIKE ? OR cc.CostCenterCode LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      costCenters: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findCostCenterById(id) {
    const sql = `
      SELECT cc.*, t.CompanyName AS TenantName
      FROM CostCenter cc
      LEFT JOIN Tenant t ON cc.TenantID = t.TenantID
      WHERE cc.CostCenterID = ? AND cc.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findCostCenterByCode(tenantId, code) {
    let sql = `SELECT * FROM CostCenter WHERE CostCenterCode = ? AND IsDeleted = 0`;
    const params = [code];
    if (tenantId) {
      sql += ` AND TenantID = ?`;
      params.push(tenantId);
    } else {
      sql += ` AND TenantID IS NULL`;
    }
    const rows = await query(sql, params);
    return rows[0] || null;
  },

  async createCostCenter(data) {
    const sql = `
      INSERT INTO CostCenter (
        TenantID, CostCenterCode, CostCenterName, Description, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.TenantID || null,
      data.CostCenterCode,
      data.CostCenterName,
      data.Description || null,
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async updateCostCenter(id, data) {
    const sql = `
      UPDATE CostCenter SET
        CostCenterName = COALESCE(?, CostCenterName),
        Description = COALESCE(?, Description),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE CostCenterID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.CostCenterName,
      data.Description,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findCostCenterById(id);
  },

  async deleteCostCenter(id, userId) {
    const sql = `
      UPDATE CostCenter SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE CostCenterID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  },

  // ─── DEPARTMENT BUDGETS ───────────────────────────────────────────────────

  async findAllBudgets({ departmentId, costCenterId, fiscalYear, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT db.*,
        d.DepartmentName,
        d.DepartmentCode,
        cc.CostCenterName,
        cc.CostCenterCode
      FROM DepartmentBudget db
      JOIN Department d ON db.DepartmentID = d.DepartmentID
      LEFT JOIN CostCenter cc ON db.CostCenterID = cc.CostCenterID
      WHERE db.IsDeleted = 0 AND d.IsDeleted = 0
    `;
    const params = [];

    if (departmentId) {
      sql += ` AND db.DepartmentID = ?`;
      params.push(Number(departmentId));
    }
    if (costCenterId) {
      sql += ` AND db.CostCenterID = ?`;
      params.push(Number(costCenterId));
    }
    if (fiscalYear) {
      sql += ` AND db.FiscalYear = ?`;
      params.push(Number(fiscalYear));
    }

    sql += ` ORDER BY db.FiscalYear DESC, db.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `
      SELECT COUNT(*) as total FROM DepartmentBudget db
      JOIN Department d ON db.DepartmentID = d.DepartmentID
      WHERE db.IsDeleted = 0 AND d.IsDeleted = 0
    `;
    const countParams = [];
    if (departmentId) { countSql += ` AND db.DepartmentID = ?`; countParams.push(Number(departmentId)); }
    if (costCenterId) { countSql += ` AND db.CostCenterID = ?`; countParams.push(Number(costCenterId)); }
    if (fiscalYear) { countSql += ` AND db.FiscalYear = ?`; countParams.push(Number(fiscalYear)); }
    const countRes = await query(countSql, countParams);

    return {
      budgets: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findBudgetById(id) {
    const sql = `
      SELECT db.*,
        d.DepartmentName,
        d.DepartmentCode,
        cc.CostCenterName,
        cc.CostCenterCode
      FROM DepartmentBudget db
      JOIN Department d ON db.DepartmentID = d.DepartmentID
      LEFT JOIN CostCenter cc ON db.CostCenterID = cc.CostCenterID
      WHERE db.DepartmentBudgetID = ? AND db.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async findBudgetByDeptAndYear(departmentId, fiscalYear) {
    const sql = `
      SELECT * FROM DepartmentBudget
      WHERE DepartmentID = ? AND FiscalYear = ? AND IsDeleted = 0
    `;
    const rows = await query(sql, [departmentId, fiscalYear]);
    return rows[0] || null;
  },

  async createBudget(data) {
    const sql = `
      INSERT INTO DepartmentBudget (
        DepartmentID, CostCenterID, FiscalYear, AllocatedAmount, RemainingAmount, CurrencyCode, IsActive, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.DepartmentID,
      data.CostCenterID || null,
      data.FiscalYear,
      data.AllocatedAmount,
      data.RemainingAmount !== undefined ? data.RemainingAmount : data.AllocatedAmount,
      data.CurrencyCode || 'ETB',
      data.IsActive !== undefined ? data.IsActive : 1,
      data.CreatedBy || 1
    ]);
    return result.insertId;
  },

  async updateBudget(id, data) {
    const sql = `
      UPDATE DepartmentBudget SET
        CostCenterID = COALESCE(?, CostCenterID),
        AllocatedAmount = COALESCE(?, AllocatedAmount),
        RemainingAmount = COALESCE(?, RemainingAmount),
        CurrencyCode = COALESCE(?, CurrencyCode),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE DepartmentBudgetID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.CostCenterID,
      data.AllocatedAmount,
      data.RemainingAmount,
      data.CurrencyCode,
      data.IsActive,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findBudgetById(id);
  },

  async deleteBudget(id, userId) {
    const sql = `
      UPDATE DepartmentBudget SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE DepartmentBudgetID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default budgetCostCenterRepository;

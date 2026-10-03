import db from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';
import { getPagination } from '../../../shared/utils/pagination.js';

class BusinessRuleRepository {
  async findAll({ page = 1, limit = 50, search = '', activeOnly = false }) {
    const conditions = ['IsDeleted = 0'];
    const params = [];

    if (activeOnly) conditions.push('IsActive = 1');
    if (search) {
      conditions.push('(RuleCode LIKE ? OR RuleName LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }

    const whereSql = conditions.join(' AND ');
    const { page: safePage, limit: safeLimit, clause } = getPagination(page, limit);

    const countRows = await db.query(`SELECT COUNT(*) AS total FROM BusinessRule WHERE ${whereSql}`, params);
    const rows = await db.query(
      `SELECT BusinessRuleID, RuleCode, RuleName, RuleExpression, IsActive,
              CreatedBy, CreatedDate, ModifiedBy, ModifiedDate
       FROM BusinessRule WHERE ${whereSql}
       ORDER BY RuleName ASC ${clause}`,
      params
    );

    return { items: rows, meta: { page: safePage, limit: safeLimit, total: countRows[0].total } };
  }

  async findById(id) {
    const rows = await db.query(
      `SELECT BusinessRuleID, RuleCode, RuleName, RuleExpression, IsActive,
              CreatedBy, CreatedDate, ModifiedBy, ModifiedDate
       FROM BusinessRule WHERE BusinessRuleID = ? AND IsDeleted = 0`,
      [id]
    );
    return rows[0] || null;
  }

  async findByCode(code) {
    const rows = await db.query(
      `SELECT BusinessRuleID, RuleCode, RuleName, RuleExpression, IsActive
       FROM BusinessRule WHERE RuleCode = ? AND IsDeleted = 0`,
      [code]
    );
    return rows[0] || null;
  }

  async codeExists(code, excludeId = null) {
    const params = [code];
    let sql = 'SELECT BusinessRuleID FROM BusinessRule WHERE RuleCode = ? AND IsDeleted = 0';
    if (excludeId) {
      sql += ' AND BusinessRuleID <> ?';
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async create(payload, userId) {
    const result = await db.query(
      `INSERT INTO BusinessRule (RuleCode, RuleName, RuleExpression, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?, ?)`,
      [payload.code, payload.name, payload.ruleExpression, payload.isActive === false ? 0 : 1, userId]
    );
    return this.findById(result.insertId);
  }

  async update(id, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.code !== undefined) { sets.push('RuleCode = ?'); values.push(payload.code); }
    if (payload.name !== undefined) { sets.push('RuleName = ?'); values.push(payload.name); }
    if (payload.ruleExpression !== undefined) { sets.push('RuleExpression = ?'); values.push(payload.ruleExpression); }
    if (payload.isActive !== undefined) { sets.push('IsActive = ?'); values.push(payload.isActive ? 1 : 0); }

    values.push(id);
    const result = await db.query(
      `UPDATE BusinessRule SET ${sets.join(', ')} WHERE BusinessRuleID = ? AND IsDeleted = 0`,
      values
    );
    if (result.affectedRows === 0) throw new AppError('Business rule not found', 404);
    return this.findById(id);
  }

  async softDelete(id, userId) {
    const result = await db.query(
      `UPDATE BusinessRule
       SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
           ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE BusinessRuleID = ? AND IsDeleted = 0`,
      [userId, userId, id]
    );
    if (result.affectedRows === 0) throw new AppError('Business rule not found', 404);
    return true;
  }
}

export default new BusinessRuleRepository();

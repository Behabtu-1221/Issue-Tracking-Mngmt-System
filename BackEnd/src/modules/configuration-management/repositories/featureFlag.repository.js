import db from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';
import { getPagination } from '../../../shared/utils/pagination.js';

class FeatureFlagRepository {
  async findAll({ page = 1, limit = 50, search = '', activeOnly = false, enabledOnly = false }) {
    const conditions = ['IsDeleted = 0'];
    const params = [];

    if (activeOnly) conditions.push('IsActive = 1');
    if (enabledOnly) conditions.push('IsEnabled = 1');
    if (search) {
      conditions.push('(FlagCode LIKE ? OR FlagName LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }

    const whereSql = conditions.join(' AND ');
    const { page: safePage, limit: safeLimit, clause } = getPagination(page, limit);

    const countRows = await db.query(`SELECT COUNT(*) AS total FROM FeatureFlag WHERE ${whereSql}`, params);
    const rows = await db.query(
      `SELECT FeatureFlagID, FlagCode, FlagName, IsEnabled, IsActive,
              CreatedBy, CreatedDate, ModifiedBy, ModifiedDate
       FROM FeatureFlag WHERE ${whereSql}
       ORDER BY FlagName ASC ${clause}`,
      params
    );

    return { items: rows, meta: { page: safePage, limit: safeLimit, total: countRows[0].total } };
  }

  async findById(id) {
    const rows = await db.query(
      `SELECT FeatureFlagID, FlagCode, FlagName, IsEnabled, IsActive,
              CreatedBy, CreatedDate, ModifiedBy, ModifiedDate
       FROM FeatureFlag WHERE FeatureFlagID = ? AND IsDeleted = 0`,
      [id]
    );
    return rows[0] || null;
  }

  async findByCode(code) {
    const rows = await db.query(
      `SELECT FeatureFlagID, FlagCode, FlagName, IsEnabled, IsActive
       FROM FeatureFlag WHERE FlagCode = ? AND IsDeleted = 0`,
      [code]
    );
    return rows[0] || null;
  }

  async codeExists(code, excludeId = null) {
    const params = [code];
    let sql = 'SELECT FeatureFlagID FROM FeatureFlag WHERE FlagCode = ? AND IsDeleted = 0';
    if (excludeId) {
      sql += ' AND FeatureFlagID <> ?';
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async create(payload, userId) {
    const result = await db.query(
      `INSERT INTO FeatureFlag (FlagCode, FlagName, IsEnabled, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?, ?)`,
      [payload.code, payload.name, payload.isEnabled ? 1 : 0, payload.isActive === false ? 0 : 1, userId]
    );
    return this.findById(result.insertId);
  }

  async update(id, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.code !== undefined) { sets.push('FlagCode = ?'); values.push(payload.code); }
    if (payload.name !== undefined) { sets.push('FlagName = ?'); values.push(payload.name); }
    if (payload.isEnabled !== undefined) { sets.push('IsEnabled = ?'); values.push(payload.isEnabled ? 1 : 0); }
    if (payload.isActive !== undefined) { sets.push('IsActive = ?'); values.push(payload.isActive ? 1 : 0); }

    values.push(id);
    const result = await db.query(
      `UPDATE FeatureFlag SET ${sets.join(', ')} WHERE FeatureFlagID = ? AND IsDeleted = 0`,
      values
    );
    if (result.affectedRows === 0) throw new AppError('Feature flag not found', 404);
    return this.findById(id);
  }

  async toggle(id, isEnabled, userId) {
    const result = await db.query(
      `UPDATE FeatureFlag
       SET IsEnabled = ?, ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE FeatureFlagID = ? AND IsDeleted = 0`,
      [isEnabled ? 1 : 0, userId, id]
    );
    if (result.affectedRows === 0) throw new AppError('Feature flag not found', 404);
    return this.findById(id);
  }

  async softDelete(id, userId) {
    const result = await db.query(
      `UPDATE FeatureFlag
       SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
           ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE FeatureFlagID = ? AND IsDeleted = 0`,
      [userId, userId, id]
    );
    if (result.affectedRows === 0) throw new AppError('Feature flag not found', 404);
    return true;
  }
}

export default new FeatureFlagRepository();

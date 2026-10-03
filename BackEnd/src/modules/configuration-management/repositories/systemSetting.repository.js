import db from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';
import { getPagination } from '../../../shared/utils/pagination.js';

class SystemSettingRepository {
  async findAll({ page = 1, limit = 50, search = '', categoryId = null, activeOnly = false }) {
    const conditions = ['ss.IsDeleted = 0'];
    const params = [];

    if (activeOnly) {
      conditions.push('ss.IsActive = 1');
    }

    if (categoryId) {
      conditions.push('ss.ConfigurationCategoryID = ?');
      params.push(categoryId);
    }

    if (search) {
      conditions.push('(ss.SettingKey LIKE ? OR ss.SettingValue LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }

    const whereSql = conditions.join(' AND ');
    const { page: safePage, limit: safeLimit, clause } = getPagination(page, limit);

    const countRows = await db.query(
      `SELECT COUNT(*) AS total FROM SystemSetting ss WHERE ${whereSql}`,
      params
    );

    const rows = await db.query(
      `SELECT ss.SystemSettingID, ss.ConfigurationCategoryID, cc.CategoryCode, cc.CategoryName,
              ss.SettingKey, ss.SettingValue, ss.DataType, ss.IsActive,
              ss.CreatedBy, ss.CreatedDate, ss.ModifiedBy, ss.ModifiedDate
       FROM SystemSetting ss
       INNER JOIN ConfigurationCategory cc ON cc.ConfigurationCategoryID = ss.ConfigurationCategoryID
       WHERE ${whereSql}
       ORDER BY ss.SettingKey ASC
       ${clause}`,
      params
    );

    return { items: rows, meta: { page: safePage, limit: safeLimit, total: countRows[0].total } };
  }

  async findById(id) {
    const rows = await db.query(
      `SELECT ss.SystemSettingID, ss.ConfigurationCategoryID, cc.CategoryCode, cc.CategoryName,
              ss.SettingKey, ss.SettingValue, ss.DataType, ss.IsActive,
              ss.CreatedBy, ss.CreatedDate, ss.ModifiedBy, ss.ModifiedDate
       FROM SystemSetting ss
       INNER JOIN ConfigurationCategory cc ON cc.ConfigurationCategoryID = ss.ConfigurationCategoryID
       WHERE ss.SystemSettingID = ? AND ss.IsDeleted = 0`,
      [id]
    );
    return rows[0] || null;
  }

  async findByKey(key) {
    const rows = await db.query(
      `SELECT ss.SystemSettingID, ss.ConfigurationCategoryID, ss.SettingKey,
              ss.SettingValue, ss.DataType, ss.IsActive
       FROM SystemSetting ss
       WHERE ss.SettingKey = ? AND ss.IsDeleted = 0`,
      [key]
    );
    return rows[0] || null;
  }

  async keyExists(key, excludeId = null) {
    const params = [key];
    let sql = 'SELECT SystemSettingID FROM SystemSetting WHERE SettingKey = ? AND IsDeleted = 0';
    if (excludeId) {
      sql += ' AND SystemSettingID <> ?';
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async categoryExists(categoryId) {
    const rows = await db.query(
      'SELECT ConfigurationCategoryID FROM ConfigurationCategory WHERE ConfigurationCategoryID = ? AND IsDeleted = 0',
      [categoryId]
    );
    return rows.length > 0;
  }

  async create(payload, userId) {
    const result = await db.query(
      `INSERT INTO SystemSetting
       (ConfigurationCategoryID, SettingKey, SettingValue, DataType, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payload.configurationCategoryId,
        payload.settingKey,
        payload.settingValue,
        payload.dataType,
        payload.isActive === false ? 0 : 1,
        userId
      ]
    );
    return this.findById(result.insertId);
  }

  async update(id, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.configurationCategoryId !== undefined) {
      sets.push('ConfigurationCategoryID = ?');
      values.push(payload.configurationCategoryId);
    }
    if (payload.settingKey !== undefined) {
      sets.push('SettingKey = ?');
      values.push(payload.settingKey);
    }
    if (payload.settingValue !== undefined) {
      sets.push('SettingValue = ?');
      values.push(payload.settingValue);
    }
    if (payload.dataType !== undefined) {
      sets.push('DataType = ?');
      values.push(payload.dataType);
    }
    if (payload.isActive !== undefined) {
      sets.push('IsActive = ?');
      values.push(payload.isActive ? 1 : 0);
    }

    values.push(id);

    const result = await db.query(
      `UPDATE SystemSetting SET ${sets.join(', ')} WHERE SystemSettingID = ? AND IsDeleted = 0`,
      values
    );

    if (result.affectedRows === 0) {
      throw new AppError('System setting not found', 404);
    }

    return this.findById(id);
  }

  async softDelete(id, userId) {
    const result = await db.query(
      `UPDATE SystemSetting
       SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
           ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE SystemSettingID = ? AND IsDeleted = 0`,
      [userId, userId, id]
    );

    if (result.affectedRows === 0) {
      throw new AppError('System setting not found', 404);
    }

    return true;
  }
}

export default new SystemSettingRepository();

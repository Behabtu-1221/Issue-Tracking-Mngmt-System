import db from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';
import { getPagination } from '../../../shared/utils/pagination.js';

class LocalizationRepository {
  async findAll({ page = 1, limit = 50, activeOnly = false }) {
    const conditions = ['IsDeleted = 0'];
    const params = [];
    if (activeOnly) conditions.push('IsActive = 1');

    const whereSql = conditions.join(' AND ');
    const { page: safePage, limit: safeLimit, clause } = getPagination(page, limit);

    const countRows = await db.query(`SELECT COUNT(*) AS total FROM Localization WHERE ${whereSql}`, params);
    const rows = await db.query(
      `SELECT LocalizationID, LanguageCode, CountryCode, LocaleName, IsActive,
              CreatedBy, CreatedDate, ModifiedBy, ModifiedDate
       FROM Localization WHERE ${whereSql}
       ORDER BY LocaleName ASC ${clause}`,
      params
    );

    return { items: rows, meta: { page: safePage, limit: safeLimit, total: countRows[0].total } };
  }

  async findById(id, includeResources = false) {
    const rows = await db.query(
      `SELECT LocalizationID, LanguageCode, CountryCode, LocaleName, IsActive,
              CreatedBy, CreatedDate, ModifiedBy, ModifiedDate
       FROM Localization WHERE LocalizationID = ? AND IsDeleted = 0`,
      [id]
    );
    const locale = rows[0] || null;
    if (locale && includeResources) {
      locale.resources = await this.findResourcesByLocaleId(id);
    }
    return locale;
  }

  async localeExists(languageCode, countryCode, excludeId = null) {
    const params = [languageCode, countryCode];
    let sql = 'SELECT LocalizationID FROM Localization WHERE LanguageCode = ? AND CountryCode = ? AND IsDeleted = 0';
    if (excludeId) {
      sql += ' AND LocalizationID <> ?';
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async create(payload, userId) {
    const result = await db.query(
      `INSERT INTO Localization (LanguageCode, CountryCode, LocaleName, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?, ?)`,
      [payload.languageCode, payload.countryCode, payload.localeName, payload.isActive === false ? 0 : 1, userId]
    );
    return this.findById(result.insertId);
  }

  async update(id, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.languageCode !== undefined) { sets.push('LanguageCode = ?'); values.push(payload.languageCode); }
    if (payload.countryCode !== undefined) { sets.push('CountryCode = ?'); values.push(payload.countryCode); }
    if (payload.localeName !== undefined) { sets.push('LocaleName = ?'); values.push(payload.localeName); }
    if (payload.isActive !== undefined) { sets.push('IsActive = ?'); values.push(payload.isActive ? 1 : 0); }

    values.push(id);
    const result = await db.query(
      `UPDATE Localization SET ${sets.join(', ')} WHERE LocalizationID = ? AND IsDeleted = 0`,
      values
    );
    if (result.affectedRows === 0) throw new AppError('Localization not found', 404);
    return this.findById(id);
  }

  async softDelete(id, userId) {
    const tx = await db.getTransaction();
    try {
      await tx.query(
        `UPDATE LanguageResource
         SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
             ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
         WHERE LocalizationID = ? AND IsDeleted = 0`,
        [userId, userId, id]
      );
      const result = await tx.query(
        `UPDATE Localization
         SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
             ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
         WHERE LocalizationID = ? AND IsDeleted = 0`,
        [userId, userId, id]
      );
      if (result.affectedRows === 0) throw new AppError('Localization not found', 404);
      await tx.commit();
      return true;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async findResourcesByLocaleId(localizationId) {
    return db.query(
      `SELECT LanguageResourceID, LocalizationID, ResourceKey, ResourceValue, IsActive
       FROM LanguageResource
       WHERE LocalizationID = ? AND IsDeleted = 0
       ORDER BY ResourceKey ASC`,
      [localizationId]
    );
  }

  async findResourceById(resourceId) {
    const rows = await db.query(
      `SELECT LanguageResourceID, LocalizationID, ResourceKey, ResourceValue, IsActive
       FROM LanguageResource WHERE LanguageResourceID = ? AND IsDeleted = 0`,
      [resourceId]
    );
    return rows[0] || null;
  }

  async resourceKeyExists(localizationId, resourceKey, excludeId = null) {
    const params = [localizationId, resourceKey];
    let sql = `SELECT LanguageResourceID FROM LanguageResource
               WHERE LocalizationID = ? AND ResourceKey = ? AND IsDeleted = 0`;
    if (excludeId) {
      sql += ' AND LanguageResourceID <> ?';
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async createResource(localizationId, payload, userId) {
    const result = await db.query(
      `INSERT INTO LanguageResource (LocalizationID, ResourceKey, ResourceValue, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?, ?)`,
      [localizationId, payload.resourceKey, payload.resourceValue, payload.isActive === false ? 0 : 1, userId]
    );
    return this.findResourceById(result.insertId);
  }

  async updateResource(resourceId, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.resourceKey !== undefined) { sets.push('ResourceKey = ?'); values.push(payload.resourceKey); }
    if (payload.resourceValue !== undefined) { sets.push('ResourceValue = ?'); values.push(payload.resourceValue); }
    if (payload.isActive !== undefined) { sets.push('IsActive = ?'); values.push(payload.isActive ? 1 : 0); }

    values.push(resourceId);
    const result = await db.query(
      `UPDATE LanguageResource SET ${sets.join(', ')} WHERE LanguageResourceID = ? AND IsDeleted = 0`,
      values
    );
    if (result.affectedRows === 0) throw new AppError('Language resource not found', 404);
    return this.findResourceById(resourceId);
  }

  async softDeleteResource(resourceId, userId) {
    const result = await db.query(
      `UPDATE LanguageResource
       SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
           ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE LanguageResourceID = ? AND IsDeleted = 0`,
      [userId, userId, resourceId]
    );
    if (result.affectedRows === 0) throw new AppError('Language resource not found', 404);
    return true;
  }
}

export default new LocalizationRepository();

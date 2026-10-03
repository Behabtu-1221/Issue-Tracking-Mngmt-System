import db from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';

class LookupTypeRepository {
  async findAll({ page = 1, limit = 50, search = '', activeOnly = false }) {
    const conditions = ['lt.IsDeleted = 0'];
    const params = [];

    if (activeOnly) {
      conditions.push('lt.IsActive = 1');
    }

    if (search) {
      conditions.push('(lt.LookupTypeCode LIKE ? OR lt.LookupTypeName LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }

    const whereSql = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    const countRows = await db.query(
      `SELECT COUNT(*) AS total FROM LookupType lt WHERE ${whereSql}`,
      params
    );

    const rows = await db.query(
      `SELECT lt.LookupTypeID, lt.LookupTypeCode, lt.LookupTypeName,
              lt.IsActive, lt.CreatedBy, lt.CreatedDate, lt.ModifiedBy, lt.ModifiedDate,
              COUNT(lv.LookupValueID) AS valueCount
       FROM LookupType lt
       LEFT JOIN LookupValue lv ON lv.LookupTypeID = lt.LookupTypeID AND lv.IsDeleted = 0
       WHERE ${whereSql}
       GROUP BY lt.LookupTypeID
       ORDER BY lt.LookupTypeName ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows,
      meta: { page, limit, total: countRows[0].total }
    };
  }

  async findById(id, includeValues = false) {
    const rows = await db.query(
      `SELECT LookupTypeID, LookupTypeCode, LookupTypeName, IsActive,
              CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, RowVersion
       FROM LookupType
       WHERE LookupTypeID = ? AND IsDeleted = 0`,
      [id]
    );

    const lookupType = rows[0] || null;
    if (!lookupType || !includeValues) {
      return lookupType;
    }

    lookupType.values = await this.findValuesByTypeId(id);
    return lookupType;
  }

  async findByCode(code) {
    const rows = await db.query(
      `SELECT LookupTypeID, LookupTypeCode, LookupTypeName, IsActive,
              CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, RowVersion
       FROM LookupType
       WHERE LookupTypeCode = ? AND IsDeleted = 0`,
      [code]
    );
    return rows[0] || null;
  }

  async codeExists(code, excludeId = null) {
    const params = [code];
    let sql = 'SELECT LookupTypeID FROM LookupType WHERE LookupTypeCode = ? AND IsDeleted = 0';

    if (excludeId) {
      sql += ' AND LookupTypeID <> ?';
      params.push(excludeId);
    }

    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async create({ code, name, isActive = true }, userId) {
    const result = await db.query(
      `INSERT INTO LookupType (LookupTypeCode, LookupTypeName, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?)`,
      [code, name, isActive ? 1 : 0, userId]
    );
    return this.findById(result.insertId);
  }

  async update(id, { code, name, isActive }, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (code !== undefined) {
      sets.push('LookupTypeCode = ?');
      values.push(code);
    }
    if (name !== undefined) {
      sets.push('LookupTypeName = ?');
      values.push(name);
    }
    if (isActive !== undefined) {
      sets.push('IsActive = ?');
      values.push(isActive ? 1 : 0);
    }

    values.push(id);

    const result = await db.query(
      `UPDATE LookupType SET ${sets.join(', ')} WHERE LookupTypeID = ? AND IsDeleted = 0`,
      values
    );

    if (result.affectedRows === 0) {
      throw new AppError('Lookup type not found', 404);
    }

    return this.findById(id);
  }

  async softDelete(id, userId) {
    const tx = await db.getTransaction();
    try {
      await tx.query(
        `UPDATE LookupValue
         SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
             ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
         WHERE LookupTypeID = ? AND IsDeleted = 0`,
        [userId, userId, id]
      );

      const result = await tx.query(
        `UPDATE LookupType
         SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
             ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
         WHERE LookupTypeID = ? AND IsDeleted = 0`,
        [userId, userId, id]
      );

      if (result.affectedRows === 0) {
        throw new AppError('Lookup type not found', 404);
      }

      await tx.commit();
      return true;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async findValuesByTypeId(lookupTypeId, activeOnly = false) {
    const conditions = ['LookupTypeID = ?', 'IsDeleted = 0'];
    const params = [lookupTypeId];

    if (activeOnly) {
      conditions.push('IsActive = 1');
    }

    return db.query(
      `SELECT LookupValueID, LookupTypeID, LookupValueCode, LookupValueName,
              DisplayOrder, IsActive, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate
       FROM LookupValue
       WHERE ${conditions.join(' AND ')}
       ORDER BY DisplayOrder ASC, LookupValueName ASC`,
      params
    );
  }

  async findValueById(valueId) {
    const rows = await db.query(
      `SELECT LookupValueID, LookupTypeID, LookupValueCode, LookupValueName,
              DisplayOrder, IsActive, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate
       FROM LookupValue
       WHERE LookupValueID = ? AND IsDeleted = 0`,
      [valueId]
    );
    return rows[0] || null;
  }

  async valueCodeExists(lookupTypeId, code, excludeId = null) {
    const params = [lookupTypeId, code];
    let sql = `SELECT LookupValueID FROM LookupValue
               WHERE LookupTypeID = ? AND LookupValueCode = ? AND IsDeleted = 0`;

    if (excludeId) {
      sql += ' AND LookupValueID <> ?';
      params.push(excludeId);
    }

    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async createValue(lookupTypeId, payload, userId) {
    const result = await db.query(
      `INSERT INTO LookupValue
       (LookupTypeID, LookupValueCode, LookupValueName, DisplayOrder, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        lookupTypeId,
        payload.code,
        payload.name,
        payload.displayOrder ?? 0,
        payload.isActive === false ? 0 : 1,
        userId
      ]
    );
    return this.findValueById(result.insertId);
  }

  async updateValue(valueId, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.code !== undefined) {
      sets.push('LookupValueCode = ?');
      values.push(payload.code);
    }
    if (payload.name !== undefined) {
      sets.push('LookupValueName = ?');
      values.push(payload.name);
    }
    if (payload.displayOrder !== undefined) {
      sets.push('DisplayOrder = ?');
      values.push(payload.displayOrder);
    }
    if (payload.isActive !== undefined) {
      sets.push('IsActive = ?');
      values.push(payload.isActive ? 1 : 0);
    }

    values.push(valueId);

    const result = await db.query(
      `UPDATE LookupValue SET ${sets.join(', ')} WHERE LookupValueID = ? AND IsDeleted = 0`,
      values
    );

    if (result.affectedRows === 0) {
      throw new AppError('Lookup value not found', 404);
    }

    return this.findValueById(valueId);
  }

  async softDeleteValue(valueId, userId) {
    const result = await db.query(
      `UPDATE LookupValue
       SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
           ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE LookupValueID = ? AND IsDeleted = 0`,
      [userId, userId, valueId]
    );

    if (result.affectedRows === 0) {
      throw new AppError('Lookup value not found', 404);
    }

    return true;
  }
}

export default new LookupTypeRepository();

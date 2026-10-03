import db from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';
import { getPagination } from '../../../shared/utils/pagination.js';

class NumberSequenceRepository {
  async findAll({ page = 1, limit = 50, search = '', activeOnly = false }) {
    const conditions = ['IsDeleted = 0'];
    const params = [];

    if (activeOnly) conditions.push('IsActive = 1');
    if (search) {
      conditions.push('SequenceCode LIKE ?');
      params.push(`%${search}%`);
    }

    const whereSql = conditions.join(' AND ');
    const { page: safePage, limit: safeLimit, clause } = getPagination(page, limit);

    const countRows = await db.query(`SELECT COUNT(*) AS total FROM NumberSequence WHERE ${whereSql}`, params);
    const rows = await db.query(
      `SELECT NumberSequenceID, SequenceCode, Prefix, Suffix, NextNumber,
              IncrementValue, NumberWidth, IsActive, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate
       FROM NumberSequence WHERE ${whereSql}
       ORDER BY SequenceCode ASC ${clause}`,
      params
    );

    return { items: rows, meta: { page: safePage, limit: safeLimit, total: countRows[0].total } };
  }

  async findById(id) {
    const rows = await db.query(
      `SELECT NumberSequenceID, SequenceCode, Prefix, Suffix, NextNumber,
              IncrementValue, NumberWidth, IsActive, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate
       FROM NumberSequence WHERE NumberSequenceID = ? AND IsDeleted = 0`,
      [id]
    );
    return rows[0] || null;
  }

  async findByCode(code, forUpdate = false) {
    const lock = forUpdate ? 'FOR UPDATE' : '';
    const rows = await db.query(
      `SELECT NumberSequenceID, SequenceCode, Prefix, Suffix, NextNumber,
              IncrementValue, NumberWidth, IsActive
       FROM NumberSequence
       WHERE SequenceCode = ? AND IsDeleted = 0 AND IsActive = 1
       ${lock}`,
      [code]
    );
    return rows[0] || null;
  }

  async codeExists(code, excludeId = null) {
    const params = [code];
    let sql = 'SELECT NumberSequenceID FROM NumberSequence WHERE SequenceCode = ? AND IsDeleted = 0';
    if (excludeId) {
      sql += ' AND NumberSequenceID <> ?';
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  formatNumber(sequence) {
    const numericPart = String(sequence.NextNumber).padStart(sequence.NumberWidth, '0');
    return `${sequence.Prefix || ''}${numericPart}${sequence.Suffix || ''}`;
  }

  async create(payload, userId) {
    const result = await db.query(
      `INSERT INTO NumberSequence
       (SequenceCode, Prefix, Suffix, NextNumber, IncrementValue, NumberWidth, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.code,
        payload.prefix || null,
        payload.suffix || null,
        payload.nextNumber ?? 1,
        payload.incrementValue ?? 1,
        payload.numberWidth ?? 6,
        payload.isActive === false ? 0 : 1,
        userId
      ]
    );
    return this.findById(result.insertId);
  }

  async update(id, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.code !== undefined) { sets.push('SequenceCode = ?'); values.push(payload.code); }
    if (payload.prefix !== undefined) { sets.push('Prefix = ?'); values.push(payload.prefix); }
    if (payload.suffix !== undefined) { sets.push('Suffix = ?'); values.push(payload.suffix); }
    if (payload.nextNumber !== undefined) { sets.push('NextNumber = ?'); values.push(payload.nextNumber); }
    if (payload.incrementValue !== undefined) { sets.push('IncrementValue = ?'); values.push(payload.incrementValue); }
    if (payload.numberWidth !== undefined) { sets.push('NumberWidth = ?'); values.push(payload.numberWidth); }
    if (payload.isActive !== undefined) { sets.push('IsActive = ?'); values.push(payload.isActive ? 1 : 0); }

    values.push(id);
    const result = await db.query(
      `UPDATE NumberSequence SET ${sets.join(', ')} WHERE NumberSequenceID = ? AND IsDeleted = 0`,
      values
    );
    if (result.affectedRows === 0) throw new AppError('Number sequence not found', 404);
    return this.findById(id);
  }

  async generateNext(code) {
    const tx = await db.getTransaction();
    try {
      const [sequence] = await tx.query(
        `SELECT NumberSequenceID, SequenceCode, Prefix, Suffix, NextNumber, IncrementValue, NumberWidth
         FROM NumberSequence
         WHERE SequenceCode = ? AND IsDeleted = 0 AND IsActive = 1
         FOR UPDATE`,
        [code]
      );

      if (!sequence) {
        throw new AppError(`Number sequence '${code}' not found or inactive`, 404);
      }

      const generatedNumber = this.formatNumber(sequence);

      await tx.query(
        `UPDATE NumberSequence
         SET NextNumber = NextNumber + ?,
             ModifiedDate = CURRENT_TIMESTAMP(6)
         WHERE NumberSequenceID = ?`,
        [sequence.IncrementValue, sequence.NumberSequenceID]
      );

      await tx.commit();

      return {
        sequenceCode: sequence.SequenceCode,
        generatedNumber,
        numericValue: sequence.NextNumber
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async softDelete(id, userId) {
    const result = await db.query(
      `UPDATE NumberSequence
       SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
           ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE NumberSequenceID = ? AND IsDeleted = 0`,
      [userId, userId, id]
    );
    if (result.affectedRows === 0) throw new AppError('Number sequence not found', 404);
    return true;
  }
}

export default new NumberSequenceRepository();

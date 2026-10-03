import db from '../../database/connection.js';
import AppError from '../errors/AppError.js';
import { getPagination } from '../utils/pagination.js';

class BaseLookupRepository {
  constructor(config) {
    this.table = config.table;
    this.idColumn = config.idColumn;
    this.codeColumn = config.codeColumn;
    this.nameColumn = config.nameColumn;
    this.optionalFields = config.optionalFields || [];
    this.requiredFields = config.requiredFields || [];
  }

  buildSelectClause() {
    const columns = [
      this.idColumn,
      this.codeColumn,
      this.nameColumn,
      ...this.optionalFields,
      ...this.requiredFields,
      'IsActive',
      'CreatedBy',
      'CreatedDate',
      'ModifiedBy',
      'ModifiedDate',
      'RowVersion'
    ];
    return columns.join(', ');
  }

  buildWhereClause(filters = {}) {
    const conditions = ['IsDeleted = 0'];
    const params = [];

    if (filters.activeOnly) {
      conditions.push('IsActive = 1');
    }

    if (filters.search) {
      conditions.push(`(${this.codeColumn} LIKE ? OR ${this.nameColumn} LIKE ?)`);
      const term = `%${filters.search}%`;
      params.push(term, term);
    }

    return { whereSql: conditions.join(' AND '), params };
  }

  async findAll(filters = {}) {
    const { whereSql, params } = this.buildWhereClause(filters);
    const { page, limit, clause } = getPagination(filters.page, filters.limit);

    const countRows = await db.query(
      `SELECT COUNT(*) AS total FROM ${this.table} WHERE ${whereSql}`,
      params
    );

    const rows = await db.query(
      `SELECT ${this.buildSelectClause()}
       FROM ${this.table}
       WHERE ${whereSql}
       ORDER BY ${this.nameColumn} ASC
       ${clause}`,
      params
    );

    return {
      items: rows,
      meta: {
        page,
        limit,
        total: countRows[0].total
      }
    };
  }

  async findById(id) {
    const rows = await db.query(
      `SELECT ${this.buildSelectClause()}
       FROM ${this.table}
       WHERE ${this.idColumn} = ? AND IsDeleted = 0`,
      [id]
    );
    return rows[0] || null;
  }

  async findByCode(code) {
    const rows = await db.query(
      `SELECT ${this.buildSelectClause()}
       FROM ${this.table}
       WHERE ${this.codeColumn} = ? AND IsDeleted = 0`,
      [code]
    );
    return rows[0] || null;
  }

  async codeExists(code, excludeId = null) {
    const params = [code];
    let sql = `SELECT ${this.idColumn} FROM ${this.table} WHERE ${this.codeColumn} = ? AND IsDeleted = 0`;

    if (excludeId) {
      sql += ` AND ${this.idColumn} <> ?`;
      params.push(excludeId);
    }

    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async create(payload, userId) {
    const columns = [this.codeColumn, this.nameColumn, ...this.optionalFields, ...this.requiredFields, 'CreatedBy'];
    const placeholders = columns.map(() => '?').join(', ');
    const values = [
      payload.code,
      payload.name,
      ...this.optionalFields.map((field) => payload[this.toCamelCase(field)] ?? null),
      ...this.requiredFields.map((field) => payload[this.toCamelCase(field)]),
      userId
    ];

    if (payload.isActive !== undefined) {
      columns.push('IsActive');
      values.push(payload.isActive ? 1 : 0);
    }

    const result = await db.query(
      `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    return this.findById(result.insertId);
  }

  async update(id, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.code !== undefined) {
      sets.push(`${this.codeColumn} = ?`);
      values.push(payload.code);
    }

    if (payload.name !== undefined) {
      sets.push(`${this.nameColumn} = ?`);
      values.push(payload.name);
    }

    for (const field of [...this.optionalFields, ...this.requiredFields]) {
      const key = this.toCamelCase(field);
      if (payload[key] !== undefined) {
        sets.push(`${field} = ?`);
        values.push(payload[key]);
      }
    }

    if (payload.isActive !== undefined) {
      sets.push('IsActive = ?');
      values.push(payload.isActive ? 1 : 0);
    }

    values.push(id);

    const result = await db.query(
      `UPDATE ${this.table}
       SET ${sets.join(', ')}
       WHERE ${this.idColumn} = ? AND IsDeleted = 0`,
      values
    );

    if (result.affectedRows === 0) {
      throw new AppError(`${this.table} record not found`, 404);
    }

    return this.findById(id);
  }

  async softDelete(id, userId) {
    const result = await db.query(
      `UPDATE ${this.table}
       SET IsDeleted = 1,
           DeletedBy = ?,
           DeletedDate = CURRENT_TIMESTAMP(6),
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE ${this.idColumn} = ? AND IsDeleted = 0`,
      [userId, userId, id]
    );

    if (result.affectedRows === 0) {
      throw new AppError(`${this.table} record not found`, 404);
    }

    return true;
  }

  toCamelCase(columnName) {
    return columnName.charAt(0).toLowerCase() + columnName.slice(1);
  }
}

export default BaseLookupRepository;

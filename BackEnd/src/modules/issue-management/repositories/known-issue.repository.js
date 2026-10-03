import { query } from '../../../database/connection.js';

export const knownIssueRepository = {
  async findAll({ categoryCode, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `SELECT * FROM KnownIssue WHERE IsDeleted = 0`;
    const params = [];

    if (categoryCode) {
      sql += ` AND CategoryCode = ?`;
      params.push(categoryCode);
    }
    if (search) {
      sql += ` AND (Title LIKE ? OR Symptoms LIKE ? OR SearchKeywords LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY CreatedDate DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM KnownIssue WHERE IsDeleted = 0`;
    const countParams = [];
    if (categoryCode) { countSql += ` AND CategoryCode = ?`; countParams.push(categoryCode); }
    if (search) {
      countSql += ` AND (Title LIKE ? OR Symptoms LIKE ? OR SearchKeywords LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const countRes = await query(countSql, countParams);

    return {
      knownIssues: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `SELECT * FROM KnownIssue WHERE KnownIssueID = ? AND IsDeleted = 0`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO KnownIssue (
        Title, Symptoms, Workaround, PermanentSolution, CategoryCode, SearchKeywords, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.Title,
      data.Symptoms,
      data.Workaround ?? null,
      data.PermanentSolution ?? null,
      data.CategoryCode || 'GENERAL',
      data.SearchKeywords ?? null,
      data.CreatedBy || 1
    ]);
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const sql = `
      UPDATE KnownIssue SET
        Title = COALESCE(?, Title),
        Symptoms = COALESCE(?, Symptoms),
        Workaround = COALESCE(?, Workaround),
        PermanentSolution = COALESCE(?, PermanentSolution),
        CategoryCode = COALESCE(?, CategoryCode),
        SearchKeywords = COALESCE(?, SearchKeywords),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE KnownIssueID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.Title ?? null,
      data.Symptoms ?? null,
      data.Workaround ?? null,
      data.PermanentSolution ?? null,
      data.CategoryCode ?? null,
      data.SearchKeywords ?? null,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE KnownIssue SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE KnownIssueID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default knownIssueRepository;

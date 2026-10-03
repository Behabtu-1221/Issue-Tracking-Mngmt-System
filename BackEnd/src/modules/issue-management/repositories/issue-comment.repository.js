import { query } from '../../../database/connection.js';

export const issueCommentRepository = {
  async findByIssueRequestId(issueRequestId, includeInternal = true) {
    let sql = `
      SELECT c.*, CONCAT(u.FirstName, ' ', u.LastName) AS AuthorName, u.Email AS AuthorEmail
      FROM IssueRequestComment c
      JOIN \`User\` u ON c.UserID = u.UserID
      WHERE c.IssueRequestID = ? AND c.IsDeleted = 0
    `;
    const params = [issueRequestId];

    if (!includeInternal) {
      sql += ` AND c.IsInternal = 0`;
    }
    sql += ` ORDER BY c.CreatedDate ASC`;

    return query(sql, params);
  },

  async findById(id) {
    const sql = `
      SELECT c.*, CONCAT(u.FirstName, ' ', u.LastName) AS AuthorName, u.Email AS AuthorEmail
      FROM IssueRequestComment c
      JOIN \`User\` u ON c.UserID = u.UserID
      WHERE c.IssueRequestCommentID = ? AND c.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO IssueRequestComment (
        IssueRequestID, UserID, CommentText, IsInternal, CreatedBy
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.IssueRequestID,
      data.UserID,
      data.CommentText,
      data.IsInternal ? 1 : 0,
      data.CreatedBy || data.UserID || 1
    ]);
    return this.findById(result.insertId);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE IssueRequestComment SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE IssueRequestCommentID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default issueCommentRepository;

import { query } from '../../../database/connection.js';

export const issueHistoryRepository = {
  async findByIssueRequestId(issueRequestId) {
    const sql = `
      SELECT h.*, CONCAT(u.FirstName, ' ', u.LastName) AS PerformedByName, u.Email AS PerformedByEmail
      FROM IssueRequestHistory h
      JOIN \`User\` u ON h.UserID = u.UserID
      WHERE h.IssueRequestID = ? AND h.IsDeleted = 0
      ORDER BY h.ActionDateTime ASC, h.IssueRequestHistoryID ASC
    `;
    return query(sql, [issueRequestId]);
  },

  async create(data) {
    const sql = `
      INSERT INTO IssueRequestHistory (
        IssueRequestID, UserID, FieldName, OldValue, NewValue, ActionTypeCode, Remarks, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.IssueRequestID,
      data.UserID || 1,
      data.FieldName ?? null,
      data.OldValue ?? null,
      data.NewValue ?? null,
      data.ActionTypeCode || 'DETAILS_MODIFIED',
      data.Remarks ?? null,
      data.CreatedBy || data.UserID || 1
    ]);
    return result.insertId;
  }
};

export default issueHistoryRepository;

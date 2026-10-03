import { query } from '../../../database/connection.js';

export const approvalHistoryRepository = {
  async findByApprovalId(approvalId) {
    const sql = `
      SELECT h.*, CONCAT(u.FirstName, ' ', u.LastName) AS PerformedByName, u.Email AS PerformedByEmail
      FROM ApprovalHistory h
      JOIN \`User\` u ON h.UserID = u.UserID
      WHERE h.ApprovalID = ? AND h.IsDeleted = 0
      ORDER BY h.CreatedDate ASC
    `;
    return query(sql, [approvalId]);
  },

  async create(data, tx = null) {
    const sql = `
      INSERT INTO ApprovalHistory (
        ApprovalID, UserID, ActionTypeCode, Remarks, CreatedBy
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.ApprovalID,
      data.UserID,
      data.ActionTypeCode,
      data.Remarks || null,
      data.CreatedBy || data.UserID
    ];
    const runner = (tx && typeof tx.query === 'function') ? tx.query.bind(tx) : query;
    const result = await runner(sql, params);
    return result.insertId;
  }
};

export default approvalHistoryRepository;

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

  async create(data) {
    const sql = `
      INSERT INTO ApprovalHistory (
        ApprovalID, UserID, ActionTypeCode, Remarks, CreatedBy
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.ApprovalID,
      data.UserID,
      data.ActionTypeCode,
      data.Remarks || null,
      data.CreatedBy || data.UserID
    ]);
    return result.insertId;
  }
};

export default approvalHistoryRepository;

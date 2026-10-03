import { query } from '../../../database/connection.js';

export const issueResolutionRepository = {
  async findByIssueRequestId(issueRequestId) {
    const sql = `
      SELECT res.*, CONCAT(u.FirstName, ' ', u.LastName) AS ResolverName, u.Email AS ResolverEmail
      FROM Resolution res
      LEFT JOIN \`User\` u ON res.ResolverUserID = u.UserID
      WHERE res.IssueRequestID = ? AND res.IsDeleted = 0
    `;
    const rows = await query(sql, [issueRequestId]);
    return rows;
  },

  async findById(id) {
    const sql = `
      SELECT res.*, CONCAT(u.FirstName, ' ', u.LastName) AS ResolverName, u.Email AS ResolverEmail
      FROM Resolution res
      LEFT JOIN \`User\` u ON res.ResolverUserID = u.UserID
      WHERE res.ResolutionID = ? AND res.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async upsert(data) {
    const allExisting = await this.findByIssueRequestId(data.IssueRequestID);
    const existing = allExisting[0] || null;
    if (existing) {
      const updateSql = `
        UPDATE Resolution SET
          ResolverUserID = COALESCE(?, ResolverUserID),
          ResolutionTypeCode = COALESCE(?, ResolutionTypeCode),
          ResolutionSummary = COALESCE(?, ResolutionSummary),
          ActionStepsTaken = COALESCE(?, ActionStepsTaken),
          VerificationNotes = COALESCE(?, VerificationNotes),
          ModifiedBy = ?,
          ModifiedDate = CURRENT_TIMESTAMP(6)
        WHERE ResolutionID = ? AND IsDeleted = 0
      `;
      await query(updateSql, [
        data.ResolverUserID ?? null,
        data.ResolutionTypeCode ?? null,
        data.ResolutionSummary ?? null,
        data.ActionStepsTaken ?? null,
        data.VerificationNotes ?? null,
        data.CreatedBy || 1,
        existing.ResolutionID
      ]);
      return this.findById(existing.ResolutionID);
    }

    const insertSql = `
      INSERT INTO Resolution (
        IssueRequestID, ResolverUserID, ResolutionTypeCode, ResolutionSummary,
        ActionStepsTaken, VerificationNotes, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(insertSql, [
      data.IssueRequestID,
      data.ResolverUserID ?? null,
      data.ResolutionTypeCode || 'PERMANENT_FIX',
      data.ResolutionSummary,
      data.ActionStepsTaken ?? null,
      data.VerificationNotes ?? null,
      data.CreatedBy || 1
    ]);
    return this.findById(result.insertId);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE Resolution SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ResolutionID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default issueResolutionRepository;

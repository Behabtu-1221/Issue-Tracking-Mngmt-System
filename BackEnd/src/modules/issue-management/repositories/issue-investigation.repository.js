import { query } from '../../../database/connection.js';

export const issueInvestigationRepository = {
  async findByIssueRequestId(issueRequestId) {
    const sql = `
      SELECT rc.*, CONCAT(u.FirstName, ' ', u.LastName) AS InvestigatorName, u.Email AS InvestigatorEmail
      FROM RootCause rc
      LEFT JOIN \`User\` u ON rc.InvestigatorUserID = u.UserID
      WHERE rc.IssueRequestID = ? AND rc.IsDeleted = 0
    `;
    const rows = await query(sql, [issueRequestId]);
    return rows;
  },

  async findById(id) {
    const sql = `
      SELECT rc.*, CONCAT(u.FirstName, ' ', u.LastName) AS InvestigatorName, u.Email AS InvestigatorEmail
      FROM RootCause rc
      LEFT JOIN \`User\` u ON rc.InvestigatorUserID = u.UserID
      WHERE rc.RootCauseID = ? AND rc.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async upsert(data) {
    const allExisting = await this.findByIssueRequestId(data.IssueRequestID);
    const existing = allExisting[0] || null;
    if (existing) {
      const updateSql = `
        UPDATE RootCause SET
          InvestigatorUserID = COALESCE(?, InvestigatorUserID),
          RootCauseSummary = COALESCE(?, RootCauseSummary),
          RootCauseDetails = COALESCE(?, RootCauseDetails),
          CorrectiveActionsTaken = COALESCE(?, CorrectiveActionsTaken),
          PreventiveActionsProposed = COALESCE(?, PreventiveActionsProposed),
          ModifiedBy = ?,
          ModifiedDate = CURRENT_TIMESTAMP(6)
        WHERE RootCauseID = ? AND IsDeleted = 0
      `;
      await query(updateSql, [
        data.InvestigatorUserID ?? null,
        data.RootCauseSummary ?? null,
        data.RootCauseDetails ?? null,
        data.CorrectiveActionsTaken ?? null,
        data.PreventiveActionsProposed ?? null,
        data.CreatedBy || 1,
        existing.RootCauseID
      ]);
      return this.findById(existing.RootCauseID);
    }

    const insertSql = `
      INSERT INTO RootCause (
        IssueRequestID, InvestigatorUserID, RootCauseSummary, RootCauseDetails,
        CorrectiveActionsTaken, PreventiveActionsProposed, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(insertSql, [
      data.IssueRequestID,
      data.InvestigatorUserID ?? null,
      data.RootCauseSummary,
      data.RootCauseDetails ?? null,
      data.CorrectiveActionsTaken ?? null,
      data.PreventiveActionsProposed ?? null,
      data.CreatedBy || 1
    ]);
    return this.findById(result.insertId);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE RootCause SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE RootCauseID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default issueInvestigationRepository;

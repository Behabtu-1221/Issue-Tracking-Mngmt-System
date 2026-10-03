import { query } from '../../../database/connection.js';

export const approvalDelegationRepository = {
  async findAll({ delegatorUserId, delegateeUserId, search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT ad.*,
        CONCAT(du.FirstName, ' ', du.LastName) AS DelegatorName,
        du.Email AS DelegatorEmail,
        CONCAT(de.FirstName, ' ', de.LastName) AS DelegateeName,
        de.Email AS DelegateeEmail
      FROM ApprovalDelegation ad
      JOIN \`User\` du ON ad.DelegatorUserID = du.UserID
      JOIN \`User\` de ON ad.DelegateeUserID = de.UserID
      WHERE ad.IsDeleted = 0
    `;
    const params = [];

    if (delegatorUserId) {
      sql += ` AND ad.DelegatorUserID = ?`;
      params.push(Number(delegatorUserId));
    }
    if (delegateeUserId) {
      sql += ` AND ad.DelegateeUserID = ?`;
      params.push(Number(delegateeUserId));
    }
    if (search) {
      sql += ` AND (ad.Reason LIKE ? OR du.FirstName LIKE ? OR de.FirstName LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY ad.CreatedDate DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const rows = await query(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM ApprovalDelegation ad WHERE ad.IsDeleted = 0`;
    const countParams = [];
    if (delegatorUserId) { countSql += ` AND ad.DelegatorUserID = ?`; countParams.push(Number(delegatorUserId)); }
    if (delegateeUserId) { countSql += ` AND ad.DelegateeUserID = ?`; countParams.push(Number(delegateeUserId)); }
    const countRes = await query(countSql, countParams);

    return {
      delegations: rows,
      total: countRes[0]?.total || 0,
      page: Number(page),
      limit: Number(limit)
    };
  },

  async findById(id) {
    const sql = `
      SELECT ad.*,
        CONCAT(du.FirstName, ' ', du.LastName) AS DelegatorName,
        du.Email AS DelegatorEmail,
        CONCAT(de.FirstName, ' ', de.LastName) AS DelegateeName,
        de.Email AS DelegateeEmail
      FROM ApprovalDelegation ad
      JOIN \`User\` du ON ad.DelegatorUserID = du.UserID
      JOIN \`User\` de ON ad.DelegateeUserID = de.UserID
      WHERE ad.ApprovalDelegationID = ? AND ad.IsDeleted = 0
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  },

  async isUserDelegated(delegatorId, delegateeId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM ApprovalDelegation
      WHERE DelegatorUserID = ?
        AND DelegateeUserID = ?
        AND NOW(6) BETWEEN StartDateTime AND EndDateTime
        AND IsActive = 1 AND IsDeleted = 0
    `;
    const rows = await query(sql, [delegatorId, delegateeId]);
    return (rows[0]?.count || 0) > 0;
  },

  async create(data) {
    const sql = `
      INSERT INTO ApprovalDelegation (
        DelegatorUserID, DelegateeUserID, StartDateTime, EndDateTime, Reason, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      data.DelegatorUserID,
      data.DelegateeUserID,
      data.StartDateTime,
      data.EndDateTime,
      data.Reason || null,
      data.CreatedBy || data.DelegatorUserID
    ]);
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const sql = `
      UPDATE ApprovalDelegation SET
        DelegateeUserID = COALESCE(?, DelegateeUserID),
        StartDateTime = COALESCE(?, StartDateTime),
        EndDateTime = COALESCE(?, EndDateTime),
        Reason = COALESCE(?, Reason),
        IsActive = COALESCE(?, IsActive),
        ModifiedBy = ?,
        ModifiedDate = CURRENT_TIMESTAMP(6)
      WHERE ApprovalDelegationID = ? AND IsDeleted = 0
    `;
    await query(sql, [
      data.DelegateeUserID ?? null,
      data.StartDateTime ?? null,
      data.EndDateTime ?? null,
      data.Reason ?? null,
      data.IsActive ?? null,
      data.ModifiedBy || 1,
      id
    ]);
    return this.findById(id);
  },

  async softDelete(id, userId) {
    const sql = `
      UPDATE ApprovalDelegation SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6)
      WHERE ApprovalDelegationID = ? AND IsDeleted = 0
    `;
    await query(sql, [userId || 1, id]);
    return true;
  }
};

export default approvalDelegationRepository;

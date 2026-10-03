import db from '../../../database/connection.js';

class LoginHistoryRepository {
  async create({ userAccountId, ipAddress, userAgent, loginStatus, failureReason, actorUserId }) {
    await db.query(
      `INSERT INTO LoginHistory (
         UserAccountID,
         IPAddress,
         UserAgent,
         LoginStatus,
         FailureReason,
         CreatedBy
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [userAccountId, ipAddress, userAgent, loginStatus, failureReason, actorUserId]
    );
  }
}

export default new LoginHistoryRepository();

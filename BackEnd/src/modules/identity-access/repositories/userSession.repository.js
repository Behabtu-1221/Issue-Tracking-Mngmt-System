import db from '../../../database/connection.js';

class UserSessionRepository {
  async create({ userAccountId, sessionToken, ipAddress, userAgent, expiryDateTime, actorUserId }) {
    const result = await db.query(
      `INSERT INTO UserSession (
         UserAccountID,
         SessionToken,
         IPAddress,
         UserAgent,
         ExpiryDateTime,
         CreatedBy
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [userAccountId, sessionToken, ipAddress, userAgent, expiryDateTime, actorUserId]
    );

    return {
      userSessionId: result.insertId,
      sessionToken,
      expiryDateTime
    };
  }

  async findActiveById(sessionId) {
    const rows = await db.query(
      `SELECT
         us.UserSessionID,
         us.UserAccountID,
         us.SessionToken,
         us.ExpiryDateTime,
         us.IsRevoked,
         ua.UserID,
         u.TenantID,
         u.UserTypeCode,
         ua.Username,
         ua.AccountStatusCode,
         ua.IsActive AS AccountIsActive
       FROM UserSession us
       INNER JOIN UserAccount ua ON ua.UserAccountID = us.UserAccountID
       INNER JOIN \`User\` u ON u.UserID = ua.UserID
       WHERE us.UserSessionID = ?
         AND us.IsDeleted = 0
         AND us.IsActive = 1
         AND ua.IsDeleted = 0
         AND u.IsDeleted = 0
       LIMIT 1`,
      [sessionId]
    );

    return rows[0] || null;
  }

  async findActiveByToken(sessionToken) {
    const rows = await db.query(
      `SELECT
         us.UserSessionID,
         us.UserAccountID,
         us.SessionToken,
         us.ExpiryDateTime,
         us.IsRevoked,
         ua.UserID,
         u.TenantID,
         u.UserTypeCode,
         ua.Username,
         ua.AccountStatusCode,
         ua.IsActive AS AccountIsActive
       FROM UserSession us
       INNER JOIN UserAccount ua ON ua.UserAccountID = us.UserAccountID
       INNER JOIN \`User\` u ON u.UserID = ua.UserID
       WHERE us.SessionToken = ?
         AND us.IsDeleted = 0
         AND us.IsActive = 1
         AND ua.IsDeleted = 0
         AND u.IsDeleted = 0
       LIMIT 1`,
      [sessionToken]
    );

    return rows[0] || null;
  }

  async updateSessionToken(sessionId, sessionToken, actorUserId) {
    await db.query(
      `UPDATE UserSession
       SET SessionToken = ?,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserSessionID = ?`,
      [sessionToken, actorUserId, sessionId]
    );
  }

  async revoke(sessionId, actorUserId) {
    await db.query(
      `UPDATE UserSession
       SET IsRevoked = 1,
           IsActive = 0,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserSessionID = ?
         AND IsDeleted = 0`,
      [actorUserId, sessionId]
    );
  }

  async revokeAllForAccount(userAccountId, actorUserId) {
    await db.query(
      `UPDATE UserSession
       SET IsRevoked = 1,
           IsActive = 0,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserAccountID = ?
         AND IsDeleted = 0
         AND IsRevoked = 0`,
      [actorUserId, userAccountId]
    );
  }

  async listActiveByUserAccountId(userAccountId) {
    return db.query(
      `SELECT
         UserSessionID,
         IPAddress,
         UserAgent,
         LoginDateTime,
         ExpiryDateTime,
         IsRevoked
       FROM UserSession
       WHERE UserAccountID = ?
         AND IsDeleted = 0
         AND IsActive = 1
         AND IsRevoked = 0
         AND ExpiryDateTime > CURRENT_TIMESTAMP(6)
       ORDER BY LoginDateTime DESC`,
      [userAccountId]
    );
  }
}

export default new UserSessionRepository();

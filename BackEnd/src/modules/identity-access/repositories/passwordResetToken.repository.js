import db from '../../../database/connection.js';

class PasswordResetTokenRepository {
  /**
   * Invalidate existing active tokens and store the new SHA-256 hashed token with quick expiry.
   */
  async create({ userAccountId, hashedToken, expiryMinutes = 15, actorUserId = null }) {
    const actor = actorUserId || userAccountId;

    // 1. Invalidate any existing unused tokens for this account
    await db.query(
      `UPDATE PasswordResetToken
       SET IsActive = 0,
           IsDeleted = 1,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserAccountID = ?
         AND IsUsed = 0
         AND IsActive = 1
         AND IsDeleted = 0`,
      [actor, userAccountId]
    );

    // 2. Insert new cryptographically secure hashed token
    const result = await db.query(
      `INSERT INTO PasswordResetToken (
         UserAccountID,
         ResetToken,
         ExpiryDateTime,
         IsUsed,
         IsActive,
         IsDeleted,
         CreatedBy,
         CreatedDate
       ) VALUES (
         ?,
         ?,
         DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL ? MINUTE),
         0,
         1,
         0,
         ?,
         CURRENT_TIMESTAMP(6)
       )`,
      [userAccountId, hashedToken, expiryMinutes, actor]
    );

    return {
      tokenId: result.insertId,
      userAccountId
    };
  }

  /**
   * Look up token record by its SHA-256 hash.
   */
  async findByHashedToken(hashedToken) {
    const rows = await db.query(
      `SELECT
         prt.PasswordResetTokenID,
         prt.UserAccountID,
         prt.ResetToken,
         prt.ExpiryDateTime,
         prt.IsUsed,
         prt.IsActive,
         prt.IsDeleted,
         ua.UserID,
         ua.Username,
         ua.Email,
         ua.AccountStatusCode,
         ua.IsActive AS AccountIsActive
       FROM PasswordResetToken prt
       INNER JOIN UserAccount ua ON ua.UserAccountID = prt.UserAccountID
       WHERE prt.ResetToken = ?
       ORDER BY prt.CreatedDate DESC
       LIMIT 1`,
      [hashedToken]
    );

    return rows[0] || null;
  }

  /**
   * Mark token as consumed and single-use expired.
   */
  async markUsed(tokenId, actorUserId) {
    await db.query(
      `UPDATE PasswordResetToken
       SET IsUsed = 1,
           UsedDateTime = CURRENT_TIMESTAMP(6),
           IsActive = 0,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE PasswordResetTokenID = ?`,
      [actorUserId, tokenId]
    );
  }

  /**
   * Invalidate all tokens for a user account upon successful password reset.
   */
  async invalidateAllForAccount(userAccountId, actorUserId) {
    await db.query(
      `UPDATE PasswordResetToken
       SET IsActive = 0,
           IsDeleted = 1,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserAccountID = ?
         AND IsUsed = 0`,
      [actorUserId, userAccountId]
    );
  }
}

export default new PasswordResetTokenRepository();

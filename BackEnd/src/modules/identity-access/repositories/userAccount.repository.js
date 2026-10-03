import db from '../../../database/connection.js';

class UserAccountRepository {
  async findByUsername(username) {
    const rows = await db.query(
      `SELECT
         ua.UserAccountID,
         ua.UserID,
         ua.Username,
         ua.PasswordHash,
         ua.AccountStatusCode,
         ua.FailedLoginAttempts,
         ua.LockoutEndDateTime,
         ua.LastLoginDateTime,
         ua.IsMfaEnabled,
         ua.IsActive,
         u.TenantID,
         u.UserTypeCode,
         u.FirstName,
         u.LastName,
         u.Email,
         u.PhoneNumber,
         u.JobTitle,
         u.PreferredLanguage
       FROM UserAccount ua
       INNER JOIN \`User\` u ON u.UserID = ua.UserID
       WHERE (ua.Username = ? OR u.Email = ?)
         AND ua.IsDeleted = 0
         AND u.IsDeleted = 0
       LIMIT 1`,
      [username, username]
    );

    return rows[0] || null;
  }

  async findAuthContextByUserId(userId) {
    const rows = await db.query(
      `SELECT
         ua.UserAccountID,
         ua.UserID,
         ua.Username,
         ua.AccountStatusCode,
         ua.IsActive,
         u.TenantID,
         u.UserTypeCode,
         u.FirstName,
         u.LastName,
         u.Email
       FROM UserAccount ua
       INNER JOIN \`User\` u ON u.UserID = ua.UserID
       WHERE u.UserID = ?
         AND ua.IsDeleted = 0
         AND u.IsDeleted = 0
       LIMIT 1`,
      [userId]
    );

    return rows[0] || null;
  }

  async findProfileByUserId(userId) {
    const rows = await db.query(
      `SELECT
         u.UserID,
         u.TenantID,
         u.UserTypeCode,
         u.FirstName,
         u.LastName,
         u.Email,
         u.PhoneNumber,
         u.MobileNumber,
         u.JobTitle,
         u.PreferredLanguage,
         u.AvatarUrl,
         u.IsActive,
         ua.UserAccountID,
         ua.Username,
         ua.AccountStatusCode,
         ua.IsMfaEnabled,
         ua.LastLoginDateTime,
         t.TenantCode,
         t.CompanyName AS TenantName,
         d.DepartmentID,
         d.DepartmentName,
         COALESCE(bp.BusinessParkName, (SELECT b.BusinessParkName FROM BusinessPark b WHERE b.IsDeleted = 0 LIMIT 1)) AS BusinessParkName,
         COALESCE(bp.BusinessParkID, (SELECT b.BusinessParkID FROM BusinessPark b WHERE b.IsDeleted = 0 LIMIT 1)) AS BusinessParkID
       FROM \`User\` u
       INNER JOIN UserAccount ua ON ua.UserID = u.UserID AND ua.IsDeleted = 0
       LEFT JOIN Tenant t ON t.TenantID = u.TenantID AND t.IsDeleted = 0
       LEFT JOIN BusinessPark bp ON bp.BusinessParkID = t.BusinessParkID AND bp.IsDeleted = 0
       LEFT JOIN EmployeeAssignment ea ON ea.UserID = u.UserID AND ea.IsPrimary = 1 AND ea.IsActive = 1 AND ea.IsDeleted = 0
       LEFT JOIN Department d ON d.DepartmentID = ea.DepartmentID AND d.IsDeleted = 0
       WHERE u.UserID = ?
         AND u.IsDeleted = 0
       LIMIT 1`,
      [userId]
    );

    return rows[0] || null;
  }

  async findRolesByUserId(userId) {
    return db.query(
      `SELECT
         r.RoleID,
         r.RoleCode,
         r.RoleName,
         r.TenantID,
         r.IsSystemRole
       FROM UserRole ur
       INNER JOIN \`Role\` r ON r.RoleID = ur.RoleID
       WHERE ur.UserID = ?
         AND ur.IsActive = 1
         AND ur.IsDeleted = 0
         AND r.IsDeleted = 0
       ORDER BY ur.CreatedDate DESC, ur.ModifiedDate DESC`,
      [userId]
    );
  }

  async findPermissionsByUserId(userId) {
    return db.query(
      `SELECT DISTINCT
         p.PermissionID,
         p.PermissionCode,
         p.PermissionName
       FROM UserRole ur
       INNER JOIN RolePermission rp ON rp.RoleID = ur.RoleID AND rp.IsDeleted = 0
       INNER JOIN Permission p ON p.PermissionID = rp.PermissionID AND p.IsDeleted = 0
       WHERE ur.UserID = ?
         AND ur.IsDeleted = 0
       ORDER BY p.PermissionCode ASC`,
      [userId]
    );
  }

  async recordSuccessfulLogin(userAccountId, actorUserId) {
    await db.query(
      `UPDATE UserAccount
       SET FailedLoginAttempts = 0,
           LockoutEndDateTime = NULL,
           AccountStatusCode = CASE
             WHEN AccountStatusCode = 'LOCKED' THEN 'ACTIVE'
             ELSE AccountStatusCode
           END,
           LastLoginDateTime = CURRENT_TIMESTAMP(6),
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserAccountID = ?`,
      [actorUserId, userAccountId]
    );
  }

  async clearExpiredLockout(userAccountId, actorUserId) {
    await db.query(
      `UPDATE UserAccount
       SET FailedLoginAttempts = 0,
           LockoutEndDateTime = NULL,
           AccountStatusCode = 'ACTIVE',
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserAccountID = ?
         AND AccountStatusCode = 'LOCKED'
         AND LockoutEndDateTime IS NOT NULL
         AND LockoutEndDateTime <= CURRENT_TIMESTAMP(6)`,
      [actorUserId, userAccountId]
    );
  }

  async recordFailedLoginWithLockout(userAccountId, actorUserId, maxAttempts, lockoutMinutes) {
    await db.query(
      `UPDATE UserAccount
       SET FailedLoginAttempts = FailedLoginAttempts + 1,
           LockoutEndDateTime = CASE
             WHEN FailedLoginAttempts + 1 >= ? THEN DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL ? MINUTE)
             ELSE LockoutEndDateTime
           END,
           AccountStatusCode = CASE
             WHEN FailedLoginAttempts + 1 >= ? THEN 'LOCKED'
             ELSE AccountStatusCode
           END,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserAccountID = ?`,
      [maxAttempts, lockoutMinutes, maxAttempts, actorUserId, userAccountId]
    );
  }

  async updatePassword(userAccountId, passwordHash, actorUserId) {
    await db.query(
      `UPDATE UserAccount
       SET PasswordHash = ?,
           FailedLoginAttempts = 0,
           LockoutEndDateTime = NULL,
           AccountStatusCode = 'ACTIVE',
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserAccountID = ?`,
      [passwordHash, actorUserId, userAccountId]
    );
  }

  async findPasswordHash(userAccountId) {
    const rows = await db.query(
      `SELECT PasswordHash
       FROM UserAccount
       WHERE UserAccountID = ?
         AND IsDeleted = 0
       LIMIT 1`,
      [userAccountId]
    );

    return rows[0]?.PasswordHash || null;
  }
}

export default new UserAccountRepository();

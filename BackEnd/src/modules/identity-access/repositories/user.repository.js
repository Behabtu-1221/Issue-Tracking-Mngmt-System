import db from '../../../database/connection.js';

class UserRepository {
  async findAll({ tenantId, departmentId, userTypeCode, status, search, limit = 10, offset = 0 }) {
    const whereConditions = ['u.IsDeleted = 0', 'ua.IsDeleted = 0'];
    const queryParams = [];

    if (tenantId) {
      whereConditions.push('u.TenantID = ?');
      queryParams.push(tenantId);
    }

    if (departmentId) {
      whereConditions.push('ea.DepartmentID = ?');
      queryParams.push(departmentId);
    }

    if (userTypeCode) {
      whereConditions.push('u.UserTypeCode = ?');
      queryParams.push(userTypeCode);
    }

    if (status) {
      whereConditions.push('ua.AccountStatusCode = ?');
      queryParams.push(status);
    }

    if (search) {
      whereConditions.push(
        '(u.FirstName LIKE ? OR u.LastName LIKE ? OR u.Email LIKE ? OR ua.Username LIKE ?)'
      );
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.join(' AND ');

    const countRows = await db.query(
      `SELECT COUNT(DISTINCT u.UserID) AS total
       FROM \`User\` u
       INNER JOIN UserAccount ua ON ua.UserID = u.UserID
       LEFT JOIN EmployeeAssignment ea ON ea.UserID = u.UserID AND ea.IsPrimary = 1 AND ea.IsActive = 1 AND ea.IsDeleted = 0
       WHERE ${whereClause}`,
      queryParams
    );

    const total = countRows[0]?.total || 0;

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
         u.CreatedDate,
         ua.UserAccountID,
         ua.Username,
         ua.AccountStatusCode,
         ua.FailedLoginAttempts,
         ua.LastLoginDateTime,
         ua.IsMfaEnabled,
         t.CompanyName AS TenantName,
         t.TenantCode,
         d.DepartmentID,
         d.DepartmentName,
         (SELECT bp.BusinessParkName FROM BusinessPark bp WHERE bp.IsDeleted = 0 LIMIT 1) AS BusinessParkName,
         (
           SELECT GROUP_CONCAT(CONCAT(r.RoleID, ':', r.RoleName, ':', r.RoleCode) SEPARATOR '||')
           FROM UserRole ur
           INNER JOIN \`Role\` r ON r.RoleID = ur.RoleID AND r.IsDeleted = 0
           WHERE ur.UserID = u.UserID AND ur.IsDeleted = 0 AND ur.IsActive = 1
         ) AS AssignedRolesGroup
       FROM \`User\` u
       INNER JOIN UserAccount ua ON ua.UserID = u.UserID
       LEFT JOIN Tenant t ON t.TenantID = u.TenantID AND t.IsDeleted = 0
       LEFT JOIN EmployeeAssignment ea ON ea.UserID = u.UserID AND ea.IsPrimary = 1 AND ea.IsActive = 1 AND ea.IsDeleted = 0
       LEFT JOIN Department d ON d.DepartmentID = ea.DepartmentID AND d.IsDeleted = 0
       WHERE ${whereClause}
       ORDER BY u.UserID DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), Number(offset)]
    );

    const processedUsers = rows.map(r => {
      let roles = [];
      if (r.AssignedRolesGroup) {
        const parsed = r.AssignedRolesGroup.split('||').map(item => {
          const parts = item.split(':');
          const RoleID = parts[0];
          const RoleName = parts[1] || '';
          const RoleCode = parts[2] || '';
          return { RoleID: Number(RoleID), RoleName, RoleCode };
        });
        // Single assigned role per account (latest assigned role)
        roles = parsed.length > 0 ? [parsed[parsed.length - 1]] : [];
      }
      const status = r.AccountStatusCode || (r.IsActive === 1 ? 'ACTIVE' : 'INACTIVE');
      return {
        ...r,
        Status: status,
        AccountStatusCode: status,
        Roles: roles,
        roles: roles
      };
    });

    return { users: processedUsers, total };
  }

  async findById(userId) {
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
         u.CreatedDate,
         u.ModifiedDate,
         ua.UserAccountID,
         ua.Username,
         ua.AccountStatusCode,
         ua.FailedLoginAttempts,
         ua.LockoutEndDateTime,
         ua.LastLoginDateTime,
         ua.IsMfaEnabled,
         t.CompanyName AS TenantName,
         t.TenantCode,
         d.DepartmentID,
         d.DepartmentName
       FROM \`User\` u
       INNER JOIN UserAccount ua ON ua.UserID = u.UserID AND ua.IsDeleted = 0
       LEFT JOIN Tenant t ON t.TenantID = u.TenantID AND t.IsDeleted = 0
       LEFT JOIN EmployeeAssignment ea ON ea.UserID = u.UserID AND ea.IsPrimary = 1 AND ea.IsActive = 1 AND ea.IsDeleted = 0
       LEFT JOIN Department d ON d.DepartmentID = ea.DepartmentID AND d.IsDeleted = 0
       WHERE u.UserID = ?
         AND u.IsDeleted = 0
       LIMIT 1`,
      [userId]
    );

    if (!rows[0]) return null;

    const user = rows[0];

    const roles = await db.query(
      `SELECT r.RoleID, r.RoleCode, r.RoleName
       FROM UserRole ur
       INNER JOIN \`Role\` r ON r.RoleID = ur.RoleID AND r.IsDeleted = 0
       WHERE ur.UserID = ? AND ur.IsDeleted = 0 AND ur.IsActive = 1
       ORDER BY ur.CreatedDate DESC, ur.ModifiedDate DESC
       LIMIT 1`,
      [userId]
    );

    user.Roles = roles;
    user.roles = roles;
    user.Status = user.AccountStatusCode || (user.IsActive === 1 ? 'ACTIVE' : 'INACTIVE');
    return user;
  }

  async findByEmail(email) {
    if (!email) return null;
    const rows = await db.query(
      `SELECT UserID, Email, TenantID FROM \`User\` WHERE LOWER(Email) = LOWER(?) AND IsDeleted = 0 LIMIT 1`,
      [email.trim()]
    );
    return rows[0] || null;
  }

  async findByUsername(username) {
    const rows = await db.query(
      `SELECT UserAccountID, Username FROM UserAccount WHERE Username = ? AND IsDeleted = 0 LIMIT 1`,
      [username]
    );
    return rows[0] || null;
  }

  async createUser(userData, tx) {
    const queryFn = tx ? tx.query : db.query;
    const result = await queryFn(
      `INSERT INTO \`User\` (
         TenantID,
         UserTypeCode,
         FirstName,
         LastName,
         Email,
         PhoneNumber,
         MobileNumber,
         JobTitle,
         PreferredLanguage,
         CreatedBy
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.tenantId || null,
        userData.userTypeCode || 'STAFF',
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.phoneNumber || null,
        userData.mobileNumber || null,
        userData.jobTitle || null,
        userData.preferredLanguage || 'en',
        userData.actorUserId
      ]
    );

    return result.insertId;
  }

  async createUserAccount(accountData, tx) {
    const queryFn = tx ? tx.query : db.query;

    const providerRows = await queryFn(
      `SELECT AuthenticationProviderID FROM AuthenticationProvider WHERE IsDeleted = 0 LIMIT 1`
    );
    const authProviderId = providerRows[0]?.AuthenticationProviderID || 1;

    const result = await queryFn(
      `INSERT INTO UserAccount (
         UserID,
         AuthenticationProviderID,
         Username,
         PasswordHash,
         AccountStatusCode,
         CreatedBy
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        accountData.userId,
        authProviderId,
        accountData.username,
        accountData.passwordHash,
        accountData.accountStatusCode || 'ACTIVE',
        accountData.actorUserId
      ]
    );

    return result.insertId;
  }

  async updateUser(userId, userData, actorUserId) {
    await db.query(
      `UPDATE \`User\`
       SET FirstName = COALESCE(?, FirstName),
           LastName = COALESCE(?, LastName),
           Email = COALESCE(?, Email),
           PhoneNumber = COALESCE(?, PhoneNumber),
           MobileNumber = COALESCE(?, MobileNumber),
           JobTitle = COALESCE(?, JobTitle),
           PreferredLanguage = COALESCE(?, PreferredLanguage),
           AvatarUrl = COALESCE(?, AvatarUrl),
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserID = ? AND IsDeleted = 0`,
      [
        userData.firstName || null,
        userData.lastName || null,
        userData.email || null,
        userData.phoneNumber || null,
        userData.mobileNumber || null,
        userData.jobTitle || null,
        userData.preferredLanguage || null,
        userData.avatarUrl || null,
        actorUserId,
        userId
      ]
    );
  }

  async updateUserStatus(userId, statusCode, actorUserId) {
    await db.query(
      `UPDATE UserAccount
       SET AccountStatusCode = ?,
           FailedLoginAttempts = CASE WHEN ? = 'ACTIVE' THEN 0 ELSE FailedLoginAttempts END,
           LockoutEndDateTime = CASE WHEN ? = 'ACTIVE' THEN NULL ELSE LockoutEndDateTime END,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserID = ? AND IsDeleted = 0`,
      [statusCode, statusCode, statusCode, actorUserId, userId]
    );

    const isActive = statusCode === 'ACTIVE' ? 1 : 0;
    await db.query(
      `UPDATE \`User\`
       SET IsActive = ?,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserID = ? AND IsDeleted = 0`,
      [isActive, actorUserId, userId]
    );
  }

  async softDeleteUser(userId, actorUserId) {
    await db.query(
      `UPDATE \`User\`
       SET IsDeleted = 1,
           IsActive = 0,
           DeletedBy = ?,
           DeletedDate = CURRENT_TIMESTAMP(6)
       WHERE UserID = ?`,
      [actorUserId, userId]
    );

    await db.query(
      `UPDATE UserAccount
       SET IsDeleted = 1,
           IsActive = 0,
           DeletedBy = ?,
           DeletedDate = CURRENT_TIMESTAMP(6)
       WHERE UserID = ?`,
      [actorUserId, userId]
    );
  }

  async findLoginHistory(userAccountId, { limit = 20, offset = 0 }) {
    const countRows = await db.query(
      `SELECT COUNT(*) AS total
       FROM LoginHistory
       WHERE UserAccountID = ? AND IsDeleted = 0`,
      [userAccountId]
    );

    const total = countRows[0]?.total || 0;

    const rows = await db.query(
      `SELECT
         LoginHistoryID,
         UserAccountID,
         LoginDateTime,
         IPAddress,
         UserAgent,
         LoginStatus,
         FailureReason
       FROM LoginHistory
       WHERE UserAccountID = ? AND IsDeleted = 0
       ORDER BY LoginDateTime DESC
       LIMIT ? OFFSET ?`,
      [userAccountId, Number(limit), Number(offset)]
    );

    return { history: rows, total };
  }
}

export default new UserRepository();

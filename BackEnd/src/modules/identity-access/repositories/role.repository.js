import db from '../../../database/connection.js';

class RoleRepository {
  async findAll({ tenantId, search, limit = 20, offset = 0 }) {
    const whereConditions = ['r.IsDeleted = 0'];
    const queryParams = [];

    if (tenantId !== undefined && tenantId !== null) {
      whereConditions.push('(r.TenantID = ? OR r.TenantID IS NULL)');
      queryParams.push(tenantId);
    }

    if (search) {
      whereConditions.push('(r.RoleCode LIKE ? OR r.RoleName LIKE ? OR r.Description LIKE ?)');
      const pattern = `%${search}%`;
      queryParams.push(pattern, pattern, pattern);
    }

    const whereClause = whereConditions.join(' AND ');

    const countRows = await db.query(
      `SELECT COUNT(*) AS total FROM \`Role\` r WHERE ${whereClause}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    const roles = await db.query(
      `SELECT
         r.RoleID,
         r.TenantID,
         r.RoleCode,
         r.RoleName,
         r.Description,
         r.IsSystemRole,
         r.IsActive,
         r.CreatedDate,
         t.CompanyName AS TenantName,
         (SELECT COUNT(*) FROM UserRole ur WHERE ur.RoleID = r.RoleID AND ur.IsDeleted = 0) AS AssignedUsersCount,
         (SELECT COUNT(*) FROM RolePermission rp WHERE rp.RoleID = r.RoleID AND rp.IsDeleted = 0) AS PermissionCount
       FROM \`Role\` r
       LEFT JOIN Tenant t ON t.TenantID = r.TenantID AND t.IsDeleted = 0
       WHERE ${whereClause}
       ORDER BY r.IsSystemRole DESC, r.RoleName ASC
       LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), Number(offset)]
    );

    return { roles, total };
  }

  async findById(roleId) {
    const rows = await db.query(
      `SELECT
         r.RoleID,
         r.TenantID,
         r.RoleCode,
         r.RoleName,
         r.Description,
         r.IsSystemRole,
         r.IsActive,
         r.CreatedDate,
         r.ModifiedDate,
         t.CompanyName AS TenantName
       FROM \`Role\` r
       LEFT JOIN Tenant t ON t.TenantID = r.TenantID AND t.IsDeleted = 0
       WHERE r.RoleID = ? AND r.IsDeleted = 0
       LIMIT 1`,
      [roleId]
    );

    if (!rows[0]) return null;
    const role = rows[0];

    const permissions = await db.query(
      `SELECT
         p.PermissionID,
         p.PermissionCode,
         p.PermissionName,
         p.Description
       FROM RolePermission rp
       INNER JOIN Permission p ON p.PermissionID = rp.PermissionID AND p.IsDeleted = 0
       WHERE rp.RoleID = ? AND rp.IsDeleted = 0
       ORDER BY p.PermissionCode ASC`,
      [roleId]
    );

    role.permissions = permissions;
    return role;
  }

  async findByCode(roleCode, tenantId = null, tx = null) {
    const queryFn = tx ? tx.query : db.query;
    const rows = await queryFn(
      `SELECT RoleID, RoleCode, IsSystemRole
       FROM \`Role\`
       WHERE RoleCode = ?
         AND (TenantID = ? OR (TenantID IS NULL AND ? IS NULL))
         AND IsDeleted = 0
       LIMIT 1`,
      [roleCode, tenantId, tenantId]
    );
    return rows[0] || null;
  }

  async createRole(roleData) {
    const result = await db.query(
      `INSERT INTO \`Role\` (
         TenantID,
         RoleCode,
         RoleName,
         Description,
         IsSystemRole,
         CreatedBy
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        roleData.tenantId || null,
        roleData.roleCode.toUpperCase(),
        roleData.roleName,
        roleData.description || null,
        roleData.isSystemRole ? 1 : 0,
        roleData.actorUserId
      ]
    );
    return result.insertId;
  }

  async updateRole(roleId, roleData, actorUserId) {
    await db.query(
      `UPDATE \`Role\`
       SET RoleName = COALESCE(?, RoleName),
           Description = COALESCE(?, Description),
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE RoleID = ? AND IsDeleted = 0`,
      [roleData.roleName || null, roleData.description || null, actorUserId, roleId]
    );
  }

  async softDeleteRole(roleId, actorUserId) {
    await db.query(
      `UPDATE \`Role\`
       SET IsDeleted = 1,
           IsActive = 0,
           DeletedBy = ?,
           DeletedDate = CURRENT_TIMESTAMP(6)
       WHERE RoleID = ? AND IsSystemRole = 0`,
      [actorUserId, roleId]
    );
  }

  async findAllPermissions() {
    return db.query(
      `SELECT
         p.PermissionID,
         p.PermissionCode,
         p.PermissionName,
         p.Description,
         pg.PermissionGroupID,
         pg.GroupCode,
         pg.GroupName,
         pg.Description AS GroupDescription,
         sm.SystemModuleID,
         sm.ModuleCode,
         sm.ModuleName,
         sm.Description AS ModuleDescription,
         sm.DisplayOrder AS ModuleOrder
       FROM Permission p
       LEFT JOIN PermissionGroup pg ON pg.PermissionGroupID = p.PermissionGroupID AND pg.IsDeleted = 0
       LEFT JOIN SystemModule sm ON sm.SystemModuleID = pg.SystemModuleID AND sm.IsDeleted = 0
       WHERE p.IsDeleted = 0
       ORDER BY COALESCE(sm.DisplayOrder, 999) ASC, pg.GroupName ASC, p.PermissionCode ASC`
    );
  }

  async syncRolePermissions(roleId, permissionIds, actorUserId, tx = null) {
    const queryFn = tx ? tx.query : db.query;
    await queryFn(
      `UPDATE RolePermission
       SET IsDeleted = 1,
           IsActive = 0,
           DeletedBy = ?,
           DeletedDate = CURRENT_TIMESTAMP(6)
       WHERE RoleID = ?`,
      [actorUserId, roleId]
    );

    if (!permissionIds || permissionIds.length === 0) return;

    for (const perm of permissionIds) {
      let resolvedId = perm;
      if (typeof perm === 'string' && isNaN(Number(perm))) {
        const rows = await queryFn(
          `SELECT PermissionID FROM Permission WHERE PermissionCode = ? AND IsDeleted = 0 LIMIT 1`,
          [perm]
        );
        if (rows[0]) {
          resolvedId = rows[0].PermissionID;
        } else {
          const ins = await queryFn(
            `INSERT INTO Permission (PermissionCode, PermissionName, Description, ResourcePermissionID, CreatedBy) VALUES (?, ?, ?, 1, ?)`,
            [perm, perm, `Granular permission ${perm}`, actorUserId || 1]
          );
          resolvedId = ins.insertId;
        }
      }

      await queryFn(
        `INSERT INTO RolePermission (RoleID, PermissionID, CreatedBy)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           IsDeleted = 0,
           IsActive = 1,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)`,
        [roleId, resolvedId, actorUserId, actorUserId]
      );
    }

    try {
      await queryFn(
        `INSERT INTO AuditLog (UserID, AuditEntityID, AuditActionID, Details, RecordID)
         VALUES (?, 1, 1, ?, ?)`,
        [
          actorUserId || 1,
          JSON.stringify({ event: 'ROLE_PERMISSIONS_SYNCED', roleId, grantedPermissionCount: permissionIds ? permissionIds.length : 0 }),
          roleId
        ]
      );
    } catch (err) {
      // Audit logging is non-blocking
    }
  }

  async assignUserRoles(userId, roleIds, actorUserId, tx = null) {
    const queryFn = tx ? tx.query : db.query;
    const list = Array.isArray(roleIds) ? roleIds : [roleIds];

    // Deactivate previous active roles for this user so each account has a single active assigned role
    await queryFn(
      `UPDATE UserRole
       SET IsDeleted = 1,
           IsActive = 0,
           DeletedBy = ?,
           DeletedDate = CURRENT_TIMESTAMP(6)
       WHERE UserID = ? AND IsDeleted = 0`,
      [actorUserId || 1, userId]
    );

    for (const roleId of list) {
      await queryFn(
        `INSERT INTO UserRole (UserID, RoleID, CreatedBy)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           IsDeleted = 0,
           IsActive = 1,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)`,
        [userId, roleId, actorUserId, actorUserId]
      );
    }

    // Sync User.UserTypeCode on User table to match the newly assigned active RoleCode
    if (list.length > 0) {
      const primaryRoleId = list[list.length - 1];
      const roleRows = await queryFn(
        `SELECT RoleCode FROM \`Role\` WHERE RoleID = ? AND IsDeleted = 0 LIMIT 1`,
        [primaryRoleId]
      );
      if (roleRows[0] && roleRows[0].RoleCode) {
        await queryFn(
          `UPDATE \`User\` SET UserTypeCode = ? WHERE UserID = ?`,
          [roleRows[0].RoleCode, userId]
        );
      }
    }
  }

  async removeUserRole(userId, roleId, actorUserId) {
    await db.query(
      `UPDATE UserRole
       SET IsDeleted = 1,
           IsActive = 0,
           DeletedBy = ?,
           DeletedDate = CURRENT_TIMESTAMP(6)
       WHERE UserID = ? AND RoleID = ?`,
      [actorUserId, userId, roleId]
    );
  }

  async getRbacAuditLogs({ tenantId, limit = 50, offset = 0 } = {}) {
    const rows = await db.query(
      `SELECT
         al.AuditLogID,
         al.CreatedDate,
         al.Details,
         al.RecordID,
         ae.EntityName AS TargetEntity,
         aa.ActionName AS EventType,
         u.Username AS ActorUsername
       FROM AuditLog al
       LEFT JOIN AuditEntity ae ON ae.AuditEntityID = al.AuditEntityID
       LEFT JOIN AuditAction aa ON aa.AuditActionID = al.AuditActionID
       LEFT JOIN User u ON u.UserID = al.UserID
       ORDER BY al.CreatedDate DESC
       LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    return rows;
  }
}

export default new RoleRepository();

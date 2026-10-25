import db from '../connection.js';

const ROLE_PERMISSIONS_MAPPING = {
  PARK_SUPER_ADMIN: [
    'Tenant.Read', 'Tenant.Create', 'Tenant.Update', 'Tenant.Status',
    'Building.Read', 'Building.Manage', 'Floor.Manage', 'Office.Manage', 'Zone.Manage',
    'User.Read', 'User.Create', 'User.Update', 'User.Status', 'User.Delete',
    'Role.Read', 'Role.Create', 'Role.Update', 'Role.Assign', 'Role.Permission.Assign',
    'Department.Read', 'Department.Create', 'Department.Update', 'Department.Manage',
    'Request.Create', 'Request.Read', 'Request.All.Read', 'Request.Update', 'Request.Approve', 'Request.Assign', 'Request.Reassign', 'Request.Resolve', 'Request.Close',
    'Issue.Create', 'Issue.Read.All', 'Issue.Update', 'Issue.Approve', 'Issue.Reject', 'Issue.Assign', 'Issue.Dispatch', 'Issue.Resolve', 'Issue.Close',
    'Report.View', 'Report.Export', 'Report.Create', 'Report.Schedule', 'Report.Manage', 'Audit.Read', 'Audit.Export', 'Communication.Read', 'Communication.Send', 'Notification.Manage'
  ],

  DEPARTMENT_MANAGER: [
    'Department.Read', 'Department.Update',
    'User.Read', 'User.Read.Company',
    'Request.Create', 'Request.Read', 'Request.Update', 'Request.Approve', 'Request.Assign',
    'Issue.Create', 'Issue.Read.Department', 'Issue.Read.Company', 'Issue.Update', 'Issue.Approve', 'Issue.Reject', 'Issue.Comment', 'Issue.Assign',
    'Report.View', 'Report.Export',
    'Communication.Read', 'Communication.Send',
    'Notification.Manage', 'Team.Manage'
  ],

  TENANT_REPRESENTATIVE: [
    'Tenant.Read',
    'User.Read', 'User.Read.Company',
    'Request.Create', 'Request.Read', 'Request.Update', 'Request.Approve',
    'Issue.Create', 'Issue.Read.Company', 'Issue.Update', 'Issue.Approve', 'Issue.Reject',
    'Service.Read',
    'Report.View', 'Report.Export',
    'Communication.Read', 'Communication.Send',
    'Notification.Manage'
  ],
  DISPATCHER: [
    'User.Read', 'Department.Read',
    'Request.Create', 'Request.Read', 'Request.Update', 'Request.Approve', 'Request.Assign', 'Request.Reassign', 'Request.Resolve', 'Request.Close',
    'Issue.Create', 'Issue.Read.All', 'Issue.Update', 'Issue.Approve', 'Issue.Reject', 'Issue.Assign', 'Issue.Dispatch', 'Issue.Resolve', 'Issue.Close',
    'Report.View', 'Communication.Read', 'Communication.Send', 'Team.Manage'
  ],
  TECHNICIAN: [
    'Request.Read', 'Request.Update', 'Request.Resolve',
    'Issue.Read.Assigned', 'Issue.Resolve', 'Issue.Comment',
    'Communication.Read', 'Communication.Send'
  ],
  EMPLOYEE: [
    'Request.Create', 'Request.Read',
    'Issue.Create', 'Issue.Read.Own', 'Issue.Comment',
    'Communication.Read', 'Communication.Send'
  ]
};

export async function seedRolePermissions() {
  console.log('Seeding Default System Role Permissions...');

  // Ensure DEPARTMENT_MANAGER role exists
  const existingDeptRole = await db.query(`SELECT RoleID FROM \`Role\` WHERE RoleCode = 'DEPARTMENT_MANAGER' LIMIT 1`);
  if (!existingDeptRole[0]) {
    await db.query(`
      INSERT INTO \`Role\` (TenantID, RoleCode, RoleName, Description, IsSystemRole, CreatedBy)
      VALUES (NULL, 'DEPARTMENT_MANAGER', 'Department Manager', 'Department operational manager and request approver', 1, 1)
    `);
  }

  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS_MAPPING)) {
    const roleRows = await db.query(`SELECT RoleID FROM \`Role\` WHERE RoleCode = ? AND IsDeleted = 0 LIMIT 1`, [roleCode]);
    if (!roleRows[0]) {
      console.warn(`Role ${roleCode} not found in DB, skipping.`);
      continue;
    }

    const roleId = roleRows[0].RoleID;

    for (const code of permCodes) {
      const permRows = await db.query(`SELECT PermissionID FROM Permission WHERE PermissionCode = ? AND IsDeleted = 0 LIMIT 1`, [code]);
      if (permRows[0]) {
        const permId = permRows[0].PermissionID;
        await db.query(
          `INSERT INTO RolePermission (RoleID, PermissionID, CreatedBy) VALUES (?, ?, 1)
           ON DUPLICATE KEY UPDATE IsDeleted = 0, IsActive = 1`,
          [roleId, permId]
        );
      }
    }
    console.log(`Mapped permissions for role: ${roleCode}`);
  }

  console.log('Role Permission Mapping completed.');
}

if (process.argv[1] && process.argv[1].endsWith('seed-role-permissions.js')) {
  seedRolePermissions().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

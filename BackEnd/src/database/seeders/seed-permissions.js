import db from '../connection.js';

export const SYSTEM_MODULES_DATA = [
  { moduleCode: 'MOD_PARK', moduleName: 'Business Park Management', description: 'Campus topology, buildings, floors, office units, and facility zones', displayOrder: 1 },
  { moduleCode: 'MOD_TENANT', moduleName: 'Tenant Management', description: 'Tenant company onboarding, authorized representatives, lease contracts, and sub-tenants', displayOrder: 2 },
  { moduleCode: 'MOD_ORG', moduleName: 'Organization Management', description: 'Company organization structure, departments, business units, and positions', displayOrder: 3 },
  { moduleCode: 'MOD_IAM', moduleName: 'Identity & Access Management', description: 'User account provisioning, employee profiles, security sessions, and authentication', displayOrder: 4 },
  { moduleCode: 'MOD_RBAC', moduleName: 'Role & Permission Management', description: 'Enterprise role definition, permission matrix mapping, and role assignments', displayOrder: 5 },
  { moduleCode: 'MOD_CATALOG', moduleName: 'Service Catalog Management', description: 'Service catalog directory, categories, pricing, and SLA offerings', displayOrder: 6 },
  { moduleCode: 'MOD_ISSUE', moduleName: 'Issue Request Management', description: 'Request lifecycle, approval workflows, technician dispatch, work orders, and resolution', displayOrder: 7 },
  { moduleCode: 'MOD_KB', moduleName: 'Knowledge Base', description: 'Standard operating procedures, known issues, solution articles, and FAQs', displayOrder: 8 },
  { moduleCode: 'MOD_NOTIF', moduleName: 'Notification Management', description: 'Automated alert rules, notification templates, and delivery logs', displayOrder: 9 },
  { moduleCode: 'MOD_REPORT', moduleName: 'Reports & Analytics', description: 'Enterprise executive dashboards, operational performance metrics, and data export', displayOrder: 10 },
  { moduleCode: 'MOD_AUDIT', moduleName: 'Audit Logs', description: 'Comprehensive security audit trail, compliance logs, and event history', displayOrder: 11 }
];

export const PERMISSION_GROUPS_DATA = [
  // Business Park Management
  { groupCode: 'PARK_TOPOLOGY', groupName: 'Park Topology & Campus', moduleCode: 'MOD_PARK', description: 'Campus building structure, blocks, and campus profile', displayOrder: 1 },
  { groupCode: 'PARK_SPACE', groupName: 'Floor & Space Allocation', moduleCode: 'MOD_PARK', description: 'Floor levels, office units, and tenant space allocation', displayOrder: 2 },
  { groupCode: 'PARK_ZONES', groupName: 'Facility Zones & Landmarks', moduleCode: 'MOD_PARK', description: 'Facility zones, green spaces, parking lots, and campus landmarks', displayOrder: 3 },

  // Tenant Management
  { groupCode: 'TENANT_DIRECTORY', groupName: 'Tenant Directory & Profiles', moduleCode: 'MOD_TENANT', description: 'Tenant company onboarding, directory, and status management', displayOrder: 1 },
  { groupCode: 'TENANT_CONTRACTS', groupName: 'Lease Contracts & Reps', moduleCode: 'MOD_TENANT', description: 'Lease agreements, authorized representatives, and sub-tenants', displayOrder: 2 },

  // Organization Management
  { groupCode: 'ORG_STRUCTURE', groupName: 'Departments & Units', moduleCode: 'MOD_ORG', description: 'Organization units, departments, and business units', displayOrder: 1 },
  { groupCode: 'ORG_TEAMS', groupName: 'Teams & Positions', moduleCode: 'MOD_ORG', description: 'Team structures, job titles, and position hierarchies', displayOrder: 2 },

  // Identity & Access Management
  { groupCode: 'USER_OPERATIONS', groupName: 'User Operations', moduleCode: 'MOD_IAM', description: 'Provision, update, disable user accounts and reset passwords', displayOrder: 1 },
  { groupCode: 'USER_SECURITY', groupName: 'User Security & Sessions', moduleCode: 'MOD_IAM', description: 'Session management, MFA status, and account locking', displayOrder: 2 },

  // Role & Permission Management
  { groupCode: 'ROLE_DEFINITIONS', groupName: 'Role Definition', moduleCode: 'MOD_RBAC', description: 'Create, update, and manage custom and system roles', displayOrder: 1 },
  { groupCode: 'ROLE_MATRIX', groupName: 'Permission Assignment', moduleCode: 'MOD_RBAC', description: 'Assign granular permissions to roles via Permission Matrix', displayOrder: 2 },

  // Service Catalog Management
  { groupCode: 'CATALOG_ITEMS', groupName: 'Service Directory & Items', moduleCode: 'MOD_CATALOG', description: 'Service catalog items, specifications, and availability', displayOrder: 1 },
  { groupCode: 'CATALOG_CONFIG', groupName: 'Service Categories & Pricing', moduleCode: 'MOD_CATALOG', description: 'Service category taxonomy, pricing rules, and billing options', displayOrder: 2 },

  // Issue Request Management
  { groupCode: 'ISSUE_REQUESTS', groupName: 'Request Operations', moduleCode: 'MOD_ISSUE', description: 'Create, update, cancel, and comment on issue requests', displayOrder: 1 },
  { groupCode: 'ISSUE_APPROVALS', groupName: 'Approval Operations', moduleCode: 'MOD_ISSUE', description: 'Multi-level approval workflows, approve, and reject decisions', displayOrder: 2 },
  { groupCode: 'ISSUE_DISPATCH', groupName: 'Assignment & Dispatch', moduleCode: 'MOD_ISSUE', description: 'Workload dispatching, technician routing, and reassignments', displayOrder: 3 },
  { groupCode: 'ISSUE_WORKBENCH', groupName: 'Technician Operations', moduleCode: 'MOD_ISSUE', description: 'Technician workbench, issue resolution, work notes, and reopening', displayOrder: 4 },

  // Knowledge Base
  { groupCode: 'KB_ARTICLES', groupName: 'Knowledge Base Articles', moduleCode: 'MOD_KB', description: 'Create, publish, and manage solution articles and known issues', displayOrder: 1 },

  // Notification Management
  { groupCode: 'NOTIF_RULES', groupName: 'Notification Rules & Templates', moduleCode: 'MOD_NOTIF', description: 'Configure notification rules, templates, and delivery logs', displayOrder: 1 },

  // Reports & Analytics
  { groupCode: 'REPORT_OPS', groupName: 'Dashboards & Reports', moduleCode: 'MOD_REPORT', description: 'View operational reports, SLA analytics, and export metrics', displayOrder: 1 },

  // Audit Logs
  { groupCode: 'AUDIT_OPS', groupName: 'Audit & Compliance', moduleCode: 'MOD_AUDIT', description: 'Inspect security audit logs, compliance events, and export audit trails', displayOrder: 1 }
];

export const PERMISSIONS_DATA = [
  // Business Park Management
  { groupCode: 'PARK_TOPOLOGY', code: 'Building.Read', name: 'View Campus Topology', desc: 'View business park campus, buildings, and blocks', scope: 'ALL' },
  { groupCode: 'PARK_TOPOLOGY', code: 'Building.Create', name: 'Create Buildings', desc: 'Add new buildings to campus topology', scope: 'ALL' },
  { groupCode: 'PARK_TOPOLOGY', code: 'Building.Update', name: 'Update Buildings', desc: 'Modify building details and specifications', scope: 'ALL' },
  { groupCode: 'PARK_TOPOLOGY', code: 'Building.Delete', name: 'Delete Buildings', desc: 'Decommission building records', scope: 'ALL' },

  { groupCode: 'PARK_SPACE', code: 'Floor.Manage', name: 'Manage Floor Levels', desc: 'Configure floor layouts and floor attributes', scope: 'ALL' },
  { groupCode: 'PARK_SPACE', code: 'Office.Manage', name: 'Manage Office Units', desc: 'Create, allocate, and manage tenant office units', scope: 'ALL' },

  { groupCode: 'PARK_ZONES', code: 'Zone.Manage', name: 'Manage Facility Zones', desc: 'Define green zones, parking facilities, and landmarks', scope: 'ALL' },

  // Tenant Management
  { groupCode: 'TENANT_DIRECTORY', code: 'Tenant.Read', name: 'View Tenants Directory', desc: 'Access tenant company directory and profiles', scope: 'COMPANY' },
  { groupCode: 'TENANT_DIRECTORY', code: 'Tenant.Create', name: 'Register Tenant Company', desc: 'Onboard new tenant organizations', scope: 'ALL' },
  { groupCode: 'TENANT_DIRECTORY', code: 'Tenant.Update', name: 'Update Tenant Company', desc: 'Modify company profile and administrative contacts', scope: 'COMPANY' },
  { groupCode: 'TENANT_DIRECTORY', code: 'Tenant.Suspend', name: 'Suspend/Activate Tenant', desc: 'Suspend or activate tenant organization status', scope: 'ALL' },

  { groupCode: 'TENANT_CONTRACTS', code: 'Lease.Manage', name: 'Manage Lease Contracts', desc: 'Register lease agreements and contract terms', scope: 'COMPANY' },

  // Organization Management
  { groupCode: 'ORG_STRUCTURE', code: 'Department.Read', name: 'View Departments', desc: 'Inspect company department structure and org units', scope: 'COMPANY' },
  { groupCode: 'ORG_STRUCTURE', code: 'Department.Create', name: 'Create Departments', desc: 'Add new business units and departments', scope: 'COMPANY' },
  { groupCode: 'ORG_STRUCTURE', code: 'Department.Update', name: 'Update Departments', desc: 'Modify department details and managers', scope: 'COMPANY' },
  { groupCode: 'ORG_STRUCTURE', code: 'Department.Delete', name: 'Delete Departments', desc: 'Remove department structures', scope: 'COMPANY' },

  { groupCode: 'ORG_TEAMS', code: 'Team.Manage', name: 'Manage Teams & Positions', desc: 'Configure team rosters and position titles', scope: 'COMPANY' },

  // Identity & Access Management (User Operations)
  { groupCode: 'USER_OPERATIONS', code: 'User.Read.Own', name: 'View Own User Profile', desc: 'Access own profile and account credentials', scope: 'OWN' },
  { groupCode: 'USER_OPERATIONS', code: 'User.Read.Company', name: 'View Company Users', desc: 'Access employee directory within company', scope: 'COMPANY' },
  { groupCode: 'USER_OPERATIONS', code: 'User.Read.All', name: 'View All System Users', desc: 'Access user directory across all tenants', scope: 'ALL' },
  { groupCode: 'USER_OPERATIONS', code: 'User.Create', name: 'Register User Account', desc: 'Provision new employee or user accounts', scope: 'COMPANY' },
  { groupCode: 'USER_OPERATIONS', code: 'User.Update', name: 'Update User Account', desc: 'Edit employee profile, title, and contact details', scope: 'COMPANY' },
  { groupCode: 'USER_OPERATIONS', code: 'User.Disable', name: 'Disable / Lock Account', desc: 'Suspend, lock, or disable user accounts', scope: 'COMPANY' },
  { groupCode: 'USER_OPERATIONS', code: 'User.ResetPassword', name: 'Reset User Password', desc: 'Issue password reset and temporary credentials', scope: 'COMPANY' },

  { groupCode: 'USER_SECURITY', code: 'Session.Manage', name: 'Manage Active Sessions', desc: 'Inspect active sessions and revoke security tokens', scope: 'COMPANY' },

  // Role & Permission Management
  { groupCode: 'ROLE_DEFINITIONS', code: 'Role.Read', name: 'View Roles & Permissions', desc: 'Access role definitions and permissions', scope: 'COMPANY' },
  { groupCode: 'ROLE_DEFINITIONS', code: 'Role.Create', name: 'Create Custom Role', desc: 'Define new custom enterprise roles', scope: 'COMPANY' },
  { groupCode: 'ROLE_DEFINITIONS', code: 'Role.Update', name: 'Update Role Definition', desc: 'Edit role title and description', scope: 'COMPANY' },
  { groupCode: 'ROLE_DEFINITIONS', code: 'Role.Delete', name: 'Delete Custom Role', desc: 'Remove non-system custom roles', scope: 'COMPANY' },

  { groupCode: 'ROLE_MATRIX', code: 'Role.Permission.Assign', name: 'Assign Permissions to Role', desc: 'Configure granular permissions via Permission Matrix', scope: 'COMPANY' },
  { groupCode: 'ROLE_MATRIX', code: 'Role.Assign', name: 'Assign Roles to Users', desc: 'Allocate roles to employee accounts', scope: 'COMPANY' },

  // Service Catalog Management
  { groupCode: 'CATALOG_ITEMS', code: 'Service.Read', name: 'View Service Catalog', desc: 'Browse available catalog services and SLAs', scope: 'ALL' },
  { groupCode: 'CATALOG_ITEMS', code: 'Service.Create', name: 'Create Catalog Service', desc: 'Define new service catalog offerings', scope: 'ALL' },
  { groupCode: 'CATALOG_ITEMS', code: 'Service.Update', name: 'Update Catalog Service', desc: 'Modify service specifications and attributes', scope: 'ALL' },
  { groupCode: 'CATALOG_ITEMS', code: 'Service.Delete', name: 'Delete Catalog Service', desc: 'Decommission service catalog items', scope: 'ALL' },

  // Issue Request Management
  { groupCode: 'ISSUE_REQUESTS', code: 'Issue.Create', name: 'Create Issue Request', desc: 'Submit new issue or service requests', scope: 'OWN' },
  { groupCode: 'ISSUE_REQUESTS', code: 'Issue.Read.Own', name: 'View Own Requests', desc: 'Access requests created by self', scope: 'OWN' },
  { groupCode: 'ISSUE_REQUESTS', code: 'Issue.Read.Department', name: 'View Department Requests', desc: 'Access requests within own department', scope: 'DEPARTMENT' },
  { groupCode: 'ISSUE_REQUESTS', code: 'Issue.Read.Company', name: 'View Company Requests', desc: 'Access requests within tenant company', scope: 'COMPANY' },
  { groupCode: 'ISSUE_REQUESTS', code: 'Issue.Read.All', name: 'View All System Requests', desc: 'Access all requests across entire business park', scope: 'ALL' },
  { groupCode: 'ISSUE_REQUESTS', code: 'Issue.Update.OwnDraft', name: 'Update Own Request Draft', desc: 'Modify own submitted requests before assignment', scope: 'OWN' },
  { groupCode: 'ISSUE_REQUESTS', code: 'Issue.Cancel.Own', name: 'Cancel Own Request', desc: 'Cancel own submitted requests', scope: 'OWN' },
  { groupCode: 'ISSUE_REQUESTS', code: 'Issue.Comment', name: 'Add Comments & Work Notes', desc: 'Post discussion comments and work notes on requests', scope: 'OWN' },

  { groupCode: 'ISSUE_APPROVALS', code: 'Issue.Approve', name: 'Approve Issue Request', desc: 'Review and grant approval decisions', scope: 'DEPARTMENT' },
  { groupCode: 'ISSUE_APPROVALS', code: 'Issue.Reject', name: 'Reject Issue Request', desc: 'Decline approval with rejection reason', scope: 'DEPARTMENT' },

  { groupCode: 'ISSUE_DISPATCH', code: 'Issue.Assign', name: 'Assign Technician', desc: 'Dispatch request to field technician', scope: 'DEPARTMENT' },
  { groupCode: 'ISSUE_DISPATCH', code: 'Issue.Dispatch', name: 'Dispatch & Route Work', desc: 'Route requests to specialized maintenance teams', scope: 'COMPANY' },

  { groupCode: 'ISSUE_WORKBENCH', code: 'Issue.Read.Assigned', name: 'View Assigned Work', desc: 'Access requests assigned to self as technician', scope: 'OWN' },
  { groupCode: 'ISSUE_WORKBENCH', code: 'Issue.Resolve', name: 'Resolve Issue Request', desc: 'Mark work order as resolved with resolution summary', scope: 'OWN' },
  { groupCode: 'ISSUE_WORKBENCH', code: 'Issue.Close', name: 'Close Issue Request', desc: 'Perform final verification and close request', scope: 'COMPANY' },
  { groupCode: 'ISSUE_WORKBENCH', code: 'Issue.Reopen', name: 'Reopen Closed Issue', desc: 'Reopen unresolved requests', scope: 'COMPANY' },

  // Knowledge Base
  { groupCode: 'KB_ARTICLES', code: 'Knowledge.Read', name: 'View Solution Articles', desc: 'Read solution KB articles and FAQs', scope: 'ALL' },
  { groupCode: 'KB_ARTICLES', code: 'Knowledge.Publish', name: 'Publish KB Article', desc: 'Author and publish knowledge base solutions', scope: 'COMPANY' },

  // Notification Management
  { groupCode: 'NOTIF_RULES', code: 'Notification.Manage', name: 'Manage Notifications', desc: 'Configure notification templates and rules', scope: 'COMPANY' },

  // Reports & Analytics
  { groupCode: 'REPORT_OPS', code: 'Report.View', name: 'View Dashboards & Analytics', desc: 'Access operational dashboards and SLA reports', scope: 'COMPANY' },
  { groupCode: 'REPORT_OPS', code: 'Report.Export', name: 'Export Report Data', desc: 'Export operational metrics to Excel / PDF / CSV', scope: 'COMPANY' },
  { groupCode: 'REPORT_OPS', code: 'Report.Create', name: 'Create Saved Reports', desc: 'Create and configure custom saved reports and queries', scope: 'COMPANY' },
  { groupCode: 'REPORT_OPS', code: 'Report.Schedule', name: 'Schedule Automated Reports', desc: 'Configure automated recurring report schedules', scope: 'COMPANY' },
  { groupCode: 'REPORT_OPS', code: 'Report.Manage', name: 'Manage Reporting Governance', desc: 'Full administration of cross-tenant reports and schedules', scope: 'ALL' },

  // Audit Logs
  { groupCode: 'AUDIT_OPS', code: 'Audit.Read', name: 'View Audit Logs', desc: 'Inspect security audit trail of system events and RBAC mutations', scope: 'COMPANY' },
  { groupCode: 'AUDIT_OPS', code: 'Audit.Export', name: 'Export Audit Logs', desc: 'Export compliance audit log records', scope: 'COMPANY' }
];

export async function seedEnterpriseRBAC() {
  console.log('--- Initializing Enterprise System Modules, Permission Groups, and Granular Permissions ---');

  // 1. Ensure SystemModule table exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS SystemModule (
      SystemModuleID BIGINT AUTO_INCREMENT PRIMARY KEY,
      ModuleCode VARCHAR(50) NOT NULL UNIQUE,
      ModuleName VARCHAR(150) NOT NULL,
      Description VARCHAR(500) NULL,
      DisplayOrder INT NOT NULL DEFAULT 0,
      IsActive TINYINT NOT NULL DEFAULT 1,
      IsDeleted TINYINT NOT NULL DEFAULT 0,
      CreatedBy BIGINT NOT NULL DEFAULT 1,
      CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Ensure SystemModuleID column in PermissionGroup table
  try {
    const cols = await db.query(`SHOW COLUMNS FROM PermissionGroup LIKE 'SystemModuleID'`);
    if (cols.length === 0) {
      await db.query(`ALTER TABLE PermissionGroup ADD COLUMN SystemModuleID BIGINT NULL;`);
    }
  } catch (err) {
    console.warn('Column SystemModuleID check warning:', err.message);
  }

  // 2. Seed System Modules
  const moduleMap = {};
  for (const mod of SYSTEM_MODULES_DATA) {
    const existing = await db.query(`SELECT SystemModuleID FROM SystemModule WHERE ModuleCode = ? AND IsDeleted = 0 LIMIT 1`, [mod.moduleCode]);
    let modId;
    if (existing[0]) {
      modId = existing[0].SystemModuleID;
      await db.query(
        `UPDATE SystemModule SET ModuleName = ?, Description = ?, DisplayOrder = ? WHERE SystemModuleID = ?`,
        [mod.moduleName, mod.description, mod.displayOrder, modId]
      );
    } else {
      const ins = await db.query(
        `INSERT INTO SystemModule (ModuleCode, ModuleName, Description, DisplayOrder, CreatedBy) VALUES (?, ?, ?, ?, 1)`,
        [mod.moduleCode, mod.moduleName, mod.description, mod.displayOrder]
      );
      modId = ins.insertId;
    }
    moduleMap[mod.moduleCode] = modId;
  }

  // 3. Seed Permission Groups linked to System Module
  const groupMap = {};
  for (const grp of PERMISSION_GROUPS_DATA) {
    const modId = moduleMap[grp.moduleCode] || null;
    const existing = await db.query(`SELECT PermissionGroupID FROM PermissionGroup WHERE GroupCode = ? AND IsDeleted = 0 LIMIT 1`, [grp.groupCode]);
    let grpId;
    if (existing[0]) {
      grpId = existing[0].PermissionGroupID;
      await db.query(
        `UPDATE PermissionGroup SET SystemModuleID = ?, GroupName = ?, Description = ? WHERE PermissionGroupID = ?`,
        [modId, grp.groupName, grp.description, grpId]
      );
    } else {
      const ins = await db.query(
        `INSERT INTO PermissionGroup (SystemModuleID, GroupCode, GroupName, Description, CreatedBy) VALUES (?, ?, ?, ?, 1)`,
        [modId, grp.groupCode, grp.groupName, grp.description]
      );
      grpId = ins.insertId;
    }
    groupMap[grp.groupCode] = grpId;
  }

  // 4. Seed Granular Permissions
  for (const perm of PERMISSIONS_DATA) {
    const grpId = groupMap[perm.groupCode] || null;
    const existing = await db.query(`SELECT PermissionID FROM Permission WHERE PermissionCode = ? AND IsDeleted = 0 LIMIT 1`, [perm.code]);
    if (existing[0]) {
      await db.query(
        `UPDATE Permission SET PermissionGroupID = ?, PermissionName = ?, Description = ? WHERE PermissionID = ?`,
        [grpId, perm.name, perm.desc, existing[0].PermissionID]
      );
    } else {
      await db.query(
        `INSERT INTO Permission (PermissionGroupID, ResourcePermissionID, PermissionCode, PermissionName, Description, CreatedBy) VALUES (?, 1, ?, ?, ?, 1)`,
        [grpId, perm.code, perm.name, perm.desc]
      );
    }
  }

  console.log('✅ Enterprise System Modules, Permission Groups, and Granular Permissions successfully seeded!');
}

if (process.argv[1] && process.argv[1].endsWith('seed-permissions.js')) {
  seedEnterpriseRBAC().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

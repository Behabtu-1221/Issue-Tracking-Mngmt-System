/**
 * Enterprise RBAC Permission, Module & Permission Group Dictionary
 * Follows ServiceNow / Microsoft Dynamics 365 / Oracle / Jira Service Management Granular Permission Model
 *
 * Hierarchy: SystemModule → PermissionGroup → Permission
 */

export const ADMIN_SCOPES = {
  BUSINESS_PARK: 'BUSINESS_PARK',
  TENANT_COMPANY: 'TENANT_COMPANY'
};

export const DATA_SCOPES = {
  OWN: 'OWN',
  DEPARTMENT: 'DEPARTMENT',
  COMPANY: 'COMPANY',
  ALL: 'ALL'
};

// ─────────────────────────────────────────────────────
// Flat Permission Code Dictionary
// ─────────────────────────────────────────────────────
export const PERMISSIONS = {
  // Business Park Management
  BUILDING_READ: 'Building.Read',
  BUILDING_CREATE: 'Building.Create',
  BUILDING_UPDATE: 'Building.Update',
  BUILDING_DELETE: 'Building.Delete',
  FLOOR_MANAGE: 'Floor.Manage',
  OFFICE_MANAGE: 'Office.Manage',
  ZONE_MANAGE: 'Zone.Manage',

  // Tenant Management
  TENANT_READ: 'Tenant.Read',
  TENANT_CREATE: 'Tenant.Create',
  TENANT_UPDATE: 'Tenant.Update',
  TENANT_SUSPEND: 'Tenant.Suspend',
  LEASE_MANAGE: 'Lease.Manage',

  // Organization Management
  DEPARTMENT_READ: 'Department.Read',
  DEPARTMENT_CREATE: 'Department.Create',
  DEPARTMENT_UPDATE: 'Department.Update',
  DEPARTMENT_DELETE: 'Department.Delete',
  TEAM_MANAGE: 'Team.Manage',

  // Identity & Access Management
  USER_READ_OWN: 'User.Read.Own',
  USER_READ_COMPANY: 'User.Read.Company',
  USER_READ_ALL: 'User.Read.All',
  USER_CREATE: 'User.Create',
  USER_UPDATE: 'User.Update',
  USER_DISABLE: 'User.Disable',
  USER_RESET_PASSWORD: 'User.ResetPassword',
  SESSION_MANAGE: 'Session.Manage',

  // Role & Permission Management
  ROLE_READ: 'Role.Read',
  ROLE_CREATE: 'Role.Create',
  ROLE_UPDATE: 'Role.Update',
  ROLE_DELETE: 'Role.Delete',
  ROLE_PERMISSION_ASSIGN: 'Role.Permission.Assign',
  ROLE_ASSIGN: 'Role.Assign',

  // Service Catalog Management
  SERVICE_READ: 'Service.Read',
  SERVICE_CREATE: 'Service.Create',
  SERVICE_UPDATE: 'Service.Update',
  SERVICE_DELETE: 'Service.Delete',

  // Issue Request Management
  ISSUE_CREATE: 'Issue.Create',
  ISSUE_READ_OWN: 'Issue.Read.Own',
  ISSUE_READ_DEPARTMENT: 'Issue.Read.Department',
  ISSUE_READ_COMPANY: 'Issue.Read.Company',
  ISSUE_READ_ALL: 'Issue.Read.All',
  ISSUE_UPDATE_OWN_DRAFT: 'Issue.Update.OwnDraft',
  ISSUE_CANCEL_OWN: 'Issue.Cancel.Own',
  ISSUE_COMMENT: 'Issue.Comment',
  ISSUE_APPROVE: 'Issue.Approve',
  ISSUE_REJECT: 'Issue.Reject',
  ISSUE_ASSIGN: 'Issue.Assign',
  ISSUE_DISPATCH: 'Issue.Dispatch',
  ISSUE_READ_ASSIGNED: 'Issue.Read.Assigned',
  ISSUE_ACCEPT_ASSIGNMENT: 'Issue.AcceptAssignment',
  ISSUE_UPDATE_ASSIGNED: 'Issue.Update.Assigned',
  ISSUE_COMMENT_ASSIGNED: 'Issue.Comment.Assigned',
  ISSUE_ATTACHMENT_UPLOAD_ASSIGNED: 'Issue.Attachment.Upload.Assigned',
  ISSUE_REQUEST_INFO_ASSIGNED: 'Issue.RequestInformation.Assigned',
  ISSUE_ESCALATE_ASSIGNED: 'Issue.Escalate.Assigned',
  ISSUE_RESOLVE: 'Issue.Resolve',
  ISSUE_CLOSE: 'Issue.Close',
  ISSUE_REOPEN: 'Issue.Reopen',

  // Knowledge Base
  KNOWLEDGE_READ: 'Knowledge.Read',
  KNOWLEDGE_PUBLISH: 'Knowledge.Publish',

  // Notification Management
  NOTIFICATION_MANAGE: 'Notification.Manage',
  NOTIFICATION_READ_OWN: 'Notification.Read.Own',

  // Communication Management
  COMMUNICATION_READ: 'Communication.Read',
  COMMUNICATION_MANAGE: 'Communication.Manage',

  // User Profile
  PROFILE_READ_OWN: 'Profile.Read.Own',
  PROFILE_UPDATE_OWN: 'Profile.Update.Own',
  PASSWORD_CHANGE: 'Password.Change',

  // Reports & Analytics
  REPORT_VIEW: 'Report.View',
  REPORT_EXPORT: 'Report.Export',

  // Audit Logs
  AUDIT_READ: 'Audit.Read',
  AUDIT_EXPORT: 'Audit.Export'
};

// ─────────────────────────────────────────────────────
// Module → Permission Group → Permission Hierarchy
// This drives the Permission Matrix UI.
// ─────────────────────────────────────────────────────
export const PERMISSION_MODULE_TREE = [
  {
    moduleCode: 'MOD_PARK',
    moduleName: 'Business Park Management',
    moduleScope: ADMIN_SCOPES.BUSINESS_PARK,
    groups: [
      {
        groupCode: 'PARK_TOPOLOGY',
        groupName: 'Park Topology & Campus',
        permissions: [
          { code: 'Building.Read', name: 'View Campus Topology', description: 'View business park campus, buildings, and blocks', scope: 'ALL' },
          { code: 'Building.Create', name: 'Create Buildings', description: 'Add new buildings to campus topology', scope: 'ALL' },
          { code: 'Building.Update', name: 'Update Buildings', description: 'Modify building details and specifications', scope: 'ALL' },
          { code: 'Building.Delete', name: 'Delete Buildings', description: 'Decommission building records', scope: 'ALL' }
        ]
      },
      {
        groupCode: 'PARK_SPACE',
        groupName: 'Floor & Space Allocation',
        permissions: [
          { code: 'Floor.Manage', name: 'Manage Floor Levels', description: 'Configure floor layouts and floor attributes', scope: 'ALL' },
          { code: 'Office.Manage', name: 'Manage Office Units', description: 'Create, allocate, and manage tenant office units', scope: 'ALL' }
        ]
      },
      {
        groupCode: 'PARK_ZONES',
        groupName: 'Facility Zones & Landmarks',
        permissions: [
          { code: 'Zone.Manage', name: 'Manage Facility Zones', description: 'Define green zones, parking facilities, and landmarks', scope: 'ALL' }
        ]
      }
    ]
  },
  {
    moduleCode: 'MOD_TENANT',
    moduleName: 'Tenant Management',
    moduleScope: ADMIN_SCOPES.BUSINESS_PARK,
    groups: [
      {
        groupCode: 'TENANT_DIRECTORY',
        groupName: 'Tenant Directory & Profiles',
        permissions: [
          { code: 'Tenant.Read', name: 'View Tenants Directory', description: 'Access tenant company directory and profiles', scope: 'COMPANY' },
          { code: 'Tenant.Create', name: 'Register Tenant Company', description: 'Onboard new tenant organizations', scope: 'ALL' },
          { code: 'Tenant.Update', name: 'Update Tenant Company', description: 'Modify company profile and admin contacts', scope: 'COMPANY' },
          { code: 'Tenant.Suspend', name: 'Suspend / Activate Tenant', description: 'Suspend or activate tenant organization status', scope: 'ALL' }
        ]
      },
      {
        groupCode: 'TENANT_CONTRACTS',
        groupName: 'Lease Contracts & Reps',
        permissions: [
          { code: 'Lease.Manage', name: 'Manage Lease Contracts', description: 'Register lease agreements and contract terms', scope: 'COMPANY' }
        ]
      }
    ]
  },
  {
    moduleCode: 'MOD_ORG',
    moduleName: 'Organization Management',
    moduleScope: ADMIN_SCOPES.TENANT_COMPANY,
    groups: [
      {
        groupCode: 'ORG_STRUCTURE',
        groupName: 'Departments & Units',
        permissions: [
          { code: 'Department.Read', name: 'View Departments', description: 'Inspect company department structure and org units', scope: 'COMPANY' },
          { code: 'Department.Create', name: 'Create Departments', description: 'Add new business units and departments', scope: 'COMPANY' },
          { code: 'Department.Update', name: 'Update Departments', description: 'Modify department details and managers', scope: 'COMPANY' },
          { code: 'Department.Delete', name: 'Delete Departments', description: 'Remove department structures', scope: 'COMPANY' }
        ]
      },
      {
        groupCode: 'ORG_TEAMS',
        groupName: 'Teams & Positions',
        permissions: [
          { code: 'Team.Manage', name: 'Manage Teams & Positions', description: 'Configure team rosters and position titles', scope: 'COMPANY' }
        ]
      }
    ]
  },
  {
    moduleCode: 'MOD_IAM',
    moduleName: 'Identity & Access Management',
    moduleScope: 'BOTH',
    groups: [
      {
        groupCode: 'USER_OPERATIONS',
        groupName: 'User Operations',
        permissions: [
          { code: 'User.Read.Own', name: 'View Own User Profile', description: 'Access own profile and account credentials', scope: 'OWN' },
          { code: 'User.Read.Company', name: 'View Company Users', description: 'Access employee directory within company', scope: 'COMPANY' },
          { code: 'User.Read.All', name: 'View All System Users', description: 'Access user directory across all tenants', scope: 'ALL' },
          { code: 'User.Create', name: 'Register User Account', description: 'Provision new employee or user accounts', scope: 'COMPANY' },
          { code: 'User.Update', name: 'Update User Account', description: 'Edit employee profile, title, and contact details', scope: 'COMPANY' },
          { code: 'User.Disable', name: 'Disable / Lock Account', description: 'Suspend, lock, or disable user accounts', scope: 'COMPANY' },
          { code: 'User.ResetPassword', name: 'Reset User Password', description: 'Issue password reset and temporary credentials', scope: 'COMPANY' }
        ]
      },
      {
        groupCode: 'USER_SECURITY',
        groupName: 'User Security & Sessions',
        permissions: [
          { code: 'Session.Manage', name: 'Manage Active Sessions', description: 'Inspect active sessions and revoke security tokens', scope: 'COMPANY' }
        ]
      }
    ]
  },
  {
    moduleCode: 'MOD_RBAC',
    moduleName: 'Role & Permission Management',
    moduleScope: 'BOTH',
    groups: [
      {
        groupCode: 'ROLE_DEFINITIONS',
        groupName: 'Role Definition',
        permissions: [
          { code: 'Role.Read', name: 'View Roles & Permissions', description: 'Access role definitions and permissions', scope: 'COMPANY' },
          { code: 'Role.Create', name: 'Create Custom Role', description: 'Define new custom enterprise roles', scope: 'COMPANY' },
          { code: 'Role.Update', name: 'Update Role Definition', description: 'Edit role title and description', scope: 'COMPANY' },
          { code: 'Role.Delete', name: 'Delete Custom Role', description: 'Remove non-system custom roles', scope: 'COMPANY' }
        ]
      },
      {
        groupCode: 'ROLE_MATRIX',
        groupName: 'Permission Assignment',
        permissions: [
          { code: 'Role.Permission.Assign', name: 'Assign Permissions to Role', description: 'Configure granular permissions via Permission Matrix', scope: 'COMPANY' },
          { code: 'Role.Assign', name: 'Assign Roles to Users', description: 'Allocate roles to employee accounts', scope: 'COMPANY' }
        ]
      }
    ]
  },
  {
    moduleCode: 'MOD_CATALOG',
    moduleName: 'Service Catalog Management',
    moduleScope: 'BOTH',
    groups: [
      {
        groupCode: 'CATALOG_ITEMS',
        groupName: 'Service Directory & Items',
        permissions: [
          { code: 'Service.Read', name: 'View Service Catalog', description: 'Browse available catalog services and SLAs', scope: 'ALL' },
          { code: 'Service.Create', name: 'Create Catalog Service', description: 'Define new service catalog offerings', scope: 'ALL' },
          { code: 'Service.Update', name: 'Update Catalog Service', description: 'Modify service specifications and attributes', scope: 'ALL' },
          { code: 'Service.Delete', name: 'Delete Catalog Service', description: 'Decommission service catalog items', scope: 'ALL' }
        ]
      }
    ]
  },
  {
    moduleCode: 'MOD_ISSUE',
    moduleName: 'Issue Request Management',
    moduleScope: 'BOTH',
    groups: [
      {
        groupCode: 'ISSUE_REQUESTS',
        groupName: 'Request Operations',
        permissions: [
          { code: 'Issue.Create', name: 'Create Issue Request', description: 'Submit new issue or service requests', scope: 'OWN' },
          { code: 'Issue.Read.Own', name: 'View Own Requests', description: 'Access requests created by self', scope: 'OWN' },
          { code: 'Issue.Read.Department', name: 'View Department Requests', description: 'Access requests within own department', scope: 'DEPARTMENT' },
          { code: 'Issue.Read.Company', name: 'View Company Requests', description: 'Access requests within tenant company', scope: 'COMPANY' },
          { code: 'Issue.Read.All', name: 'View All System Requests', description: 'Access all requests across entire business park', scope: 'ALL' },
          { code: 'Issue.Update.OwnDraft', name: 'Update Own Request Draft', description: 'Modify own submitted requests before assignment', scope: 'OWN' },
          { code: 'Issue.Cancel.Own', name: 'Cancel Own Request', description: 'Cancel own submitted requests', scope: 'OWN' },
          { code: 'Issue.Comment', name: 'Add Comments & Work Notes', description: 'Post discussion comments and work notes on requests', scope: 'OWN' }
        ]
      },
      {
        groupCode: 'ISSUE_APPROVALS',
        groupName: 'Approval Operations',
        permissions: [
          { code: 'Issue.Approve', name: 'Approve Issue Request', description: 'Review and grant approval decisions', scope: 'DEPARTMENT' },
          { code: 'Issue.Reject', name: 'Reject Issue Request', description: 'Decline approval with rejection reason', scope: 'DEPARTMENT' }
        ]
      },
      {
        groupCode: 'ISSUE_DISPATCH',
        groupName: 'Assignment & Dispatch',
        permissions: [
          { code: 'Issue.Assign', name: 'Assign Technician', description: 'Dispatch request to field technician', scope: 'DEPARTMENT' },
          { code: 'Issue.Dispatch', name: 'Dispatch & Route Work', description: 'Route requests to specialized maintenance teams', scope: 'COMPANY' }
        ]
      },
      {
        groupCode: 'ISSUE_WORKBENCH',
        groupName: 'Technician Operations',
        permissions: [
          { code: 'Issue.Read.Assigned', name: 'View Assigned Work', description: 'Access requests assigned to self as technician', scope: 'OWN' },
          { code: 'Issue.Resolve', name: 'Resolve Issue Request', description: 'Mark work order as resolved with resolution summary', scope: 'OWN' },
          { code: 'Issue.Close', name: 'Close Issue Request', description: 'Perform final verification and close request', scope: 'COMPANY' },
          { code: 'Issue.Reopen', name: 'Reopen Closed Issue', description: 'Reopen unresolved requests', scope: 'COMPANY' }
        ]
      }
    ]
  },
  {
    moduleCode: 'MOD_KB',
    moduleName: 'Knowledge Base',
    moduleScope: 'BOTH',
    groups: [
      {
        groupCode: 'KB_ARTICLES',
        groupName: 'Knowledge Base Articles',
        permissions: [
          { code: 'Knowledge.Read', name: 'View Solution Articles', description: 'Read solution KB articles and FAQs', scope: 'ALL' },
          { code: 'Knowledge.Publish', name: 'Publish KB Article', description: 'Author and publish knowledge base solutions', scope: 'COMPANY' }
        ]
      }
    ]
  },
  {
    moduleCode: 'MOD_NOTIF',
    moduleName: 'Notification Management',
    moduleScope: 'BOTH',
    groups: [
      {
        groupCode: 'NOTIF_RULES',
        groupName: 'Notification Rules & Templates',
        permissions: [
          { code: 'Notification.Manage', name: 'Manage Notifications', description: 'Configure notification templates and rules', scope: 'COMPANY' }
        ]
      }
    ]
  },
  {
    moduleCode: 'MOD_REPORT',
    moduleName: 'Reports & Analytics',
    moduleScope: 'BOTH',
    groups: [
      {
        groupCode: 'REPORT_OPS',
        groupName: 'Dashboards & Reports',
        permissions: [
          { code: 'Report.View', name: 'View Dashboards & Analytics', description: 'Access operational dashboards and SLA reports', scope: 'COMPANY' },
          { code: 'Report.Export', name: 'Export Report Data', description: 'Export operational metrics to Excel / PDF', scope: 'COMPANY' }
        ]
      }
    ]
  },
  {
    moduleCode: 'MOD_AUDIT',
    moduleName: 'Audit Logs',
    moduleScope: 'BOTH',
    groups: [
      {
        groupCode: 'AUDIT_OPS',
        groupName: 'Audit & Compliance',
        permissions: [
          { code: 'Audit.Read', name: 'View Audit Logs', description: 'Inspect security audit trail of system events', scope: 'COMPANY' },
          { code: 'Audit.Export', name: 'Export Audit Logs', description: 'Export compliance audit log records', scope: 'COMPANY' }
        ]
      }
    ]
  }
];

// ─────────────────────────────────────────────────────
// Backwards-Compatible Flat Permission Groups (Legacy)
// ─────────────────────────────────────────────────────
export const PERMISSION_GROUPS = PERMISSION_MODULE_TREE.flatMap(mod =>
  mod.groups.map(grp => ({
    resourceKey: grp.groupCode,
    title: grp.groupName,
    scope: mod.moduleScope,
    moduleName: mod.moduleName,
    moduleCode: mod.moduleCode,
    permissions: grp.permissions.map(p => ({ code: p.code, name: p.name, description: p.description }))
  }))
);

// ─────────────────────────────────────────────────────
// Default System Role Permission Mapping Presets
// ─────────────────────────────────────────────────────
export const DEFAULT_ROLE_PRESETS = {
  BUSINESS_PARK_ADMIN: {
    roleCode: 'BUSINESS_PARK_ADMIN',
    roleName: 'Business Park Administrator',
    scope: ADMIN_SCOPES.BUSINESS_PARK,
    permissions: [
      '*',
      'Building.Read', 'Building.Create', 'Building.Update', 'Building.Delete',
      'Floor.Manage', 'Office.Manage', 'Zone.Manage',
      'Tenant.Read', 'Tenant.Create', 'Tenant.Update', 'Tenant.Suspend', 'Lease.Manage',
      'Department.Read', 'Department.Create', 'Department.Update', 'Department.Delete', 'Team.Manage',
      'User.Read.Own', 'User.Read.Company', 'User.Read.All', 'User.Create', 'User.Update', 'User.Disable', 'User.ResetPassword', 'Session.Manage',
      'Role.Read', 'Role.Create', 'Role.Update', 'Role.Delete', 'Role.Permission.Assign', 'Role.Assign',
      'Issue.Create', 'Issue.Read.Own', 'Issue.Read.Department', 'Issue.Read.Company', 'Issue.Read.All', 'Issue.Approve', 'Issue.Assign', 'Issue.Dispatch', 'Issue.Close',
      'Service.Read', 'Service.Create', 'Service.Update', 'Service.Delete',
      'Knowledge.Read', 'Knowledge.Publish',
      'Report.View', 'Report.Export',
      'Audit.Read', 'Audit.Export',
      'Notification.Manage', 'Communication.Read', 'Document.Read'
    ]
  },
  TENANT_REPRESENTATIVE: {
    roleCode: 'TENANT_REPRESENTATIVE',
    roleName: 'Tenant Representative',
    scope: ADMIN_SCOPES.TENANT_COMPANY,
    permissions: [
      'Tenant.Read',
      'User.Read.Own', 'User.Read.Company',
      'Issue.Create', 'Issue.Read.Own', 'Issue.Read.Company', 'Issue.Update.OwnDraft', 'Issue.Cancel.Own', 'Issue.Comment',
      'Service.Read',
      'Knowledge.Read',
      'Report.View',
      'Notification.Manage',
      'Communication.Read'
    ]
  },
  COMPANY_ADMIN: {
    roleCode: 'COMPANY_ADMIN',
    roleName: 'Company Administrator',
    scope: ADMIN_SCOPES.TENANT_COMPANY,
    permissions: [
      'Department.Read', 'Department.Create', 'Department.Update', 'Department.Delete', 'Team.Manage',
      'User.Read.Own', 'User.Read.Company', 'User.Create', 'User.Update', 'User.Disable', 'User.ResetPassword', 'Session.Manage',
      'Role.Read', 'Role.Create', 'Role.Update', 'Role.Delete', 'Role.Permission.Assign', 'Role.Assign',
      'Issue.Create', 'Issue.Read.Own', 'Issue.Read.Company', 'Issue.Update.OwnDraft', 'Issue.Cancel.Own', 'Issue.Comment',
      'Issue.Close',
      'Service.Read',
      'Knowledge.Read',
      'Report.View', 'Report.Export',
      'Audit.Read',
      'Notification.Manage',
      'Communication.Read'
    ]
  },
  DEPARTMENT_MANAGER: {
    roleCode: 'DEPARTMENT_MANAGER',
    roleName: 'Department Manager',
    scope: ADMIN_SCOPES.TENANT_COMPANY,
    permissions: [
      'Department.Read',
      'User.Read.Own', 'User.Read.Company',
      'Issue.Create', 'Issue.Read.Own', 'Issue.Read.Department', 'Issue.Update.OwnDraft', 'Issue.Cancel.Own', 'Issue.Comment',
      'Issue.Approve', 'Issue.Reject',
      'Issue.Assign', 'Issue.Dispatch',
      'Issue.Close',
      'Service.Read',
      'Knowledge.Read',
      'Report.View',
      'Communication.Read'
    ]
  },
  TECHNICIAN: {
    roleCode: 'TECHNICIAN',
    roleName: 'Field Technician',
    scope: ADMIN_SCOPES.TENANT_COMPANY,
    permissions: [
      'User.Read.Own',
      'Profile.Read.Own', 'Profile.Update.Own', 'Password.Change',
      'Issue.Create', 'Issue.Read.Own', 'Issue.Read.Assigned', 'Issue.AcceptAssignment',
      'Issue.Update.Assigned', 'Issue.Comment', 'Issue.Comment.Assigned',
      'Issue.Attachment.Upload.Assigned', 'Issue.RequestInformation.Assigned',
      'Issue.Escalate.Assigned', 'Issue.Resolve',
      'Service.Read',
      'Knowledge.Read',
      'Notification.Read.Own',
      'Communication.Read'
    ]
  },
  EMPLOYEE: {
    roleCode: 'EMPLOYEE',
    roleName: 'Company Employee',
    scope: ADMIN_SCOPES.TENANT_COMPANY,
    permissions: [
      'User.Read.Own',
      'Issue.Create', 'Issue.Read.Own', 'Issue.Update.OwnDraft', 'Issue.Cancel.Own', 'Issue.Comment',
      'Service.Read',
      'Knowledge.Read',
      'Communication.Read'
    ]
  }
};

// Preset Aliases
DEFAULT_ROLE_PRESETS.PARK_SUPER_ADMIN = DEFAULT_ROLE_PRESETS.BUSINESS_PARK_ADMIN;
DEFAULT_ROLE_PRESETS.PARK_ADMIN = DEFAULT_ROLE_PRESETS.BUSINESS_PARK_ADMIN;
DEFAULT_ROLE_PRESETS.SUPER_ADMIN = DEFAULT_ROLE_PRESETS.BUSINESS_PARK_ADMIN;
DEFAULT_ROLE_PRESETS.TENANT_ADMIN = DEFAULT_ROLE_PRESETS.TENANT_REPRESENTATIVE;
DEFAULT_ROLE_PRESETS.ADMIN = DEFAULT_ROLE_PRESETS.TENANT_REPRESENTATIVE;
DEFAULT_ROLE_PRESETS.MANAGER = DEFAULT_ROLE_PRESETS.DEPARTMENT_MANAGER;
DEFAULT_ROLE_PRESETS.DISPATCHER = DEFAULT_ROLE_PRESETS.DEPARTMENT_MANAGER;

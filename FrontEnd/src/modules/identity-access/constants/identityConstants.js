export const IDENTITY_TABS = [
  { id: 'users', label: 'User Directory', icon: 'Users', description: 'Manage platform user accounts, profiles, and account statuses' },
  { id: 'sessions', label: 'Active Sessions', icon: 'Monitor', description: 'Monitor and terminate live user authentication sessions' },
  { id: 'audit', label: 'Audit Trail', icon: 'FileText', description: 'Security audit log of user logins, role changes, and account updates' }
];

export const ACCOUNT_STATUSES = [
  { value: 'MUST_CHANGE_PASSWORD', label: 'Pending Activation', badgeClass: 'badge-warning' },
  { value: 'ACTIVE', label: 'Active', badgeClass: 'badge-success' },
  { value: 'SUSPENDED', label: 'Suspended', badgeClass: 'badge-danger' },
  { value: 'DEACTIVATED', label: 'Deactivated', badgeClass: 'badge-secondary' }
];

export const PERMISSION_MODULES = [
  { code: 'IDENTITY', label: 'Identity & Access Management' },
  { code: 'CONFIG', label: 'Configuration & Settings' },
  { code: 'TENANT', label: 'Tenant Management' },
  { code: 'ISSUE', label: 'Issue & Ticket Management' },
  { code: 'APPROVAL', label: 'Approval Workflows' },
  { code: 'NOTIFICATION', label: 'Notification Services' }
];

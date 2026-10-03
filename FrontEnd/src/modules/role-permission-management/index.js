/**
 * Enterprise Role & Permission Management Module - Public API
 * Central authorization infrastructure for the entire platform.
 */

// Constants
export { ADMIN_SCOPES, RESOURCE_TYPES, PERMISSIONS, PERMISSION_GROUPS, DEFAULT_ROLE_PRESETS } from './constants/permissionConstants';

// Services
export { authorizationService } from './services/authorizationService';

// Context & Hooks
export { PermissionProvider, PermissionContext, usePermissionContext } from './contexts/PermissionContext';
export { usePermission } from './hooks/usePermission';

// Guards
export { Can } from './guards/Can';
export { ProtectedRoute } from './guards/ProtectedRoute';

// Components
export { default as AccessDeniedPage } from './components/AccessDeniedPage';
export { default as RolePermissionMatrix } from './components/RolePermissionMatrix';
export { default as CompanyRoleModal } from './components/CompanyRoleModal';
export { default as UserRoleAssignModal } from './components/UserRoleAssignModal';
export { default as RbacAuditLogsTab } from './components/RbacAuditLogsTab';

// Pages
export { default as RolePermissionPage } from './pages/RolePermissionPage';

// API
export { rbacApi } from './api/rbacApi';

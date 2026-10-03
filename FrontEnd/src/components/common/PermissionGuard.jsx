import React from 'react';
import { usePermissionContext } from '../../modules/role-permission-management/contexts/PermissionContext';

/**
 * Reusable PermissionGuard Component
 * Renders children only if user possesses the required permission(s).
 *
 * Usage:
 * <PermissionGuard permission="Issue.Approve">
 *   <button>Approve Request</button>
 * </PermissionGuard>
 *
 * <PermissionGuard anyPermission={["Issue.Assign", "Issue.Reassign"]}>
 *   <button>Assign Technician</button>
 * </PermissionGuard>
 */
export function PermissionGuard({ permission, anyPermission, allPermissions, fallback = null, children }) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();

  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return fallback;
  }

  if (allPermissions && !hasAllPermissions(allPermissions)) {
    return fallback;
  }

  return <>{children}</>;
}

export default PermissionGuard;

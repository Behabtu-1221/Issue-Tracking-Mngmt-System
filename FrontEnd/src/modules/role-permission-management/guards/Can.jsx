import React from 'react';
import { usePermissionContext } from '../contexts/PermissionContext';

/**
 * Declarative UI Authorization Guard Component
 * Conditionally renders children if user possesses required permission.
 *
 * Props:
 *   - permission: string (e.g. "Request.Approve")
 *   - any: string[] (e.g. ["Request.Assign", "Request.Reassign"])
 *   - all: string[] (e.g. ["Report.View", "Report.Export"])
 *   - fallback: ReactNode (Optional content to render when unauthorized)
 */
export function Can({ permission, any, all, fallback = null, children }) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();

  let authorized = true;

  if (permission) {
    authorized = hasPermission(permission);
  } else if (any && Array.isArray(any)) {
    authorized = hasAnyPermission(any);
  } else if (all && Array.isArray(all)) {
    authorized = hasAllPermissions(all);
  }

  if (!authorized) {
    return fallback;
  }

  return <>{children}</>;
}

export default Can;

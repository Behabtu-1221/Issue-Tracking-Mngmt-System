import React from 'react';
import { usePermissionContext } from '../contexts/PermissionContext';
import AccessDeniedPage from '../components/AccessDeniedPage';

/**
 * Route / Tab Authorization Guard Component
 * Renders AccessDeniedPage (403) if user lacks required permission.
 */
export function ProtectedRoute({ permission, any, all, requireParkAdmin, scope, onBack, children }) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isParkAdmin, loading } = usePermissionContext();

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Evaluating security permissions...
      </div>
    );
  }

  if ((requireParkAdmin || scope === 'BUSINESS_PARK') && !isParkAdmin) {
    return <AccessDeniedPage requiredPermission="Business Park Administration Scope" onBack={onBack} />;
  }

  let authorized = true;
  let missingCode = permission;

  if (permission) {
    authorized = hasPermission(permission);
  } else if (any && Array.isArray(any)) {
    authorized = hasAnyPermission(any);
    missingCode = any.join(' OR ');
  } else if (all && Array.isArray(all)) {
    authorized = hasAllPermissions(all);
    missingCode = all.join(' AND ');
  }

  if (!authorized) {
    return <AccessDeniedPage requiredPermission={missingCode} onBack={onBack} />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;

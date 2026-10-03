import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissionContext } from '../../modules/role-permission-management/contexts/PermissionContext';
import UnauthorizedPage from '../../pages/UnauthorizedPage';

/**
 * ProtectedRoute Component
 * Enforces Authentication and Page-Level Permission Guards.
 * If user lacks required route permission, renders UnauthorizedPage (403) or redirects.
 */
export function ProtectedRoute({ permission, anyPermission, scope, children }) {
  const { user, permissions, userScope, loading, hasPermission, hasAnyPermission } = usePermissionContext();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Authenticating Enterprise Session...</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying permissions and tenant security scope...</div>
        </div>
      </div>
    );
  }

  // Check login
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (!user && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check Scope requirement if specified
  if (scope && scope !== 'BOTH' && scope !== userScope) {
    return <UnauthorizedPage message={`Access Denied: Page requires ${scope} context.`} />;
  }

  // Check Permission requirement
  if (permission && !hasPermission(permission)) {
    return <UnauthorizedPage message={`Access Denied: Missing required permission [${permission}].`} />;
  }

  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return <UnauthorizedPage message="Access Denied: Missing required permission for this section." />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;

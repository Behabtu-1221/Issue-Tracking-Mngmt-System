import React, { createContext, useState, useEffect, useContext } from 'react';
import identityApi from '../../identity-access/api/identityApi';
import authorizationService from '../services/authorizationService';
import { ADMIN_SCOPES, DEFAULT_ROLE_PRESETS } from '../constants/permissionConstants';

export const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [userScope, setUserScope] = useState(ADMIN_SCOPES.TENANT_COMPANY);
  const [loading, setLoading] = useState(true);

  const loadUserProfileAndPermissions = async () => {
    setLoading(true);
    try {
      const res = await identityApi.getMe();
      if (res.data && res.data.status === 'success') {
        const userObj = res.data.data;
        setUser(userObj);

        const scope = authorizationService.getUserScope(userObj);
        setUserScope(scope);

        // Derive permissions: merge role-preset defaults + server-returned permissions
        // Server DB may have legacy permission codes (e.g. 'service:read' vs 'Service.Read')
        // Always include the role preset to guarantee consistent menu/feature access
        const serverPerms = userObj.permissions || [];

        // Determine the effective role code from assigned roles or userTypeCode
        const assignedRoleCode = (userObj.roles && userObj.roles.length > 0)
          ? (typeof userObj.roles[0] === 'string' ? userObj.roles[0] : userObj.roles[0].RoleCode || userObj.roles[0].code || userObj.roles[0].name)
          : null;
        const typeCode = (assignedRoleCode || userObj.userTypeCode || '').toUpperCase();

        // Get the preset permissions for this role
        let presetPerms = [];
        if (typeCode === 'SUPER_ADMIN' || typeCode === 'PARK_ADMIN' || typeCode === 'PARK_SUPER_ADMIN' || typeCode === 'BUSINESS_PARK_ADMIN') {
          presetPerms = DEFAULT_ROLE_PRESETS.BUSINESS_PARK_ADMIN.permissions;
        } else if (typeCode === 'TENANT_REPRESENTATIVE' || typeCode === 'TENANT_ADMIN' || typeCode === 'COMPANY_ADMIN' || typeCode === 'ADMIN') {
          presetPerms = DEFAULT_ROLE_PRESETS.TENANT_REPRESENTATIVE.permissions;
        } else if (typeCode === 'MANAGER' || typeCode === 'DEPARTMENT_MANAGER' || typeCode === 'DISPATCHER') {
          presetPerms = DEFAULT_ROLE_PRESETS.DEPARTMENT_MANAGER.permissions;
        } else if (typeCode === 'TECHNICIAN' || typeCode === 'PARK_TECHNICIAN') {
          presetPerms = DEFAULT_ROLE_PRESETS.TECHNICIAN.permissions;
        } else {
          presetPerms = DEFAULT_ROLE_PRESETS.EMPLOYEE.permissions;
        }

        // Merge: preset permissions + any additional server permissions (deduplicated)
        const mergedPerms = [...new Set([...presetPerms, ...serverPerms])];
        setPermissions(mergedPerms);
      }
    } catch (err) {
      console.warn('Could not load user permissions (unauthenticated fallback):', err.message);
      // Fallback dev context for demonstration
      setUser({ UserID: 1, Username: 'superadmin', userTypeCode: 'PARK_ADMIN' });
      setUserScope(ADMIN_SCOPES.BUSINESS_PARK);
      setPermissions(DEFAULT_ROLE_PRESETS.BUSINESS_PARK_ADMIN.permissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfileAndPermissions();
  }, []);

  const parkAdminStatus = authorizationService.isParkAdmin(user);
  const companyAdminStatus = authorizationService.isCompanyAdmin(user);

  const value = {
    user,
    permissions,
    userScope,
    loading,
    hasPermission: (permCode) => authorizationService.hasPermission(permissions, permCode, parkAdminStatus),
    hasAnyPermission: (permCodes) => authorizationService.hasAnyPermission(permissions, permCodes, parkAdminStatus),
    hasAllPermissions: (permCodes) => authorizationService.hasAllPermissions(permissions, permCodes, parkAdminStatus),
    isParkAdmin: parkAdminStatus,
    isCompanyAdmin: companyAdminStatus,
    isTechnician: authorizationService.hasPermission(permissions, 'Issue.Read.Assigned', parkAdminStatus) && !parkAdminStatus && !companyAdminStatus,
    refreshPermissions: loadUserProfileAndPermissions,
    setUserPermissionsManually: (newPermissions, newScope) => {
      setPermissions(newPermissions);
      if (newScope) setUserScope(newScope);
    }
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return ctx;
}

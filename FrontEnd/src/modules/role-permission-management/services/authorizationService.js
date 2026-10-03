import { ADMIN_SCOPES, PERMISSIONS, DEFAULT_ROLE_PRESETS } from '../constants/permissionConstants';

export const authorizationService = {
  /**
   * Evaluate if user has a specific granular permission code.
   * SuperAdmin / Park Admin automatically bypass checks if configured.
   */
  /**
   * Evaluate if user has a specific granular permission code.
   * SuperAdmin / Park Admin automatically bypass checks if configured.
   */
  hasPermission(userPermissions = [], requiredPermission, isParkAdmin = false) {
    if (!requiredPermission) return true;
    if (isParkAdmin) return true;
    if (!Array.isArray(userPermissions)) return false;

    // Wildcard bypass
    if (userPermissions.includes('*') || userPermissions.includes('ALL')) return true;

    // Direct exact match
    if (userPermissions.includes(requiredPermission)) return true;

    // Alias resolution between Request.* and Issue.* permission codes
    if (requiredPermission.startsWith('Request.')) {
      const issueEquiv = requiredPermission.replace(/^Request\./, 'Issue.');
      if (userPermissions.includes(issueEquiv)) return true;
      const issuePrefix = issueEquiv + '.';
      if (userPermissions.some(p => p.startsWith(issuePrefix))) return true;
    }
    if (requiredPermission.startsWith('Issue.')) {
      const reqEquiv = requiredPermission.replace(/^Issue\./, 'Request.');
      if (userPermissions.includes(reqEquiv)) return true;
    }

    // Hierarchical scope prefix match:
    // If user has Issue.Read.Own or Issue.Read.Department, they satisfy Issue.Read or Request.Read
    const prefix = requiredPermission + '.';
    if (userPermissions.some(p => p.startsWith(prefix))) return true;

    // Reverse scope fallback: if required is Issue.Read.Department and user has Issue.Read.All
    // Higher scopes implicitly grant lower scopes
    const SCOPE_HIERARCHY = ['Own', 'Assigned', 'Department', 'Company', 'All'];
    const parts = requiredPermission.split('.');
    if (parts.length >= 3) {
      const basePermission = parts.slice(0, 2).join('.');
      const requiredScope = parts[2];
      const requiredIdx = SCOPE_HIERARCHY.indexOf(requiredScope);
      if (requiredIdx >= 0) {
        // Check if user has a higher or equal scope for same base
        for (let i = requiredIdx; i < SCOPE_HIERARCHY.length; i++) {
          if (userPermissions.includes(`${basePermission}.${SCOPE_HIERARCHY[i]}`)) return true;
        }
      }
      // Also check if user has the generic base (e.g. Request.Read without scope)
      if (userPermissions.includes(basePermission)) return true;
    }

    return false;
  },

  /**
   * Evaluate if user has ANY of the specified permission codes.
   */
  hasAnyPermission(userPermissions = [], requiredPermissions = [], isParkAdmin = false) {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    if (isParkAdmin) return true;
    if (!Array.isArray(userPermissions)) return false;

    if (userPermissions.includes('*') || userPermissions.includes('ALL')) return true;
    return requiredPermissions.some(perm => this.hasPermission(userPermissions, perm, isParkAdmin));
  },

  /**
   * Evaluate if user has ALL of the specified permission codes.
   */
  hasAllPermissions(userPermissions = [], requiredPermissions = [], isParkAdmin = false) {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    if (isParkAdmin) return true;
    if (!Array.isArray(userPermissions)) return false;

    if (userPermissions.includes('*') || userPermissions.includes('ALL')) return true;
    return requiredPermissions.every(perm => this.hasPermission(userPermissions, perm, isParkAdmin));
  },

  /**
   * Determine administration scope for user
   */
  getUserScope(user) {
    if (!user) return ADMIN_SCOPES.TENANT_COMPANY;
    if (this.isParkAdmin(user)) return ADMIN_SCOPES.BUSINESS_PARK;
    return ADMIN_SCOPES.TENANT_COMPANY;
  },

  /**
   * Is user Business Park Administrator?
   */
  isParkAdmin(user) {
    if (!user) return false;
    const assignedRoleCode = (user.roles && user.roles.length > 0)
      ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].RoleCode || user.roles[0].code || user.roles[0].name)
      : null;
    const typeCode = (assignedRoleCode || user.userTypeCode || user.roleCode || '').toUpperCase();
    return typeCode === 'PARK_ADMIN' || typeCode === 'PARK_SUPER_ADMIN' || typeCode === 'SUPER_ADMIN' || typeCode === 'BUSINESS_PARK_ADMIN' || typeCode === 'PARK_ADMINISTRATOR';
  },

  /**
   * Is user Tenant Representative?
   */
  isTenantRepresentative(user) {
    if (!user) return false;
    if (this.isParkAdmin(user)) return false;
    const assignedRoleCode = (user.roles && user.roles.length > 0)
      ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].RoleCode || user.roles[0].code || user.roles[0].name)
      : null;
    const typeCode = (assignedRoleCode || user.userTypeCode || user.roleCode || '').toUpperCase();
    return typeCode === 'TENANT_REPRESENTATIVE' || typeCode === 'COMPANY_ADMIN' || typeCode === 'TENANT_ADMIN' || typeCode === 'ADMIN';
  },

  /**
   * Alias for backwards compatibility with isTenantRepresentative
   */
  isCompanyAdmin(user) {
    return this.isTenantRepresentative(user);
  },

  /**
   * Get default permission array for role preset
   */
  getDefaultPermissionsForRole(roleCode) {
    const preset = DEFAULT_ROLE_PRESETS[roleCode];
    return preset ? preset.permissions : [];
  },

  /**
   * Dynamically filter sidebar navigation menu based on granted permissions and scope.
   */
  filterSidebarMenu(menuItems = [], userPermissions = [], userScope = ADMIN_SCOPES.TENANT_COMPANY) {
    return menuItems.filter(item => {
      // Check scope requirement
      if (item.scope && item.scope !== 'BOTH' && item.scope !== userScope) {
        return false;
      }

      // Check permission requirement
      if (item.permission) {
        return this.hasPermission(userPermissions, item.permission);
      }

      if (item.anyPermission) {
        return this.hasAnyPermission(userPermissions, item.anyPermission);
      }

      return true;
    });
  }
};

export default authorizationService;

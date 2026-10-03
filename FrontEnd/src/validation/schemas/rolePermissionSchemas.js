import { VALIDATION_LIMITS, REGEX_PATTERNS } from '../constants/validationConstants';
import { ROLE_RBAC_MESSAGES, VALIDATION_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';

export const rolePermissionSchemas = {
  /**
   * Role Definition Form Schema (Creation & Editing)
   * Validates Role Title, Role Code format, and Scope Description.
   */
  roleForm: (formData, isEditing = false) => {
    const errors = {};
    const rawName = formData.roleName || formData.RoleName || '';
    const rawCode = formData.roleCode || formData.RoleCode || '';
    const rawDesc = formData.description !== undefined ? formData.description : (formData.Description !== undefined ? formData.Description : '');

    const roleName = inputSanitizer.normalizeText(rawName);
    let roleCode = inputSanitizer.normalizeText(rawCode);
    const description = inputSanitizer.normalizeText(rawDesc);

    // Auto-generate code from title if not explicitly provided and not editing
    if (!roleCode && !isEditing && roleName) {
      roleCode = roleName.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    }

    if (!roleName) {
      errors.roleName = ROLE_RBAC_MESSAGES.role.titleRequired;
      errors.RoleName = ROLE_RBAC_MESSAGES.role.titleRequired;
    } else if (roleName.length < 2 || roleName.length > 100) {
      errors.roleName = ROLE_RBAC_MESSAGES.role.titleLength(2, 100);
      errors.RoleName = ROLE_RBAC_MESSAGES.role.titleLength(2, 100);
    }

    const codePattern = /^[A-Za-z0-9_-]{2,50}$/;
    if (!roleCode) {
      errors.roleCode = ROLE_RBAC_MESSAGES.role.codeRequired;
      errors.RoleCode = ROLE_RBAC_MESSAGES.role.codeRequired;
    } else if (roleCode.length < 2 || roleCode.length > 50 || !codePattern.test(roleCode)) {
      errors.roleCode = ROLE_RBAC_MESSAGES.role.codeFormat;
      errors.RoleCode = ROLE_RBAC_MESSAGES.role.codeFormat;
    }

    if (description && description.length > 500) {
      errors.description = ROLE_RBAC_MESSAGES.role.descriptionMaxLength(500);
      errors.Description = ROLE_RBAC_MESSAGES.role.descriptionMaxLength(500);
    }

    const permIds = formData.permissionIds || formData.selectedPermissions || [];

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        roleName,
        roleCode: roleCode ? roleCode.toUpperCase().replace(/\s+/g, '_') : '',
        description: description || undefined,
        permissionIds: Array.isArray(permIds) ? permIds : [],
        RoleName: roleName,
        RoleCode: roleCode ? roleCode.toUpperCase().replace(/\s+/g, '_') : '',
        Description: description || undefined,
        isSystemRole: Boolean(formData.isSystemRole || formData.IsSystemRole)
      }
    };
  },

  /**
   * User Role Assignment Form Schema
   * Validates employee selection and role authority allocation.
   */
  userRoleAssignForm: (formData) => {
    const errors = {};
    const userId = formData.userId || formData.UserID;
    const roleId = formData.roleId || formData.selectedRoleId || formData.RoleID;

    if (!userId) {
      errors.userId = ROLE_RBAC_MESSAGES.assignment.userRequired;
      errors.UserID = ROLE_RBAC_MESSAGES.assignment.userRequired;
    }

    if (!roleId || String(roleId).trim() === '') {
      errors.roleId = ROLE_RBAC_MESSAGES.assignment.roleRequired;
      errors.selectedRoleId = ROLE_RBAC_MESSAGES.assignment.roleRequired;
      errors.RoleID = ROLE_RBAC_MESSAGES.assignment.roleRequired;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        userId: Number(userId),
        roleId: Number(roleId)
      }
    };
  }
};


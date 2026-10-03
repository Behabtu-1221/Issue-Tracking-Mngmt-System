import AppError from '../../../shared/errors/AppError.js';
import roleRepository from '../repositories/role.repository.js';
import userRepository from '../repositories/user.repository.js';

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  const roles = (actor.roles || []).map(r => (typeof r === 'string' ? r : r.RoleCode || r.RoleName || '').toUpperCase());
  return (
    ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN'].includes(code) ||
    roles.some(r => ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN'].includes(r))
  );
};

class RoleService {
  async getRoles(params, actor) {
    const tenantId = isParkAdminActor(actor)
      ? params.tenantId
      : actor?.tenantId;

    return roleRepository.findAll({
      tenantId,
      search: params.search,
      limit: params.limit || 50,
      offset: params.offset || 0
    });
  }

  async getRoleById(roleId, actor) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    if (!isParkAdminActor(actor) && role.TenantID && role.TenantID !== actor?.tenantId) {
      throw new AppError('Role not found', 404);
    }
    return role;
  }

  async createRole(roleData, actor) {
    const tenantId = isParkAdminActor(actor)
      ? (roleData.tenantId || actor?.tenantId)
      : actor?.tenantId;

    const existing = await roleRepository.findByCode(roleData.roleCode, tenantId);
    if (existing) {
      throw new AppError(`Role with code '${roleData.roleCode}' already exists`, 400);
    }

    const isSystemRole = isParkAdminActor(actor) ? (roleData.isSystemRole || false) : false;

    const roleId = await roleRepository.createRole({
      tenantId,
      roleCode: roleData.roleCode,
      roleName: roleData.roleName,
      description: roleData.description,
      isSystemRole,
      actorUserId: actor?.userId
    });

    if (roleData.permissionIds && roleData.permissionIds.length > 0) {
      await roleRepository.syncRolePermissions(roleId, roleData.permissionIds, actor?.userId);
    }

    return roleRepository.findById(roleId);
  }

  async updateRole(roleId, roleData, actor) {
    const existing = await roleRepository.findById(roleId);
    if (!existing) {
      throw new AppError('Role not found', 404);
    }

    if (!isParkAdminActor(actor) && existing.TenantID && existing.TenantID !== actor?.tenantId) {
      throw new AppError('Permission denied', 403);
    }

    if (existing.IsSystemRole && !isParkAdminActor(actor)) {
      throw new AppError('System roles can only be modified by Super Administrators', 403);
    }

    await roleRepository.updateRole(roleId, roleData, actor?.userId);
    return roleRepository.findById(roleId);
  }

  async deleteRole(roleId, actor) {
    const existing = await roleRepository.findById(roleId);
    if (!existing) {
      throw new AppError('Role not found', 404);
    }

    if (!isParkAdminActor(actor) && existing.TenantID && existing.TenantID !== actor?.tenantId) {
      throw new AppError('Permission denied', 403);
    }

    if (existing.IsSystemRole) {
      throw new AppError('System roles cannot be deleted', 400);
    }

    await roleRepository.softDeleteRole(roleId, actor?.userId);
    return { message: 'Role deleted successfully' };
  }

  async getAllPermissions(actor) {
    const all = await roleRepository.findAllPermissions();
    if (!isParkAdminActor(actor)) {
      // Filter out Business Park scope permissions for Company Admin
      return (all || []).filter(p => p.GroupCode !== 'PARK_TOPOLOGY' && p.GroupCode !== 'PARK_SPACE' && p.GroupCode !== 'PARK_ZONES' && p.GroupCode !== 'TENANT_DIRECTORY' && p.GroupCode !== 'TENANT_CONTRACTS');
    }
    return all;
  }

  async updateRolePermissions(roleId, permissionIds, actor) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new AppError('Role not found', 404);
    }

    if (!isParkAdminActor(actor) && role.TenantID && role.TenantID !== actor?.tenantId) {
      throw new AppError('Permission denied', 403);
    }

    await roleRepository.syncRolePermissions(roleId, permissionIds, actor?.userId);
    return roleRepository.findById(roleId);
  }

  async assignRolesToUser(userId, roleIds, actor) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!isParkAdminActor(actor) && user.TenantID !== actor?.tenantId && user.UserID !== actor?.userId) {
      throw new AppError('User not found', 404);
    }

    await roleRepository.assignUserRoles(userId, roleIds, actor?.userId);
    return userRepository.findById(userId);
  }

  async removeRoleFromUser(userId, roleId, actor) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!isParkAdminActor(actor) && user.TenantID !== actor?.tenantId && user.UserID !== actor?.userId) {
      throw new AppError('User not found', 404);
    }

    await roleRepository.removeUserRole(userId, roleId, actor?.userId);
    return userRepository.findById(userId);
  }

  async getRbacAuditLogs(params, actor) {
    const tenantId = isParkAdminActor(actor)
      ? params.tenantId
      : actor?.tenantId;

    return roleRepository.getRbacAuditLogs({
      tenantId,
      limit: params.limit || 50,
      offset: params.offset || 0
    });
  }
}

export default new RoleService();

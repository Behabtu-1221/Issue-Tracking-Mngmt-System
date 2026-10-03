import subTenantRepository from '../repositories/sub-tenant.repository.js';
import tenantRepository from '../repositories/tenant.repository.js';
import AppError from '../../../shared/errors/AppError.js';

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  const role = (actor.role || actor.primaryRole || '').toUpperCase();
  const adminCodes = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN', 'ADMIN'];
  if (adminCodes.includes(code) || adminCodes.includes(role)) return true;
  if (Array.isArray(actor.roles) && actor.roles.some(r => adminCodes.includes(String(r).toUpperCase()))) return true;
  if (!actor.tenantId && (code.includes('ADMIN') || role.includes('ADMIN'))) return true;
  return false;
};

export const subTenantService = {
  async getSubTenants(params, actor) {
    const queryParams = { ...params };
    if (!isParkAdminActor(actor)) {
      if (!actor || !actor.tenantId) {
        throw new AppError('Permission denied: Missing tenant identity', 403);
      }
      queryParams.parentTenantId = actor.tenantId;
    }
    return subTenantRepository.findAll(queryParams);
  },

  async getSubTenantById(id, actor) {
    const subTenant = await subTenantRepository.findById(id);
    if (!subTenant) {
      throw new AppError(`Sub-tenant with ID ${id} not found`, 404);
    }
    if (!isParkAdminActor(actor)) {
      if (!actor || Number(subTenant.ParentTenantID) !== Number(actor.tenantId)) {
        throw new AppError(`Sub-tenant with ID ${id} not found`, 404);
      }
    }
    return subTenant;
  },

  async createSubTenant(data, actor) {
    const parentId = !isParkAdminActor(actor) ? actor?.tenantId : data.ParentTenantID;
    if (!parentId) {
      throw new AppError('ParentTenantID is required', 400);
    }

    // Verify parent tenant exists and is ACTIVE
    const parent = await tenantRepository.findById(parentId);
    if (!parent) {
      throw new AppError(`Parent tenant with ID ${parentId} not found`, 404);
    }
    if (parent.Status !== 'ACTIVE') {
      throw new AppError(
        `Cannot add sub-tenant to '${parent.CompanyName}' because its status is '${parent.Status}'. Parent must be ACTIVE.`,
        400
      );
    }

    // Uniqueness: CompanyName under same parent
    const existing = await subTenantRepository.findByParentAndName(parentId, data.CompanyName);
    if (existing) {
      throw new AppError(`Sub-tenant '${data.CompanyName}' already exists under tenant '${parent.CompanyName}'`, 409);
    }

    const actorId = actor?.userId || 1;
    const newId = await subTenantRepository.create({ ...data, ParentTenantID: parentId, CreatedBy: actorId });
    return subTenantRepository.findById(newId);
  },

  async updateSubTenant(id, data, actor) {
    const subTenant = await this.getSubTenantById(id, actor);

    // If changing name, check for duplicate under same parent
    if (data.CompanyName && data.CompanyName !== subTenant.CompanyName) {
      const existing = await subTenantRepository.findByParentAndName(subTenant.ParentTenantID, data.CompanyName);
      if (existing && existing.SubTenantID !== Number(id)) {
        throw new AppError(`Sub-tenant name '${data.CompanyName}' already exists under this parent tenant`, 409);
      }
    }

    const actorId = actor?.userId || 1;
    return subTenantRepository.update(id, { ...data, ModifiedBy: actorId });
  },

  async deleteSubTenant(id, actor) {
    const subTenant = await this.getSubTenantById(id, actor);
    const actorId = actor?.userId || 1;
    await subTenantRepository.softDelete(id, actorId);
    return { message: `Sub-tenant '${subTenant.CompanyName}' deleted successfully` };
  }
};

export default subTenantService;

import subTenantRepository from '../repositories/sub-tenant.repository.js';
import tenantRepository from '../repositories/tenant.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const subTenantService = {
  async getSubTenants(params) {
    return subTenantRepository.findAll(params);
  },

  async getSubTenantById(id) {
    const subTenant = await subTenantRepository.findById(id);
    if (!subTenant) {
      throw new AppError(`Sub-tenant with ID ${id} not found`, 404);
    }
    return subTenant;
  },

  async createSubTenant(data, userId) {
    // Verify parent tenant exists and is ACTIVE
    const parent = await tenantRepository.findById(data.ParentTenantID);
    if (!parent) {
      throw new AppError(`Parent tenant with ID ${data.ParentTenantID} not found`, 404);
    }
    if (parent.Status !== 'ACTIVE') {
      throw new AppError(
        `Cannot add sub-tenant to '${parent.CompanyName}' because its status is '${parent.Status}'. Parent must be ACTIVE.`,
        400
      );
    }

    // Uniqueness: CompanyName under same parent
    const existing = await subTenantRepository.findByParentAndName(data.ParentTenantID, data.CompanyName);
    if (existing) {
      throw new AppError(`Sub-tenant '${data.CompanyName}' already exists under tenant '${parent.CompanyName}'`, 409);
    }

    const newId = await subTenantRepository.create({ ...data, CreatedBy: userId });
    return subTenantRepository.findById(newId);
  },

  async updateSubTenant(id, data, userId) {
    const subTenant = await subTenantRepository.findById(id);
    if (!subTenant) {
      throw new AppError(`Sub-tenant with ID ${id} not found`, 404);
    }

    // If changing name, check for duplicate under same parent
    if (data.CompanyName && data.CompanyName !== subTenant.CompanyName) {
      const existing = await subTenantRepository.findByParentAndName(subTenant.ParentTenantID, data.CompanyName);
      if (existing && existing.SubTenantID !== Number(id)) {
        throw new AppError(`Sub-tenant name '${data.CompanyName}' already exists under this parent tenant`, 409);
      }
    }

    return subTenantRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteSubTenant(id, userId) {
    const subTenant = await subTenantRepository.findById(id);
    if (!subTenant) {
      throw new AppError(`Sub-tenant with ID ${id} not found`, 404);
    }

    await subTenantRepository.softDelete(id, userId);
    return { message: `Sub-tenant '${subTenant.CompanyName}' deleted successfully` };
  }
};

export default subTenantService;

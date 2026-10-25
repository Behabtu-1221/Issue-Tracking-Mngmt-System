import tenantAddressRepository from '../repositories/tenant-address.repository.js';
import tenantRepository from '../repositories/tenant.repository.js';
import AppError from '../../../shared/errors/AppError.js';

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  if (actor === 1 || actor?.userId === 1) return true;
  const code = (actor?.userTypeCode || '').toUpperCase();
  const role = (actor?.role || actor?.primaryRole || '').toUpperCase();
  const adminCodes = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN', 'ADMIN'];
  if (adminCodes.includes(code) || adminCodes.includes(role)) return true;
  if (Array.isArray(actor?.roles) && actor.roles.some(r => adminCodes.includes(String(r).toUpperCase()))) return true;
  if (!actor?.tenantId && (code.includes('ADMIN') || role.includes('ADMIN'))) return true;
  return false;
};

export const tenantAddressService = {
  async getAddresses(params = {}, actor) {
    const filters = { ...params };
    if (!isParkAdminActor(actor)) {
      filters.tenantId = actor?.tenantId || -1;
    }
    return tenantAddressRepository.findAll(filters);
  },

  async getAddressById(id, actor) {
    const address = await tenantAddressRepository.findById(id);
    if (!address || (actor && !isParkAdminActor(actor) && Number(address.TenantID) !== Number(actor?.tenantId))) {
      throw new AppError(`Tenant address with ID ${id} not found`, 404);
    }
    return address;
  },

  async createAddress(data, userId, actor) {
    if (!isParkAdminActor(actor) && actor?.tenantId) {
      data.TenantID = actor.tenantId;
    }

    // Verify tenant exists
    const tenant = await tenantRepository.findById(data.TenantID);
    if (!tenant) {
      throw new AppError(`Tenant with ID ${data.TenantID} not found`, 404);
    }

    // Business rule: A tenant should have at most one LEGAL address
    if (data.AddressType === 'LEGAL') {
      const existingLegal = await tenantAddressRepository.findByTenantAndType(data.TenantID, 'LEGAL');
      if (existingLegal) {
        throw new AppError(
          `Tenant '${tenant.CompanyName}' already has a LEGAL address. Update the existing one instead.`,
          409
        );
      }
    }

    const newId = await tenantAddressRepository.create({ ...data, CreatedBy: userId });
    return tenantAddressRepository.findById(newId);
  },

  async updateAddress(id, data, userId, actor) {
    const address = await this.getAddressById(id, actor);

    // If changing type to LEGAL, check for duplicates
    if (data.AddressType === 'LEGAL' && address.AddressType !== 'LEGAL') {
      const existingLegal = await tenantAddressRepository.findByTenantAndType(address.TenantID, 'LEGAL');
      if (existingLegal && existingLegal.TenantAddressID !== Number(id)) {
        throw new AppError(`This tenant already has a LEGAL address`, 409);
      }
    }

    return tenantAddressRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteAddress(id, userId, actor) {
    const address = await this.getAddressById(id, actor);

    await tenantAddressRepository.softDelete(id, userId);
    return { message: `Address (${address.AddressType}) deleted successfully` };
  }
};

export default tenantAddressService;

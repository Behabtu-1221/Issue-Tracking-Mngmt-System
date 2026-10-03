import tenantAddressRepository from '../repositories/tenant-address.repository.js';
import tenantRepository from '../repositories/tenant.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const tenantAddressService = {
  async getAddresses(params) {
    return tenantAddressRepository.findAll(params);
  },

  async getAddressById(id) {
    const address = await tenantAddressRepository.findById(id);
    if (!address) {
      throw new AppError(`Tenant address with ID ${id} not found`, 404);
    }
    return address;
  },

  async createAddress(data, userId) {
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

  async updateAddress(id, data, userId) {
    const address = await tenantAddressRepository.findById(id);
    if (!address) {
      throw new AppError(`Tenant address with ID ${id} not found`, 404);
    }

    // If changing type to LEGAL, check for duplicates
    if (data.AddressType === 'LEGAL' && address.AddressType !== 'LEGAL') {
      const existingLegal = await tenantAddressRepository.findByTenantAndType(address.TenantID, 'LEGAL');
      if (existingLegal && existingLegal.TenantAddressID !== Number(id)) {
        throw new AppError(`This tenant already has a LEGAL address`, 409);
      }
    }

    return tenantAddressRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteAddress(id, userId) {
    const address = await tenantAddressRepository.findById(id);
    if (!address) {
      throw new AppError(`Tenant address with ID ${id} not found`, 404);
    }

    await tenantAddressRepository.softDelete(id, userId);
    return { message: `Address (${address.AddressType}) deleted successfully` };
  }
};

export default tenantAddressService;

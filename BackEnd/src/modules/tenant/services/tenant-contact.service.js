import tenantContactRepository from '../repositories/tenant-contact.repository.js';
import tenantRepository from '../repositories/tenant.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const tenantContactService = {
  async getContacts(params) {
    return tenantContactRepository.findAll(params);
  },

  async getContactById(id) {
    const contact = await tenantContactRepository.findById(id);
    if (!contact) {
      throw new AppError(`Tenant contact with ID ${id} not found`, 404);
    }
    return contact;
  },

  async createContact(data, userId) {
    // Verify tenant exists
    const tenant = await tenantRepository.findById(data.TenantID);
    if (!tenant) {
      throw new AppError(`Tenant with ID ${data.TenantID} not found`, 404);
    }

    if (!data.ContactValue || !data.ContactValue.trim()) {
      throw new AppError('Contact value is required', 400);
    }

    if (data.ContactType === 'EMAIL') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.ContactValue.trim())) {
        throw new AppError(`Invalid email address format: '${data.ContactValue}'`, 400);
      }
    }

    // If marking as primary, clear existing primary of same type first
    if (data.IsPrimary) {
      await tenantContactRepository.clearPrimaryFlag(data.TenantID, data.ContactType);
    }

    const newId = await tenantContactRepository.create({ ...data, CreatedBy: userId });
    return tenantContactRepository.findById(newId);
  },

  async updateContact(id, data, userId) {
    const contact = await tenantContactRepository.findById(id);
    if (!contact) {
      throw new AppError(`Tenant contact with ID ${id} not found`, 404);
    }

    // If marking as primary, clear existing primary of same type first
    const effectiveType = data.ContactType || contact.ContactType;
    if (data.IsPrimary) {
      await tenantContactRepository.clearPrimaryFlag(contact.TenantID, effectiveType);
    }

    return tenantContactRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteContact(id, userId) {
    const contact = await tenantContactRepository.findById(id);
    if (!contact) {
      throw new AppError(`Tenant contact with ID ${id} not found`, 404);
    }

    await tenantContactRepository.softDelete(id, userId);
    return { message: `Contact '${contact.Label}' deleted successfully` };
  }
};

export default tenantContactService;

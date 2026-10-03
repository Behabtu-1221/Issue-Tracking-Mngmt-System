import tenantContactRepository from '../repositories/tenant-contact.repository.js';
import tenantRepository from '../repositories/tenant.repository.js';
import AppError from '../../../shared/errors/AppError.js';

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor?.userTypeCode || '').toUpperCase();
  const role = (actor?.role || actor?.primaryRole || '').toUpperCase();
  const adminCodes = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN', 'ADMIN'];
  if (adminCodes.includes(code) || adminCodes.includes(role)) return true;
  if (Array.isArray(actor?.roles) && actor.roles.some(r => adminCodes.includes(String(r).toUpperCase()))) return true;
  if (!actor?.tenantId && (code.includes('ADMIN') || role.includes('ADMIN'))) return true;
  return false;
};

export const tenantContactService = {
  async getContacts(params = {}, actor) {
    const filters = { ...params };
    if (!isParkAdminActor(actor)) {
      filters.tenantId = actor?.tenantId || -1;
    }
    return tenantContactRepository.findAll(filters);
  },

  async getContactById(id, actor) {
    const contact = await tenantContactRepository.findById(id);
    if (!contact || (!isParkAdminActor(actor) && Number(contact.TenantID) !== Number(actor?.tenantId))) {
      throw new AppError(`Tenant contact with ID ${id} not found`, 404);
    }
    return contact;
  },

  async createContact(data, userId, actor) {
    if (!isParkAdminActor(actor) && actor?.tenantId) {
      data.TenantID = actor.tenantId;
    }

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

  async updateContact(id, data, userId, actor) {
    const contact = await this.getContactById(id, actor);

    // If marking as primary, clear existing primary of same type first
    const effectiveType = data.ContactType || contact.ContactType;
    if (data.IsPrimary) {
      await tenantContactRepository.clearPrimaryFlag(contact.TenantID, effectiveType);
    }

    return tenantContactRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteContact(id, userId, actor) {
    const contact = await this.getContactById(id, actor);

    await tenantContactRepository.softDelete(id, userId);
    return { message: `Contact '${contact.Label}' deleted successfully` };
  }
};

export default tenantContactService;

import serviceRequirementRepository from '../repositories/service-requirement.repository.js';
import serviceRepository from '../repositories/service.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const serviceRequirementService = {
  // ── Form Requirements ──
  async getRequirementsByServiceId(serviceId) {
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new AppError(`Service with ID ${serviceId} not found`, 404);
    }
    return serviceRequirementRepository.findRequirementsByServiceId(serviceId);
  },

  async createRequirement(data, userId) {
    const service = await serviceRepository.findById(data.ServiceID);
    if (!service) {
      throw new AppError(`Service with ID ${data.ServiceID} not found`, 404);
    }

    const newId = await serviceRequirementRepository.createRequirement({ ...data, CreatedBy: userId });
    return serviceRequirementRepository.findRequirementById(newId);
  },

  async updateRequirement(id, data, userId) {
    const req = await serviceRequirementRepository.findRequirementById(id);
    if (!req) {
      throw new AppError(`Service requirement with ID ${id} not found`, 404);
    }
    return serviceRequirementRepository.updateRequirement(id, { ...data, ModifiedBy: userId });
  },

  async deleteRequirement(id, userId) {
    const req = await serviceRequirementRepository.findRequirementById(id);
    if (!req) {
      throw new AppError(`Service requirement with ID ${id} not found`, 404);
    }
    await serviceRequirementRepository.deleteRequirement(id, userId);
    return { message: 'Service requirement deleted successfully' };
  },

  // ── Attachment Requirements ──
  async getAttachmentsByServiceId(serviceId) {
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new AppError(`Service with ID ${serviceId} not found`, 404);
    }
    return serviceRequirementRepository.findAttachmentsByServiceId(serviceId);
  },

  async createAttachment(data, userId) {
    const service = await serviceRepository.findById(data.ServiceID);
    if (!service) {
      throw new AppError(`Service with ID ${data.ServiceID} not found`, 404);
    }

    const newId = await serviceRequirementRepository.createAttachment({ ...data, CreatedBy: userId });
    return serviceRequirementRepository.findAttachmentById(newId);
  },

  async updateAttachment(id, data, userId) {
    const att = await serviceRequirementRepository.findAttachmentById(id);
    if (!att) {
      throw new AppError(`Service attachment requirement with ID ${id} not found`, 404);
    }
    return serviceRequirementRepository.updateAttachment(id, { ...data, ModifiedBy: userId });
  },

  async deleteAttachment(id, userId) {
    const att = await serviceRequirementRepository.findAttachmentById(id);
    if (!att) {
      throw new AppError(`Service attachment requirement with ID ${id} not found`, 404);
    }
    await serviceRequirementRepository.deleteAttachment(id, userId);
    return { message: 'Service attachment requirement deleted successfully' };
  }
};

export default serviceRequirementService;

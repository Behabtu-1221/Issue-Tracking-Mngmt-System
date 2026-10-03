import serviceRepository from '../repositories/service.repository.js';
import serviceCategoryRepository from '../repositories/service-category.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const serviceService = {
  async getServices(params) {
    return serviceRepository.findAll(params);
  },

  async getServiceById(id) {
    const service = await serviceRepository.findById(id);
    if (!service) {
      throw new AppError(`Service with ID ${id} not found`, 404);
    }
    return service;
  },

  async createService(data, userId) {
    // Validate ServiceCategory existence
    const category = await serviceCategoryRepository.findById(data.ServiceCategoryID);
    if (!category) {
      throw new AppError(`Service category with ID ${data.ServiceCategoryID} not found`, 404);
    }

    // Validate uniqueness of ServiceCode under category
    const existing = await serviceRepository.findByCategoryAndCode(data.ServiceCategoryID, data.ServiceCode);
    if (existing) {
      throw new AppError(`Service code '${data.ServiceCode}' already exists in this category`, 409);
    }

    const newId = await serviceRepository.create({ ...data, CreatedBy: userId });
    return serviceRepository.findById(newId);
  },

  async updateService(id, data, userId) {
    const service = await serviceRepository.findById(id);
    if (!service) {
      throw new AppError(`Service with ID ${id} not found`, 404);
    }

    return serviceRepository.update(id, { ...data, ModifiedBy: userId });
  },

  async deleteService(id, userId) {
    const service = await serviceRepository.findById(id);
    if (!service) {
      throw new AppError(`Service with ID ${id} not found`, 404);
    }

    await serviceRepository.softDelete(id, userId);
    return { message: `Service '${service.ServiceName}' deleted successfully` };
  },

  async getOverviewMetrics(tenantId) {
    return serviceRepository.getOverviewMetrics(tenantId);
  }
};

export default serviceService;

import servicePricingRepository from '../repositories/service-pricing.repository.js';
import serviceRepository from '../repositories/service.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const servicePricingService = {
  async getPricingByServiceId(serviceId) {
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new AppError(`Service with ID ${serviceId} not found`, 404);
    }
    const pricing = await servicePricingRepository.findByServiceId(serviceId);
    return pricing || { ServiceID: Number(serviceId), PricingModel: 'FREE', UnitPrice: 0.00, CurrencyCode: 'ETB', BillingType: 'NON_BILLABLE' };
  },

  async upsertPricing(data, userId) {
    const service = await serviceRepository.findById(data.ServiceID);
    if (!service) {
      throw new AppError(`Service with ID ${data.ServiceID} not found`, 404);
    }

    if (data.UnitPrice < 0) {
      throw new AppError('Unit price cannot be negative', 400);
    }

    return servicePricingRepository.upsert({ ...data, CreatedBy: userId });
  },

  async deletePricing(id, userId) {
    const pricing = await servicePricingRepository.findById(id);
    if (!pricing) {
      throw new AppError(`Service pricing record with ID ${id} not found`, 404);
    }
    await servicePricingRepository.softDelete(id, userId);
    return { message: 'Service pricing deleted successfully' };
  }
};

export default servicePricingService;

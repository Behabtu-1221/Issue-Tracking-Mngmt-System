import servicePricingService from '../services/service-pricing.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams } from '../../../shared/utils/requestData.js';

export const servicePricingController = {
  async getPricingByServiceId(req, res, next) {
    try {
      const { serviceId } = getParams(req);
      const pricing = await servicePricingService.getPricingByServiceId(serviceId);
      sendSuccess(res, pricing);
    } catch (err) {
      next(err);
    }
  },

  async upsertPricing(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const pricing = await servicePricingService.upsertPricing(req.body, actorId);
      sendSuccess(res, pricing);
    } catch (err) {
      next(err);
    }
  },

  async deletePricing(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await servicePricingService.deletePricing(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default servicePricingController;

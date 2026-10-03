import serviceService from '../services/service.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const serviceController = {
  async getServices(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await serviceService.getServices(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getServiceById(req, res, next) {
    try {
      const { id } = getParams(req);
      const service = await serviceService.getServiceById(id);
      sendSuccess(res, service);
    } catch (err) {
      next(err);
    }
  },

  async createService(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const service = await serviceService.createService(req.body, actorId);
      sendCreated(res, service);
    } catch (err) {
      next(err);
    }
  },

  async updateService(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const service = await serviceService.updateService(id, req.body, actorId);
      sendSuccess(res, service);
    } catch (err) {
      next(err);
    }
  },

  async deleteService(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await serviceService.deleteService(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getOverviewMetrics(req, res, next) {
    try {
      const { tenantId } = getQuery(req);
      const metrics = await serviceService.getOverviewMetrics(tenantId);
      sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  }
};

export default serviceController;

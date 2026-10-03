import tenantService from '../services/tenant.service.js';
import { CreateTenantDTO, UpdateTenantDTO, UpdateTenantStatusDTO } from '../dtos/tenant.dto.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const tenantController = {
  async getTenants(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await tenantService.getTenants(queryParams, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getTenantById(req, res, next) {
    try {
      const { id } = getParams(req);
      const tenant = await tenantService.getTenantById(id, req.actor);
      sendSuccess(res, tenant);
    } catch (err) {
      next(err);
    }
  },

  async createTenant(req, res, next) {
    try {
      const dto = new CreateTenantDTO(req.body);
      const tenant = await tenantService.createTenant(dto, req.actor);
      sendCreated(res, tenant);
    } catch (err) {
      next(err);
    }
  },

  async updateTenant(req, res, next) {
    try {
      const { id } = getParams(req);
      const dto = new UpdateTenantDTO(req.body);
      const tenant = await tenantService.updateTenant(id, dto, req.actor);
      sendSuccess(res, tenant);
    } catch (err) {
      next(err);
    }
  },

  async updateTenantStatus(req, res, next) {
    try {
      const { id } = getParams(req);
      const dto = new UpdateTenantStatusDTO(req.body);
      const tenant = await tenantService.updateTenantStatus(id, dto.Status, req.actor);
      sendSuccess(res, tenant);
    } catch (err) {
      next(err);
    }
  },

  async deleteTenant(req, res, next) {
    try {
      const { id } = getParams(req);
      const result = await tenantService.deleteTenant(id, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getDashboardMetrics(req, res, next) {
    try {
      const { businessParkId } = getQuery(req);
      const metrics = await tenantService.getDashboardMetrics(businessParkId, req.actor);
      sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  }
};

export default tenantController;

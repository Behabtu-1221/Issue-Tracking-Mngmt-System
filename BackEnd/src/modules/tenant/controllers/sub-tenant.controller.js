import subTenantService from '../services/sub-tenant.service.js';
import { CreateSubTenantDTO, UpdateSubTenantDTO } from '../dtos/sub-tenant.dto.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const subTenantController = {
  async getSubTenants(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await subTenantService.getSubTenants(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getSubTenantById(req, res, next) {
    try {
      const { id } = getParams(req);
      const subTenant = await subTenantService.getSubTenantById(id);
      sendSuccess(res, subTenant);
    } catch (err) {
      next(err);
    }
  },

  async createSubTenant(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const dto = new CreateSubTenantDTO(req.body);
      const subTenant = await subTenantService.createSubTenant(dto, actorId);
      sendCreated(res, subTenant);
    } catch (err) {
      next(err);
    }
  },

  async updateSubTenant(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const dto = new UpdateSubTenantDTO(req.body);
      const subTenant = await subTenantService.updateSubTenant(id, dto, actorId);
      sendSuccess(res, subTenant);
    } catch (err) {
      next(err);
    }
  },

  async deleteSubTenant(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await subTenantService.deleteSubTenant(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default subTenantController;

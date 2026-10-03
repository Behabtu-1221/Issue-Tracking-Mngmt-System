import subTenantService from '../services/sub-tenant.service.js';
import { CreateSubTenantDTO, UpdateSubTenantDTO } from '../dtos/sub-tenant.dto.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const subTenantController = {
  async getSubTenants(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await subTenantService.getSubTenants(queryParams, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getSubTenantById(req, res, next) {
    try {
      const { id } = getParams(req);
      const subTenant = await subTenantService.getSubTenantById(id, req.actor);
      sendSuccess(res, subTenant);
    } catch (err) {
      next(err);
    }
  },

  async createSubTenant(req, res, next) {
    try {
      const dto = new CreateSubTenantDTO(req.body);
      const subTenant = await subTenantService.createSubTenant(dto, req.actor);
      sendCreated(res, subTenant);
    } catch (err) {
      next(err);
    }
  },

  async updateSubTenant(req, res, next) {
    try {
      const { id } = getParams(req);
      const dto = new UpdateSubTenantDTO(req.body);
      const subTenant = await subTenantService.updateSubTenant(id, dto, req.actor);
      sendSuccess(res, subTenant);
    } catch (err) {
      next(err);
    }
  },

  async deleteSubTenant(req, res, next) {
    try {
      const { id } = getParams(req);
      const result = await subTenantService.deleteSubTenant(id, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default subTenantController;

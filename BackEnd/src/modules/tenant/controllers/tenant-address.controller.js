import tenantAddressService from '../services/tenant-address.service.js';
import { CreateTenantAddressDTO, UpdateTenantAddressDTO } from '../dtos/tenant-address.dto.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const tenantAddressController = {
  async getAddresses(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await tenantAddressService.getAddresses(queryParams, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getAddressById(req, res, next) {
    try {
      const { id } = getParams(req);
      const address = await tenantAddressService.getAddressById(id, req.actor);
      sendSuccess(res, address);
    } catch (err) {
      next(err);
    }
  },

  async createAddress(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const dto = new CreateTenantAddressDTO(req.body);
      const address = await tenantAddressService.createAddress(dto, actorId, req.actor);
      sendCreated(res, address);
    } catch (err) {
      next(err);
    }
  },

  async updateAddress(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const dto = new UpdateTenantAddressDTO(req.body);
      const address = await tenantAddressService.updateAddress(id, dto, actorId, req.actor);
      sendSuccess(res, address);
    } catch (err) {
      next(err);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await tenantAddressService.deleteAddress(id, actorId, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default tenantAddressController;

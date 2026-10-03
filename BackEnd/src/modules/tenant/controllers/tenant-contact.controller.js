import tenantContactService from '../services/tenant-contact.service.js';
import { CreateTenantContactDTO, UpdateTenantContactDTO } from '../dtos/tenant-contact.dto.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const tenantContactController = {
  async getContacts(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await tenantContactService.getContacts(queryParams, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getContactById(req, res, next) {
    try {
      const { id } = getParams(req);
      const contact = await tenantContactService.getContactById(id, req.actor);
      sendSuccess(res, contact);
    } catch (err) {
      next(err);
    }
  },

  async createContact(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const dto = new CreateTenantContactDTO(req.body);
      const contact = await tenantContactService.createContact(dto, actorId, req.actor);
      sendCreated(res, contact);
    } catch (err) {
      next(err);
    }
  },

  async updateContact(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const dto = new UpdateTenantContactDTO(req.body);
      const contact = await tenantContactService.updateContact(id, dto, actorId, req.actor);
      sendSuccess(res, contact);
    } catch (err) {
      next(err);
    }
  },

  async deleteContact(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await tenantContactService.deleteContact(id, actorId, req.actor);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default tenantContactController;

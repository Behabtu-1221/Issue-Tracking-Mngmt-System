import tenantContactService from '../services/tenant-contact.service.js';
import { CreateTenantContactDTO, UpdateTenantContactDTO } from '../dtos/tenant-contact.dto.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const tenantContactController = {
  async getContacts(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const isParkAdmin = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN'].includes((req.actor?.userTypeCode || '').toUpperCase());
      if (!isParkAdmin && req.actor?.tenantId) {
        queryParams.tenantId = req.actor.tenantId;
      }
      const result = await tenantContactService.getContacts(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getContactById(req, res, next) {
    try {
      const { id } = getParams(req);
      const contact = await tenantContactService.getContactById(id);
      sendSuccess(res, contact);
    } catch (err) {
      next(err);
    }
  },

  async createContact(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const isParkAdmin = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN'].includes((req.actor?.userTypeCode || '').toUpperCase());
      const payload = { ...req.body };
      if (!isParkAdmin && req.actor?.tenantId) {
        payload.TenantID = req.actor.tenantId;
      }
      const dto = new CreateTenantContactDTO(payload);
      const contact = await tenantContactService.createContact(dto, actorId);
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
      const contact = await tenantContactService.updateContact(id, dto, actorId);
      sendSuccess(res, contact);
    } catch (err) {
      next(err);
    }
  },

  async deleteContact(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await tenantContactService.deleteContact(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default tenantContactController;

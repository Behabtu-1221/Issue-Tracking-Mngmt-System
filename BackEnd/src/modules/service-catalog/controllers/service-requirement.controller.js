import serviceRequirementService from '../services/service-requirement.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams } from '../../../shared/utils/requestData.js';

export const serviceRequirementController = {
  // Requirements
  async getRequirementsByServiceId(req, res, next) {
    try {
      const { serviceId } = getParams(req);
      const requirements = await serviceRequirementService.getRequirementsByServiceId(serviceId);
      sendSuccess(res, requirements);
    } catch (err) {
      next(err);
    }
  },

  async createRequirement(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const reqRecord = await serviceRequirementService.createRequirement(req.body, actorId);
      sendCreated(res, reqRecord);
    } catch (err) {
      next(err);
    }
  },

  async updateRequirement(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const reqRecord = await serviceRequirementService.updateRequirement(id, req.body, actorId);
      sendSuccess(res, reqRecord);
    } catch (err) {
      next(err);
    }
  },

  async deleteRequirement(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await serviceRequirementService.deleteRequirement(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  // Attachments
  async getAttachmentsByServiceId(req, res, next) {
    try {
      const { serviceId } = getParams(req);
      const attachments = await serviceRequirementService.getAttachmentsByServiceId(serviceId);
      sendSuccess(res, attachments);
    } catch (err) {
      next(err);
    }
  },

  async createAttachment(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const attachment = await serviceRequirementService.createAttachment(req.body, actorId);
      sendCreated(res, attachment);
    } catch (err) {
      next(err);
    }
  },

  async updateAttachment(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const attachment = await serviceRequirementService.updateAttachment(id, req.body, actorId);
      sendSuccess(res, attachment);
    } catch (err) {
      next(err);
    }
  },

  async deleteAttachment(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await serviceRequirementService.deleteAttachment(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default serviceRequirementController;

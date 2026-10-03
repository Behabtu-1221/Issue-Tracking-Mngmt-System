import reportingHierarchyService from '../services/reporting-hierarchy.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const reportingHierarchyController = {
  async getHierarchies(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await reportingHierarchyService.getHierarchies(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getHierarchyById(req, res, next) {
    try {
      const { id } = getParams(req);
      const hierarchy = await reportingHierarchyService.getHierarchyById(id);
      sendSuccess(res, hierarchy);
    } catch (err) {
      next(err);
    }
  },

  async createHierarchy(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const hierarchy = await reportingHierarchyService.createHierarchy(req.body, actorId);
      sendCreated(res, hierarchy);
    } catch (err) {
      next(err);
    }
  },

  async updateHierarchy(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const hierarchy = await reportingHierarchyService.updateHierarchy(id, req.body, actorId);
      sendSuccess(res, hierarchy);
    } catch (err) {
      next(err);
    }
  },

  async deleteHierarchy(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await reportingHierarchyService.deleteHierarchy(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default reportingHierarchyController;

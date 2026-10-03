import positionService from '../services/position.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const positionController = {
  async getPositions(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await positionService.getPositions(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getPositionById(req, res, next) {
    try {
      const { id } = getParams(req);
      const pos = await positionService.getPositionById(id);
      sendSuccess(res, pos);
    } catch (err) {
      next(err);
    }
  },

  async createPosition(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const pos = await positionService.createPosition(req.body, actorId);
      sendCreated(res, pos);
    } catch (err) {
      next(err);
    }
  },

  async updatePosition(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const pos = await positionService.updatePosition(id, req.body, actorId);
      sendSuccess(res, pos);
    } catch (err) {
      next(err);
    }
  },

  async deletePosition(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await positionService.deletePosition(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default positionController;

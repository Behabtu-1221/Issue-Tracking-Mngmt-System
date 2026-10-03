import parkService from '../services/park.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const parkController = {
  async getParks(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await parkService.getParks(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getParkById(req, res, next) {
    try {
      const { id } = getParams(req);
      const park = await parkService.getParkById(id);
      sendSuccess(res, park);
    } catch (err) {
      next(err);
    }
  },

  async createPark(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const park = await parkService.createPark(req.body, actorId);
      sendCreated(res, park);
    } catch (err) {
      next(err);
    }
  },

  async updatePark(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const park = await parkService.updatePark(id, req.body, actorId);
      sendSuccess(res, park);
    } catch (err) {
      next(err);
    }
  },

  async deletePark(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await parkService.deletePark(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getOverviewMetrics(req, res, next) {
    try {
      const { parkId } = getQuery(req);
      const metrics = await parkService.getOverviewMetrics(parkId);
      sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  }
};

export default parkController;

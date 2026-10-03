import locationService from '../services/location.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const locationController = {
  async getLocations(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await locationService.getLocations(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getLocationById(req, res, next) {
    try {
      const { id } = getParams(req);
      const location = await locationService.getLocationById(id);
      sendSuccess(res, location);
    } catch (err) {
      next(err);
    }
  },

  async createLocation(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const location = await locationService.createLocation(req.body, actorId);
      sendCreated(res, location);
    } catch (err) {
      next(err);
    }
  },

  async updateLocation(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const location = await locationService.updateLocation(id, req.body, actorId);
      sendSuccess(res, location);
    } catch (err) {
      next(err);
    }
  },

  async deleteLocation(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await locationService.deleteLocation(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default locationController;

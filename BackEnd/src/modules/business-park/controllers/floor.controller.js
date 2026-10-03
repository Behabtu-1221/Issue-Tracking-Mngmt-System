import floorService from '../services/floor.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const floorController = {
  async getFloors(req, res, next) {
    try {
      const queryParams = { ...getQuery(req), ...getParams(req) };
      if (req.params.buildingId) queryParams.buildingId = req.params.buildingId;
      const result = await floorService.getFloors(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getFloorById(req, res, next) {
    try {
      const { id } = getParams(req);
      const floor = await floorService.getFloorById(id);
      sendSuccess(res, floor);
    } catch (err) {
      next(err);
    }
  },

  async createFloor(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const payload = { ...req.body };
      if (req.params.buildingId) payload.BuildingID = req.params.buildingId;
      const floor = await floorService.createFloor(payload, actorId);
      sendCreated(res, floor);
    } catch (err) {
      next(err);
    }
  },

  async updateFloor(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const floor = await floorService.updateFloor(id, req.body, actorId);
      sendSuccess(res, floor);
    } catch (err) {
      next(err);
    }
  },

  async deleteFloor(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await floorService.deleteFloor(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default floorController;

import buildingService from '../services/building.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const buildingController = {
  async getBuildings(req, res, next) {
    try {
      const queryParams = { ...getQuery(req), ...getParams(req) };
      if (req.params.zoneId) queryParams.zoneId = req.params.zoneId;
      if (req.params.parkId) queryParams.parkId = req.params.parkId;
      const result = await buildingService.getBuildings(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getBuildingById(req, res, next) {
    try {
      const { id } = getParams(req);
      const building = await buildingService.getBuildingById(id);
      sendSuccess(res, building);
    } catch (err) {
      next(err);
    }
  },

  async createBuilding(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const payload = { ...req.body };
      if (req.params.zoneId) payload.FacilityZoneID = req.params.zoneId;
      if (req.params.parkId) payload.BusinessParkID = req.params.parkId;
      const building = await buildingService.createBuilding(payload, actorId);
      sendCreated(res, building);
    } catch (err) {
      next(err);
    }
  },

  async updateBuilding(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const building = await buildingService.updateBuilding(id, req.body, actorId);
      sendSuccess(res, building);
    } catch (err) {
      next(err);
    }
  },

  async deleteBuilding(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await buildingService.deleteBuilding(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default buildingController;

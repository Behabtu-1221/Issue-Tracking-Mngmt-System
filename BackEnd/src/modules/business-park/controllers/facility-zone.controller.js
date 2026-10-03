import facilityZoneService from '../services/facility-zone.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const facilityZoneController = {
  async getFacilityZones(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await facilityZoneService.getFacilityZones(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getFacilityZoneById(req, res, next) {
    try {
      const { id } = getParams(req);
      const zone = await facilityZoneService.getFacilityZoneById(id);
      sendSuccess(res, zone);
    } catch (err) {
      next(err);
    }
  },

  async createFacilityZone(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const zone = await facilityZoneService.createFacilityZone(req.body, actorId);
      sendCreated(res, zone);
    } catch (err) {
      next(err);
    }
  },

  async updateFacilityZone(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const zone = await facilityZoneService.updateFacilityZone(id, req.body, actorId);
      sendSuccess(res, zone);
    } catch (err) {
      next(err);
    }
  },

  async deleteFacilityZone(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await facilityZoneService.deleteFacilityZone(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default facilityZoneController;

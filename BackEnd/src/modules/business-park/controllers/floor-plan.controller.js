import floorPlanService from '../services/floor-plan.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams } from '../../../shared/utils/requestData.js';

export const floorPlanController = {
  async getFloorPlanByFloorId(req, res, next) {
    try {
      const { floorId } = getParams(req);
      const plan = await floorPlanService.getFloorPlanByFloorId(floorId);
      sendSuccess(res, plan);
    } catch (err) {
      next(err);
    }
  },

  async createFloorPlan(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const plan = await floorPlanService.createFloorPlan(req.body, actorId);
      sendCreated(res, plan);
    } catch (err) {
      next(err);
    }
  },

  async updateFloorPlan(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const plan = await floorPlanService.updateFloorPlan(id, req.body, actorId);
      sendSuccess(res, plan);
    } catch (err) {
      next(err);
    }
  },

  async deleteFloorPlan(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await floorPlanService.deleteFloorPlan(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default floorPlanController;

import departmentService from '../services/department.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const departmentController = {
  async getDepartments(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await departmentService.getDepartments(queryParams, req.actor, req.dataScope);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getDepartmentById(req, res, next) {
    try {
      const { id } = getParams(req);
      const dept = await departmentService.getDepartmentById(id, req.actor, req.dataScope);
      sendSuccess(res, dept);
    } catch (err) {
      next(err);
    }
  },

  async createDepartment(req, res, next) {
    try {
      const dept = await departmentService.createDepartment(req.body, req.actor, req.dataScope);
      sendCreated(res, dept);
    } catch (err) {
      next(err);
    }
  },

  async updateDepartment(req, res, next) {
    try {
      const { id } = getParams(req);
      const dept = await departmentService.updateDepartment(id, req.body, req.actor, req.dataScope);
      sendSuccess(res, dept);
    } catch (err) {
      next(err);
    }
  },

  async deleteDepartment(req, res, next) {
    try {
      const { id } = getParams(req);
      const result = await departmentService.deleteDepartment(id, req.actor, req.dataScope);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  // Department Locations
  async getLocations(req, res, next) {
    try {
      const { id } = getParams(req);
      const locations = await departmentService.getDepartmentLocations(id);
      sendSuccess(res, locations);
    } catch (err) {
      next(err);
    }
  },

  async addLocation(req, res, next) {
    try {
      const { id } = getParams(req);
      const { officeSpaceId } = req.body;
      const actorId = req.actor?.userId || 1;
      const locId = await departmentService.addDepartmentLocation(id, officeSpaceId, actorId);
      sendCreated(res, { departmentLocationId: locId });
    } catch (err) {
      next(err);
    }
  },

  async removeLocation(req, res, next) {
    try {
      const { locId } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await departmentService.removeDepartmentLocation(locId, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default departmentController;

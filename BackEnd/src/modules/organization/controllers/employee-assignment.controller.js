import employeeAssignmentService from '../services/employee-assignment.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const employeeAssignmentController = {
  async getAssignments(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await employeeAssignmentService.getAssignments(queryParams, req.dataScope);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getAssignmentById(req, res, next) {
    try {
      const { id } = getParams(req);
      const assignment = await employeeAssignmentService.getAssignmentById(id, req.dataScope);
      sendSuccess(res, assignment);
    } catch (err) {
      next(err);
    }
  },

  async createAssignment(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const assignment = await employeeAssignmentService.createAssignment(req.body, actorId, req.dataScope);
      sendCreated(res, assignment);
    } catch (err) {
      next(err);
    }
  },

  async updateAssignment(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const assignment = await employeeAssignmentService.updateAssignment(id, req.body, actorId, req.dataScope);
      sendSuccess(res, assignment);
    } catch (err) {
      next(err);
    }
  },

  async deleteAssignment(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await employeeAssignmentService.deleteAssignment(id, actorId, req.dataScope);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default employeeAssignmentController;

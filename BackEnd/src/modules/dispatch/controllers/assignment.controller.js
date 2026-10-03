import assignmentService from '../services/assignment.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const assignmentController = {
  async getOverviewMetrics(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.getOverviewMetrics(req.query.tenantId, actorUserId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getUnassignedQueue(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.getUnassignedQueue({
        search: req.query.search,
        priorityCode: req.query.priorityCode,
        departmentId: req.query.departmentId,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 50)
      }, actorUserId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getAssignments(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.getAssignments({
        search: req.query.search,
        statusCode: req.query.statusCode,
        departmentId: req.query.departmentId,
        assignedUserId: req.query.assignedUserId,
        assignedTeamId: req.query.assignedTeamId,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 50)
      }, actorUserId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getAssignmentById(req, res, next) {
    try {
      const data = await assignmentService.getAssignmentById(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async manualAssign(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.manualAssign(req.body, actorUserId);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async autoAssign(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.autoAssign(req.body.RequestID, actorUserId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async acceptAssignment(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.acceptAssignment(req.params.id, actorUserId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async rejectAssignment(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.rejectAssignment(req.params.id, req.body.rejectionReason, actorUserId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async startWork(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.startWork(req.params.id, actorUserId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async pauseWork(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.pauseWork(req.params.id, req.body.pauseReason, actorUserId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async completeWork(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.completeWork(req.params.id, req.body, actorUserId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async escalateWork(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await assignmentService.escalateWork(req.params.id, req.body, actorUserId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getMyAssignedRequests(req, res, next) {
    try {
      const userId = req.actor?.userId || req.query.userId || req.user?.id || 1;
      const data = await assignmentService.getMyAssignedRequests(userId, req.query);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
};

export default assignmentController;

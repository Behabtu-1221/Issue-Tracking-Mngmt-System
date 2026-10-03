import issueRequestService from '../services/issue-request.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const issueRequestController = {
  async getOverviewMetrics(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const metrics = await issueRequestService.getOverviewMetrics(queryParams.tenantId || req.dataScope?.tenantId, req.dataScope);
      return sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  },

  async getIssues(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await issueRequestService.getIssues(queryParams, req.dataScope);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getIssueById(req, res, next) {
    try {
      const { id } = getParams(req);
      const issue = await issueRequestService.getIssueById(id, req.dataScope);
      return sendSuccess(res, issue);
    } catch (err) {
      next(err);
    }
  },

  async createIssue(req, res, next) {
    try {
      const actorUserId = req.actor?.userId || req.user?.id;
      const actorTenantId = req.actor?.tenantId;
      const isParkAdmin = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'].includes((req.actor?.userTypeCode || '').toUpperCase());
      const effectiveTenantId = isParkAdmin ? (req.body.TenantID || actorTenantId) : actorTenantId;

      const newIssue = await issueRequestService.createIssue({
        ...req.body,
        TenantID: effectiveTenantId
      }, actorUserId);
      return sendCreated(res, newIssue);
    } catch (err) {
      next(err);
    }
  },

  async updateIssue(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorUserId = req.actor?.userId || req.user?.id;
      const updated = await issueRequestService.updateIssue(id, req.body, actorUserId, req.dataScope);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async assignIssue(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorUserId = req.actor?.userId || req.user?.id;
      const updated = await issueRequestService.assignIssue(id, req.body, actorUserId, req.dataScope);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = getParams(req);
      const { statusCode, remarks } = req.body;
      const actorUserId = req.actor?.userId || req.user?.id;
      const updated = await issueRequestService.updateStatus(id, statusCode, remarks, actorUserId, req.dataScope);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async cancelIssue(req, res, next) {
    try {
      const { id } = getParams(req);
      const { cancellationReason } = req.body;
      const actorUserId = req.actor?.userId || req.user?.id;
      const updated = await issueRequestService.cancelIssue(id, cancellationReason, actorUserId, req.dataScope);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async reopenIssue(req, res, next) {
    try {
      const { id } = getParams(req);
      const { remarks } = req.body || {};
      const actorUserId = req.actor?.userId || req.user?.id;
      const updated = await issueRequestService.reopenIssue(id, remarks, actorUserId, req.dataScope);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteIssue(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorUserId = req.actor?.userId || req.user?.id;
      const result = await issueRequestService.deleteIssue(id, actorUserId, req.dataScope);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async submitFeedback(req, res, next) {
    try {
      const { id } = getParams(req);
      const feedback = await issueRequestService.submitFeedback(id, req.body, req.actor);
      return sendCreated(res, feedback);
    } catch (err) {
      next(err);
    }
  },

  async getFeedback(req, res, next) {
    try {
      const { id } = getParams(req);
      const feedback = await issueRequestService.getFeedback(id, req.actor);
      return sendSuccess(res, feedback);
    } catch (err) {
      next(err);
    }
  }
};

export default issueRequestController;

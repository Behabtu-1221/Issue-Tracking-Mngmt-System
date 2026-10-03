import approvalService from '../services/approval.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getQuery, getParams } from '../../../shared/utils/requestData.js';

export const approvalController = {
  async getMetrics(req, res, next) {
    try {
      const { tenantId } = getQuery(req);
      const metrics = await approvalService.getMetrics(tenantId);
      return sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  },

  async getApprovals(req, res, next) {
    try {
      const params = getQuery(req);
      const result = await approvalService.getApprovals(params);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getApprovalById(req, res, next) {
    try {
      const { id } = getParams(req);
      const approval = await approvalService.getApprovalById(id);
      return sendSuccess(res, approval);
    } catch (err) {
      next(err);
    }
  },

  async getApprovalByRequestId(req, res, next) {
    try {
      const { requestId } = getParams(req);
      const approval = await approvalService.getApprovalByRequestId(requestId);
      return sendSuccess(res, approval);
    } catch (err) {
      next(err);
    }
  },

  async getPendingApprovals(req, res, next) {
    try {
      const userId = req.user?.id || req.query.userId || 1;
      const pending = await approvalService.getPendingApprovals(userId);
      return sendSuccess(res, pending);
    } catch (err) {
      next(err);
    }
  },

  async createApproval(req, res, next) {
    try {
      const approval = await approvalService.createApprovalWorkflow(req.body, req.user?.id);
      return sendSuccess(res, approval, 201);
    } catch (err) {
      next(err);
    }
  },

  async submitDecision(req, res, next) {
    try {
      const updated = await approvalService.submitDecision(req.body, req.user?.id);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
};

export default approvalController;

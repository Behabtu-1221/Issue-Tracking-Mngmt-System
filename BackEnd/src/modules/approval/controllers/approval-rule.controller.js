import approvalRuleService from '../services/approval-rule.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getQuery, getParams } from '../../../shared/utils/requestData.js';

export const approvalRuleController = {
  async getRules(req, res, next) {
    try {
      const params = getQuery(req);
      const result = await approvalRuleService.getRules(params);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getRuleById(req, res, next) {
    try {
      const { id } = getParams(req);
      const rule = await approvalRuleService.getRuleById(id);
      return sendSuccess(res, rule);
    } catch (err) {
      next(err);
    }
  },

  async createRule(req, res, next) {
    try {
      const rule = await approvalRuleService.createRule(req.body, req.user?.id);
      return sendSuccess(res, rule, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateRule(req, res, next) {
    try {
      const { id } = getParams(req);
      const updated = await approvalRuleService.updateRule(id, req.body, req.user?.id);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteRule(req, res, next) {
    try {
      const { id } = getParams(req);
      const result = await approvalRuleService.deleteRule(id, req.user?.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getThresholds(req, res, next) {
    try {
      const params = getQuery(req);
      const thresholds = await approvalRuleService.getThresholds(params);
      return sendSuccess(res, thresholds);
    } catch (err) {
      next(err);
    }
  },

  async createThreshold(req, res, next) {
    try {
      const result = await approvalRuleService.createThreshold(req.body, req.user?.id);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
};

export default approvalRuleController;

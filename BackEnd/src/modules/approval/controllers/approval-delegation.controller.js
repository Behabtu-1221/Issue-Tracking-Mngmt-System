import approvalDelegationService from '../services/approval-delegation.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getQuery, getParams } from '../../../shared/utils/requestData.js';

export const approvalDelegationController = {
  async getDelegations(req, res, next) {
    try {
      const params = getQuery(req);
      const result = await approvalDelegationService.getDelegations(params);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getDelegationById(req, res, next) {
    try {
      const { id } = getParams(req);
      const delegation = await approvalDelegationService.getDelegationById(id);
      return sendSuccess(res, delegation);
    } catch (err) {
      next(err);
    }
  },

  async createDelegation(req, res, next) {
    try {
      const delegation = await approvalDelegationService.createDelegation(req.body, req.user?.id);
      return sendSuccess(res, delegation, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateDelegation(req, res, next) {
    try {
      const { id } = getParams(req);
      const updated = await approvalDelegationService.updateDelegation(id, req.body, req.user?.id);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteDelegation(req, res, next) {
    try {
      const { id } = getParams(req);
      const result = await approvalDelegationService.deleteDelegation(id, req.user?.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default approvalDelegationController;

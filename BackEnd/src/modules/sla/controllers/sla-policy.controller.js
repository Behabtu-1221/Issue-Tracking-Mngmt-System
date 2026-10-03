import slaPolicyService from '../services/sla-policy.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const slaPolicyController = {
  async getPolicies(req, res, next) {
    try {
      const data = await slaPolicyService.getPolicies({
        search: req.query.search,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 50)
      });
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getPolicyById(req, res, next) {
    try {
      const data = await slaPolicyService.getPolicyById(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async createPolicy(req, res, next) {
    try {
      const data = await slaPolicyService.createPolicy(req.body, req.user?.id || 1);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  }
};

export default slaPolicyController;

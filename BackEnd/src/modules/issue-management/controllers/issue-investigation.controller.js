import issueInvestigationService from '../services/issue-investigation.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams } from '../../../shared/utils/requestData.js';

export const issueInvestigationController = {
  async getInvestigation(req, res, next) {
    try {
      const { issueRequestId } = getParams(req);
      const investigation = await issueInvestigationService.getInvestigation(issueRequestId);
      return sendSuccess(res, investigation);
    } catch (err) {
      next(err);
    }
  },

  async saveInvestigation(req, res, next) {
    try {
      const result = await issueInvestigationService.saveInvestigation(req.body, req.user?.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deleteInvestigation(req, res, next) {
    try {
      const { id } = getParams(req);
      const result = await issueInvestigationService.deleteInvestigation(id, req.user?.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default issueInvestigationController;

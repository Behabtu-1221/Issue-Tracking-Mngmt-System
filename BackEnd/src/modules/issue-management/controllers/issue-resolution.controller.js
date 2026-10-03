import issueResolutionService from '../services/issue-resolution.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams } from '../../../shared/utils/requestData.js';

export const issueResolutionController = {
  async getResolution(req, res, next) {
    try {
      const { issueRequestId } = getParams(req);
      const resolution = await issueResolutionService.getResolution(issueRequestId);
      return sendSuccess(res, resolution);
    } catch (err) {
      next(err);
    }
  },

  async saveResolution(req, res, next) {
    try {
      const result = await issueResolutionService.saveResolution(req.body, req.user?.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deleteResolution(req, res, next) {
    try {
      const { id } = getParams(req);
      const result = await issueResolutionService.deleteResolution(id, req.user?.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default issueResolutionController;

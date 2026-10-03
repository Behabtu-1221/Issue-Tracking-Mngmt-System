import issueCommentService from '../services/issue-comment.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const issueCommentController = {
  async getComments(req, res, next) {
    try {
      const { issueRequestId } = getParams(req);
      const queryParams = getQuery(req);
      const includeInternal = queryParams.includeInternal === 'false' ? false : true;
      const comments = await issueCommentService.getComments(issueRequestId, includeInternal);
      return sendSuccess(res, comments);
    } catch (err) {
      next(err);
    }
  },

  async addComment(req, res, next) {
    try {
      const newComment = await issueCommentService.addComment(req.body, req.user?.id);
      return sendCreated(res, newComment);
    } catch (err) {
      next(err);
    }
  },

  async deleteComment(req, res, next) {
    try {
      const { id } = getParams(req);
      const result = await issueCommentService.deleteComment(id, req.user?.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default issueCommentController;

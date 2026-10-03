import issueCommentRepository from '../repositories/issue-comment.repository.js';
import issueRequestRepository from '../repositories/issue-request.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const issueCommentService = {
  async getComments(issueRequestId, includeInternal = true) {
    const issue = await issueRequestRepository.findById(issueRequestId);
    if (!issue) {
      throw new AppError(`Issue request with ID ${issueRequestId} not found`, 404);
    }
    return issueCommentRepository.findByIssueRequestId(issueRequestId, includeInternal);
  },

  async addComment(data, userId) {
    const issue = await issueRequestRepository.findById(data.IssueRequestID);
    if (!issue) {
      throw new AppError(`Issue request with ID ${data.IssueRequestID} not found`, 404);
    }

    const authorId = data.UserID || userId || 1;
    return issueCommentRepository.create({
      ...data,
      UserID: authorId,
      CreatedBy: userId || authorId
    });
  },

  async deleteComment(id, userId) {
    await issueCommentRepository.softDelete(id, userId);
    return { message: 'Comment deleted successfully.' };
  }
};

export default issueCommentService;

import issueCommentRepository from '../repositories/issue-comment.repository.js';
import issueRequestRepository from '../repositories/issue-request.repository.js';
import AppError from '../../../shared/errors/AppError.js';

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  const role = (actor.role || actor.primaryRole || '').toUpperCase();
  const adminCodes = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN', 'ADMIN'];
  if (adminCodes.includes(code) || adminCodes.includes(role)) return true;
  if (Array.isArray(actor.roles) && actor.roles.some(r => adminCodes.includes(String(r).toUpperCase()))) return true;
  if (!actor.tenantId && (code.includes('ADMIN') || role.includes('ADMIN'))) return true;
  return false;
};

export const issueCommentService = {
  async getComments(issueRequestId, includeInternal = true, actor) {
    const issue = await issueRequestRepository.findById(issueRequestId);
    if (!issue || (!isParkAdminActor(actor) && actor?.tenantId && Number(issue.TenantID) !== Number(actor.tenantId))) {
      throw new AppError(`Issue request with ID ${issueRequestId} not found`, 404);
    }
    return issueCommentRepository.findByIssueRequestId(issueRequestId, includeInternal);
  },

  async addComment(data, userId, actor) {
    const issue = await issueRequestRepository.findById(data.IssueRequestID);
    if (!issue || (!isParkAdminActor(actor) && actor?.tenantId && Number(issue.TenantID) !== Number(actor.tenantId))) {
      throw new AppError(`Issue request with ID ${data.IssueRequestID} not found`, 404);
    }

    const authorId = data.UserID || userId || actor?.userId || 1;
    return issueCommentRepository.create({
      ...data,
      UserID: authorId,
      CreatedBy: userId || authorId
    });
  },

  async deleteComment(id, userId, actor) {
    await issueCommentRepository.softDelete(id, userId);
    return { message: 'Comment deleted successfully.' };
  }
};

export default issueCommentService;

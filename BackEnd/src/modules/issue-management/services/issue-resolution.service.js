import issueResolutionRepository from '../repositories/issue-resolution.repository.js';
import issueRequestRepository from '../repositories/issue-request.repository.js';
import issueHistoryRepository from '../repositories/issue-history.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const issueResolutionService = {
  async getResolution(issueRequestId) {
    const issue = await issueRequestRepository.findById(issueRequestId);
    if (!issue) {
      throw new AppError(`Issue request with ID ${issueRequestId} not found`, 404);
    }
    return issueResolutionRepository.findByIssueRequestId(issueRequestId);
  },

  async saveResolution(data, userId) {
    const issue = await issueRequestRepository.findById(data.IssueRequestID);
    if (!issue) {
      throw new AppError(`Issue request with ID ${data.IssueRequestID} not found`, 404);
    }

    const resolverId = data.ResolverUserID || userId || 1;
    const resolution = await issueResolutionRepository.upsert({
      ...data,
      ResolverUserID: resolverId,
      CreatedBy: userId || resolverId
    });

    // Auto update status to RESOLVED if not already resolved/closed
    if (issue.StatusCode !== 'RESOLVED' && issue.StatusCode !== 'CLOSED') {
      await issueRequestRepository.update(data.IssueRequestID, {
        StatusCode: 'RESOLVED',
        ActualResolutionDateTime: new Date(),
        ModifiedBy: userId
      });
    }

    // Record audit trail
    await issueHistoryRepository.create({
      IssueRequestID: data.IssueRequestID,
      UserID: userId || resolverId,
      FieldName: 'StatusCode',
      OldValue: issue.StatusCode,
      NewValue: 'RESOLVED',
      ActionTypeCode: 'STATUS_CHANGED',
      Remarks: `Resolution logged (${data.ResolutionTypeCode || 'PERMANENT_FIX'}): ${data.ResolutionSummary}`
    });

    return resolution;
  },

  async deleteResolution(id, userId) {
    await issueResolutionRepository.softDelete(id, userId);
    return { message: 'Resolution record removed.' };
  }
};

export default issueResolutionService;

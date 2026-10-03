import issueInvestigationRepository from '../repositories/issue-investigation.repository.js';
import issueRequestRepository from '../repositories/issue-request.repository.js';
import issueHistoryRepository from '../repositories/issue-history.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const issueInvestigationService = {
  async getInvestigation(issueRequestId) {
    const issue = await issueRequestRepository.findById(issueRequestId);
    if (!issue) {
      throw new AppError(`Issue request with ID ${issueRequestId} not found`, 404);
    }
    return issueInvestigationRepository.findByIssueRequestId(issueRequestId);
  },

  async saveInvestigation(data, userId) {
    const issue = await issueRequestRepository.findById(data.IssueRequestID);
    if (!issue) {
      throw new AppError(`Issue request with ID ${data.IssueRequestID} not found`, 404);
    }

    const investigatorId = data.InvestigatorUserID || userId || 1;
    const investigation = await issueInvestigationRepository.upsert({
      ...data,
      InvestigatorUserID: investigatorId,
      CreatedBy: userId || investigatorId
    });

    // Record audit trail
    await issueHistoryRepository.create({
      IssueRequestID: data.IssueRequestID,
      UserID: userId || investigatorId,
      ActionTypeCode: 'ROOT_CAUSE_FOUND',
      Remarks: `Root cause analysis & investigation details recorded.`
    });

    return investigation;
  },

  async deleteInvestigation(id, userId) {
    await issueInvestigationRepository.softDelete(id, userId);
    return { message: 'Root cause investigation deleted successfully.' };
  }
};

export default issueInvestigationService;

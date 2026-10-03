import api from '../../../api/client';
import dispatchApi from '../../dispatch/api/dispatchApi';
import issueManagementApi from '../../issue-management/api/issueManagementApi';

export const technicianApi = {
  // Workbench & Assignments
  getMyWorkbench: (userId) => dispatchApi.getMyWorkbench(userId),
  getAssignedRequests: (params) => dispatchApi.getAssignments(params),
  getAssignmentById: (id) => dispatchApi.getAssignmentById(id),

  // Lifecycle Execution Actions
  acceptAssignment: (id) => dispatchApi.acceptAssignment(id),
  rejectAssignment: (id, rejectionReason) => dispatchApi.rejectAssignment(id, { rejectionReason }),
  startWork: (id) => dispatchApi.startWork(id),
  pauseWork: (id, pauseReason) => dispatchApi.pauseWork(id, { pauseReason }),
  completeWork: (id, resolutionData) => dispatchApi.completeWork(id, resolutionData),
  escalateWork: (id, escalationData) => api.post(`/dispatch/assignments/${id}/escalate`, escalationData),

  // Request & Communication Details
  getIssueById: (issueId) => issueManagementApi.getIssueById(issueId),
  getComments: (issueId) => issueManagementApi.getCommentsByIssueId(issueId),
  addComment: (data) => issueManagementApi.addComment(data),
  
  // Investigation & Resolution
  getInvestigation: (issueId) => issueManagementApi.getInvestigationByIssueId(issueId),
  saveInvestigation: (data) => issueManagementApi.saveInvestigation(data),
  getResolution: (issueId) => issueManagementApi.getResolutionByIssueId(issueId),
  saveResolution: (data) => issueManagementApi.saveResolution(data),

  // Additional Information Request
  requestInfo: (issueId, messageText) => issueManagementApi.addComment({
    IssueRequestID: issueId,
    CommentText: `[INFORMATION REQUESTED]: ${messageText}`,
    IsInternal: 0
  })
};

export default technicianApi;

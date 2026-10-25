import api from '../../../api/client';

export const issueManagementApi = {
  // Overview Metrics
  getOverviewMetrics: (tenantId) => api.get('/issues/metrics', { params: { tenantId } }),

  // Core Issue Requests
  getIssues: (params) => api.get('/issues', { params }),
  getIssueById: (id) => api.get(`/issues/${id}`),
  createIssue: (data) => api.post('/issues', data),
  updateIssue: (id, data) => api.put(`/issues/${id}`, data),
  assignIssue: (id, data) => api.post(`/issues/${id}/assign`, data),
  updateStatus: (id, data) => api.post(`/issues/${id}/status`, data),
  cancelIssue: (id, data) => api.post(`/issues/${id}/cancel`, data),
  reopenIssue: (id, data) => api.post(`/issues/${id}/reopen`, data),
  deleteIssue: (id) => api.delete(`/issues/${id}`),

  // Root Cause & Investigation
  getInvestigationByIssueId: (issueRequestId) => api.get(`/issue-investigations/issue/${issueRequestId}`),
  saveInvestigation: (data) => api.post('/issue-investigations', data),
  deleteInvestigation: (id) => api.delete(`/issue-investigations/${id}`),

  // Resolution
  getResolutionByIssueId: (issueRequestId) => api.get(`/issue-resolutions/issue/${issueRequestId}`),
  saveResolution: (data) => api.post('/issue-resolutions', data),
  deleteResolution: (id) => api.delete(`/issue-resolutions/${id}`),

  // Discussion Comments
  getCommentsByIssueId: (issueRequestId, params) => api.get(`/issue-comments/issue/${issueRequestId}`, { params }),
  addComment: (data) => api.post('/issue-comments', data),
  deleteComment: (id) => api.delete(`/issue-comments/${id}`),

  // Tenant Satisfaction Feedback & Resolution Confirmation
  submitFeedback: (id, data) => api.post(`/issues/${id}/feedback`, data),
  getFeedback: (id) => api.get(`/issues/${id}/feedback`)
};

export default issueManagementApi;

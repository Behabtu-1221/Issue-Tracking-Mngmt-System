import api from '../../../api/client';

export const approvalApi = {
  // Metrics & Core Workflows
  getMetrics: (tenantId) => api.get('/approvals/metrics', { params: { tenantId } }),
  getApprovals: (params) => api.get('/approvals', { params }),
  getPendingApprovals: (userId) => api.get('/approvals/pending', { params: { userId } }),
  getApprovalById: (id) => api.get(`/approvals/${id}`),
  createApproval: (data) => api.post('/approvals', data),
  submitDecision: (data) => api.post('/approvals/decision', data),

  // Delegations
  getDelegations: (params) => api.get('/approval-delegations', { params }),
  getDelegationById: (id) => api.get(`/approval-delegations/${id}`),
  createDelegation: (data) => api.post('/approval-delegations', data),
  updateDelegation: (id, data) => api.put(`/approval-delegations/${id}`, data),
  deleteDelegation: (id) => api.delete(`/approval-delegations/${id}`),

  // Rules & Thresholds
  getRules: (params) => api.get('/approval-rules', { params }),
  getRuleById: (id) => api.get(`/approval-rules/${id}`),
  createRule: (data) => api.post('/approval-rules', data),
  updateRule: (id, data) => api.put(`/approval-rules/${id}`, data),
  deleteRule: (id) => api.delete(`/approval-rules/${id}`),
  getThresholds: (params) => api.get('/approval-rules/thresholds', { params }),
  createThreshold: (data) => api.post('/approval-rules/thresholds', data),

  // Groups & Members
  getGroups: (params) => api.get('/approval-groups', { params }),
  getGroupById: (id) => api.get(`/approval-groups/${id}`),
  createGroup: (data) => api.post('/approval-groups', data),
  updateGroup: (id, data) => api.put(`/approval-groups/${id}`, data),
  addMember: (id, data) => api.post(`/approval-groups/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/approval-groups/${id}/members/${userId}`)
};

export default approvalApi;

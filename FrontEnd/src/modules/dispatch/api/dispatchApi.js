import api from '../../../api/client';

export const dispatchApi = {
  // Metrics & Queues
  getOverviewMetrics: (tenantId) => api.get('/dispatch/overview', { params: { tenantId } }),
  getUnassignedQueue: (params) => api.get('/dispatch/unassigned', { params }),
  getAssignments: (params) => api.get('/dispatch/assignments', { params }),
  getAssignmentById: (id) => api.get(`/dispatch/assignments/${id}`),

  // Dispatch Actions
  manualAssign: (data) => api.post('/dispatch/assign/manual', data),
  autoAssign: (data) => api.post('/dispatch/assign/auto', data),

  // Field Technician Actions
  acceptAssignment: (id) => api.post(`/dispatch/assignments/${id}/accept`),
  rejectAssignment: (id, data) => api.post(`/dispatch/assignments/${id}/reject`, data),
  startWork: (id) => api.post(`/dispatch/assignments/${id}/start`),
  pauseWork: (id, data) => api.post(`/dispatch/assignments/${id}/pause`, data),
  completeWork: (id, data) => api.post(`/dispatch/assignments/${id}/complete`, data),
  escalateWork: (id, data) => api.post(`/dispatch/assignments/${id}/escalate`, data),
  getMyWorkbench: (userId) => api.get('/dispatch/my-workbench', { params: { userId } }),

  // Roster & Availability
  getTechnicians: (params) => api.get('/dispatch/technicians', { params }),
  updateAvailability: (data) => api.post('/dispatch/technicians/availability', data),
  updateLocation: (data) => api.post('/dispatch/technicians/location', data)
};

export default dispatchApi;

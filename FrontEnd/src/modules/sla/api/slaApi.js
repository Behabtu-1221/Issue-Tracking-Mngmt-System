import api from '../../../api/client';

export const slaApi = {
  // Metrics & Clocks
  getOverviewMetrics: (tenantId) => api.get('/sla/overview', { params: { tenantId } }),
  getClocks: (params) => api.get('/sla/clocks', { params }),
  getClockById: (id) => api.get(`/sla/clocks/${id}`),
  startClock: (data) => api.post('/sla/clocks', data),
  pauseClock: (id, data) => api.post(`/sla/clocks/${id}/pause`, data),
  resumeClock: (id) => api.post(`/sla/clocks/${id}/resume`),

  // Policies
  getPolicies: (params) => api.get('/sla/policies', { params }),
  getPolicyById: (id) => api.get(`/sla/policies/${id}`),
  createPolicy: (data) => api.post('/sla/policies', data),

  // Breaches
  getBreaches: (params) => api.get('/sla/breaches', { params }),
  acknowledgeBreach: (id) => api.post(`/sla/breaches/${id}/acknowledge`)
};

export default slaApi;

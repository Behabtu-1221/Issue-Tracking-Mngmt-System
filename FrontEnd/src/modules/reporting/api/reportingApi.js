import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const reportingApi = {
  // ── Core Domain Analytics ──
  getExecutiveOverview: (params) => api.get('/reports/dashboard/executive', { params }),
  getRequestAnalytics: (params) => api.get('/reports/requests', { params }),
  getAssignmentAnalytics: (params) => api.get('/reports/assignments', { params }),
  getSLAAnalytics: (params) => api.get('/reports/sla', { params }),
  getTenantPerformance: (params) => api.get('/reports/tenants', { params }),
  getDepartmentPerformance: (params) => api.get('/reports/departments', { params }),
  getApprovalAnalytics: (params) => api.get('/reports/approvals', { params }),
  getAuditAnalytics: (params) => api.get('/reports/audit', { params }),
  getKnowledgeAnalytics: () => api.get('/reports/knowledge'),

  // ── Saved Reports CRUD ──
  getSavedReports: () => api.get('/reports/saved'),
  createSavedReport: (data) => api.post('/reports/saved', data),
  updateSavedReport: (id, data) => api.put(`/reports/saved/${id}`, data),
  deleteSavedReport: (id) => api.delete(`/reports/saved/${id}`),

  // ── Report Schedules & History ──
  getReportSchedules: () => api.get('/reports/schedules'),
  createReportSchedule: (data) => api.post('/reports/schedules', data),
  updateReportSchedule: (id, data) => api.put(`/reports/schedules/${id}`, data),
  deleteReportSchedule: (id) => api.delete(`/reports/schedules/${id}`),
  triggerReportSchedule: (id) => api.post(`/reports/schedules/${id}/trigger`),
  getExecutionHistory: () => api.get('/reports/executions'),

  // ── Universal Export Download ──
  downloadReport: async (reportType, format = 'CSV', params = {}) => {
    const response = await api.get(`/reports/export/${reportType}`, {
      params: { ...params, format },
      responseType: 'blob'
    });

    const ext = format.toUpperCase() === 'EXCEL' || format.toUpperCase() === 'XLSX' ? 'xls' : 'csv';
    const blob = new Blob([response.data], {
      type: format.toUpperCase() === 'EXCEL' ? 'application/vnd.ms-excel' : 'text/csv;charset=utf-8;'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType.toLowerCase()}_export_${new Date().toISOString().slice(0, 10)}.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default reportingApi;

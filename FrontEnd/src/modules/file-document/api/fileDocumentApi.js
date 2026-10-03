import api from '../../../api/client';

export const fileDocumentApi = {
  // Metrics & Categories
  getOverviewMetrics: (tenantId) => api.get('/documents/metrics', { params: { tenantId } }),
  getCategories: () => api.get('/documents/categories'),
  createCategory: (data) => api.post('/documents/categories', data),

  // Search & List
  getDocuments: (params) => api.get('/documents', { params }),
  getDocumentById: (id) => api.get(`/documents/${id}`),

  // Uploads
  uploadFile: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadMultipleFiles: (formData) => api.post('/documents/upload-multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Download & Preview
  getDownloadUrl: (id) => `/api/documents/${id}/download`,
  getPreviewUrl: (id) => `/api/documents/${id}/preview`,

  // Versions
  addVersion: (id, formData) => api.post(`/documents/${id}/versions`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Shares
  createShare: (id, data) => api.post(`/documents/${id}/share`, data),
  getShareByToken: (token) => api.get(`/documents/share/${token}`),

  // Update, Archive, Restore, Delete
  updateDocument: (id, data) => api.patch(`/documents/${id}`, data),
  archiveDocument: (id) => api.delete(`/documents/${id}`),
  restoreDocument: (id) => api.post(`/documents/${id}/restore`),
  deletePermanent: (id) => api.delete(`/documents/${id}/permanent`)
};

export default fileDocumentApi;

import api from '../../../api/client';

export const serviceCatalogApi = {
  // Overview Metrics & Ecosystem Analytics
  getOverviewMetrics: (tenantId) => api.get('/services/metrics', { params: { tenantId } }),
  getEcosystemAnalytics: (tenantId) => api.get('/service-analytics/metrics', { params: { tenantId } }),

  // Service Categories
  getCategories: (params) => api.get('/service-categories', { params }),
  getCategoryById: (id) => api.get(`/service-categories/${id}`),
  createCategory: (data) => api.post('/service-categories', data),
  updateCategory: (id, data) => api.put(`/service-categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/service-categories/${id}`),

  // Core Services
  getServices: (params) => api.get('/services', { params }),
  getServiceById: (id) => api.get(`/services/${id}`),
  createService: (data) => api.post('/services', data),
  updateService: (id, data) => api.put(`/services/${id}`, data),
  deleteService: (id) => api.delete(`/services/${id}`),

  // Service Category Department Mappings
  getCategoryMappings: (params) => api.get('/category-mappings', { params }),
  getCategoryMappingById: (id) => api.get(`/category-mappings/${id}`),
  createCategoryMapping: (data) => api.post('/category-mappings', data),
  updateCategoryMapping: (id, data) => api.put(`/category-mappings/${id}`, data),
  updateCategoryMappingStatus: (id, data) => api.patch(`/category-mappings/${id}/status`, data),
  deleteCategoryMapping: (id) => api.delete(`/category-mappings/${id}`)
};

export default serviceCatalogApi;

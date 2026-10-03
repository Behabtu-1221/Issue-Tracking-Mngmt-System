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

  // Pricing
  getPricingByServiceId: (serviceId) => api.get(`/service-pricings/service/${serviceId}`),
  upsertPricing: (data) => api.post('/service-pricings', data),
  deletePricing: (id) => api.delete(`/service-pricings/${id}`),

  // Dynamic Requirements (Form fields & attachments)
  getRequirementsByServiceId: (serviceId) => api.get(`/service-requirements/fields/service/${serviceId}`),
  createRequirement: (data) => api.post('/service-requirements/fields', data),
  updateRequirement: (id, data) => api.put(`/service-requirements/fields/${id}`, data),
  deleteRequirement: (id) => api.delete(`/service-requirements/fields/${id}`),

  getAttachmentsByServiceId: (serviceId) => api.get(`/service-requirements/attachments/service/${serviceId}`),
  createAttachment: (data) => api.post('/service-requirements/attachments', data),
  updateAttachment: (id, data) => api.put(`/service-requirements/attachments/${id}`, data),
  deleteAttachment: (id) => api.delete(`/service-requirements/attachments/${id}`),

  // Governance (Visibility, Department, SLA, Approvals)
  getVisibilityByServiceId: (serviceId) => api.get(`/service-governance/visibility/service/${serviceId}`),
  createVisibility: (data) => api.post('/service-governance/visibility', data),
  deleteVisibility: (id) => api.delete(`/service-governance/visibility/${id}`),

  getDepartmentsByServiceId: (serviceId) => api.get(`/service-governance/departments/service/${serviceId}`),
  createServiceDepartment: (data) => api.post('/service-governance/departments', data),
  deleteServiceDepartment: (id) => api.delete(`/service-governance/departments/${id}`),

  getSLAByServiceId: (serviceId) => api.get(`/service-governance/sla/service/${serviceId}`),
  upsertSLA: (data) => api.post('/service-governance/sla', data),
  deleteSLA: (id) => api.delete(`/service-governance/sla/${id}`),

  getApprovalRulesByServiceId: (serviceId) => api.get(`/service-governance/approval-rules/service/${serviceId}`),
  createApprovalRule: (data) => api.post('/service-governance/approval-rules', data),
  deleteApprovalRule: (id) => api.delete(`/service-governance/approval-rules/${id}`),

  // Service Category Department Mappings
  getCategoryMappings: (params) => api.get('/category-mappings', { params }),
  getCategoryMappingById: (id) => api.get(`/category-mappings/${id}`),
  createCategoryMapping: (data) => api.post('/category-mappings', data),
  updateCategoryMapping: (id, data) => api.put(`/category-mappings/${id}`, data),
  updateCategoryMappingStatus: (id, data) => api.patch(`/category-mappings/${id}/status`, data),
  deleteCategoryMapping: (id) => api.delete(`/category-mappings/${id}`)
};

export default serviceCatalogApi;

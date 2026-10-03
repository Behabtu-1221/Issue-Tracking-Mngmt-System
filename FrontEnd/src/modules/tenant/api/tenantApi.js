import api from '../../../api/client';

export const tenantApi = {
  // Tenants
  getTenants: (params) => api.get('/tenants', { params }),
  getTenantMetrics: (params) => api.get('/tenants/metrics', { params }),
  getTenantById: (id) => api.get(`/tenants/${id}`),
  createTenant: (data) => api.post('/tenants', data),
  updateTenant: (id, data) => api.put(`/tenants/${id}`, data),
  updateTenantStatus: (id, Status) => api.patch(`/tenants/${id}/status`, { Status }),
  deleteTenant: (id) => api.delete(`/tenants/${id}`),

  // Sub-Tenants
  getSubTenants: (params) => api.get('/sub-tenants', { params }),
  getSubTenantById: (id) => api.get(`/sub-tenants/${id}`),
  createSubTenant: (data) => api.post('/sub-tenants', data),
  updateSubTenant: (id, data) => api.put(`/sub-tenants/${id}`, data),
  deleteSubTenant: (id) => api.delete(`/sub-tenants/${id}`),

  // Tenant Contacts
  getContacts: (params) => api.get('/tenant-contacts', { params }),
  getContactById: (id) => api.get(`/tenant-contacts/${id}`),
  createContact: (data) => api.post('/tenant-contacts', data),
  updateContact: (id, data) => api.put(`/tenant-contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/tenant-contacts/${id}`),

  // Tenant Addresses
  getAddresses: (params) => api.get('/tenant-addresses', { params }),
  getAddressById: (id) => api.get(`/tenant-addresses/${id}`),
  createAddress: (data) => api.post('/tenant-addresses', data),
  updateAddress: (id, data) => api.put(`/tenant-addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/tenant-addresses/${id}`),

  // Lease Agreements
  getLeases: (params) => api.get('/leases', { params }),
  getExpiringSoonLeases: (params) => api.get('/leases/expiring-soon', { params }),
  getLeaseById: (id) => api.get(`/leases/${id}`),
  createLease: (data) => api.post('/leases', data),
  updateLease: (id, data) => api.put(`/leases/${id}`, data),
  updateLeaseStatus: (id, Status, TerminationReason) =>
    api.patch(`/leases/${id}/status`, { Status, TerminationReason }),
  deleteLease: (id) => api.delete(`/leases/${id}`),

  // Office Allocations
  getAllocations: (params) => api.get('/office-allocations', { params }),
  getAllocationHistory: (params) => api.get('/office-allocations/history', { params }),
  getAllocationById: (id) => api.get(`/office-allocations/${id}`),
  allocateOffice: (data) => api.post('/office-allocations', data),
  releaseAllocation: (id, Remarks) => api.patch(`/office-allocations/${id}/release`, { Remarks }),
  deleteAllocation: (id) => api.delete('/office-allocations/' + id)
};

export default tenantApi;

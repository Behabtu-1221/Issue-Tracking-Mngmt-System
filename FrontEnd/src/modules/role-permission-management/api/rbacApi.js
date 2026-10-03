import api from '../../../api/client';

export const rbacApi = {
  // Role & Permission Operations
  getRoles: (params) => api.get('/roles', { params }),
  getRoleById: (id) => api.get(`/roles/${id}`),
  createRole: (roleData) => api.post('/roles', roleData),
  updateRole: (id, roleData) => api.put(`/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/roles/${id}`),
  
  getPermissions: () => api.get('/roles/permissions'),
  syncRolePermissions: (roleId, permissionIds) => api.put(`/roles/${roleId}/permissions`, { permissionIds }),
  
  assignRoleToUser: (userId, roleId) => api.post('/roles/assign', { userId, roleId }),
  unassignRoleFromUser: (userId, roleId) => api.post('/roles/unassign', { userId, roleId }),
  
  getRbacAuditLogs: (params) => api.get('/audit-logs', { params })
};

export default rbacApi;

import api from '../../../api/client';

export const identityApi = {
  // Auth endpoints
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  getMySessions: () => api.get('/auth/sessions'),
  revokeMySession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),

  // User endpoints
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  updateUserStatus: (id, statusData) => api.patch(`/users/${id}/status`, statusData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserSessions: (id) => api.get(`/users/${id}/sessions`),
  revokeUserSession: (userId, sessionId) => api.delete(`/users/${userId}/sessions/${sessionId}`),
  getUserAuditLog: (id) => api.get(`/users/${id}/audit`),

  // Role & Permission endpoints
  getRoles: (params) => api.get('/roles', { params }),
  getRoleById: (id) => api.get(`/roles/${id}`),
  createRole: (roleData) => api.post('/roles', roleData),
  updateRole: (id, roleData) => api.put(`/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/roles/${id}`),
  getPermissions: () => api.get('/roles/permissions'),
  syncRolePermissions: (roleId, permissionIds) => api.put(`/roles/${roleId}/permissions`, { permissionIds }),
  assignRoleToUser: (data) => api.post('/roles/assign', data),
  unassignRoleFromUser: (data) => api.post('/roles/unassign', data)
};

export default identityApi;

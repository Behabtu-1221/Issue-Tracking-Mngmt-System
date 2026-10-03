import api from '../../../api/client';

export const orgApi = {
  // Departments
  getDepartments: (params) => api.get('/departments', { params }),
  getDepartmentById: (id) => api.get(`/departments/${id}`),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
  getDepartmentLocations: (id) => api.get(`/departments/${id}/locations`),
  addDepartmentLocation: (id, officeSpaceId) => api.post(`/departments/${id}/locations`, { officeSpaceId }),
  removeDepartmentLocation: (locId) => api.delete(`/departments/locations/${locId}`),

  // Teams
  getTeams: (params) => api.get('/teams', { params }),
  getTeamById: (id) => api.get(`/teams/${id}`),
  createTeam: (data) => api.post('/teams', data),
  updateTeam: (id, data) => api.put(`/teams/${id}`, data),
  deleteTeam: (id) => api.delete(`/teams/${id}`),

  // Positions
  getPositions: (params) => api.get('/positions', { params }),
  getPositionById: (id) => api.get(`/positions/${id}`),
  createPosition: (data) => api.post('/positions', data),
  updatePosition: (id, data) => api.put(`/positions/${id}`, data),
  deletePosition: (id) => api.delete(`/positions/${id}`),

  // Employee Assignments
  getAssignments: (params) => api.get('/employee-assignments', { params }),
  getAssignmentById: (id) => api.get(`/employee-assignments/${id}`),
  createAssignment: (data) => api.post('/employee-assignments', data),
  updateAssignment: (id, data) => api.put(`/employee-assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/employee-assignments/${id}`),

  // Reporting Hierarchies
  getHierarchies: (params) => api.get('/reporting-hierarchies', { params }),
  getHierarchyById: (id) => api.get(`/reporting-hierarchies/${id}`),
  createHierarchy: (data) => api.post('/reporting-hierarchies', data),
  updateHierarchy: (id, data) => api.put(`/reporting-hierarchies/${id}`, data),
  deleteHierarchy: (id) => api.delete(`/reporting-hierarchies/${id}`),

  // Cost Centers
  getCostCenters: (params) => api.get('/financials/cost-centers', { params }),
  getCostCenterById: (id) => api.get(`/financials/cost-centers/${id}`),
  createCostCenter: (data) => api.post('/financials/cost-centers', data),
  updateCostCenter: (id, data) => api.put(`/financials/cost-centers/${id}`, data),
  deleteCostCenter: (id) => api.delete(`/financials/cost-centers/${id}`),

  // Department Budgets
  getBudgets: (params) => api.get('/financials/budgets', { params }),
  getBudgetById: (id) => api.get(`/financials/budgets/${id}`),
  createBudget: (data) => api.post('/financials/budgets', data),
  updateBudget: (id, data) => api.put(`/financials/budgets/${id}`, data),
  deleteBudget: (id) => api.delete(`/financials/budgets/${id}`)
};

export default orgApi;

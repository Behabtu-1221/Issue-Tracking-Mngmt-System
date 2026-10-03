import api from '../../../api/client';

export const parkApi = {
  // Parks
  getParks: (params) => api.get('/parks', { params }),
  getParkMetrics: (params) => api.get('/parks/metrics', { params }),
  getParkById: (id) => api.get(`/parks/${id}`),
  createPark: (data) => api.post('/parks', data),
  updatePark: (id, data) => api.put(`/parks/${id}`, data),
  deletePark: (id) => api.delete(`/parks/${id}`),

  // Buildings
  getBuildings: (params) => api.get('/buildings', { params }),
  getBuildingById: (id) => api.get(`/buildings/${id}`),
  createBuilding: (data) => api.post('/buildings', data),
  updateBuilding: (id, data) => api.put(`/buildings/${id}`, data),
  deleteBuilding: (id) => api.delete(`/buildings/${id}`),

  // Floors
  getFloors: (params) => api.get('/floors', { params }),
  getFloorById: (id) => api.get(`/floors/${id}`),
  createFloor: (data) => api.post('/floors', data),
  updateFloor: (id, data) => api.put(`/floors/${id}`, data),
  deleteFloor: (id) => api.delete(`/floors/${id}`),

  // Offices
  getOffices: (params) => api.get('/offices', { params }),
  getOfficeById: (id) => api.get(`/offices/${id}`),
  createOffice: (data) => api.post('/offices', data),
  updateOffice: (id, data) => api.put(`/offices/${id}`, data),
  updateOfficeStatus: (id, status) => api.patch(`/offices/${id}/status`, { status }),
  deleteOffice: (id) => api.delete(`/offices/${id}`),

  // Locations
  getLocations: (params) => api.get('/locations', { params }),
  createLocation: (data) => api.post('/locations', data),
  updateLocation: (id, data) => api.put(`/locations/${id}`, data),
  deleteLocation: (id) => api.delete(`/locations/${id}`),

  // Facility Zones
  getFacilityZones: (params) => api.get('/facility-zones', { params }),
  createFacilityZone: (data) => api.post('/facility-zones', data),
  updateFacilityZone: (id, data) => api.put(`/facility-zones/${id}`, data),
  deleteFacilityZone: (id) => api.delete(`/facility-zones/${id}`),

  // Floor Plans
  getFloorPlan: (floorId) => api.get(`/floor-plans/floor/${floorId}`),
  createFloorPlan: (data) => api.post('/floor-plans', data),
  updateFloorPlan: (id, data) => api.put(`/floor-plans/${id}`, data),
  deleteFloorPlan: (id) => api.delete(`/floor-plans/${id}`)
};

export default parkApi;

import api from '../../../api/client';

export const configApi = {
  // System Settings
  getSystemSettings: (params) => api.get('/configuration/system-settings', { params }),
  getSystemSettingById: (id) => api.get(`/configuration/system-settings/${id}`),
  createSystemSetting: (data) => api.post('/configuration/system-settings', data),
  updateSystemSetting: (id, data) => api.put(`/configuration/system-settings/${id}`, data),
  deleteSystemSetting: (id) => api.delete(`/configuration/system-settings/${id}`),

  // Feature Flags
  getFeatureFlags: (params) => api.get('/configuration/feature-flags', { params }),
  createFeatureFlag: (data) => api.post('/configuration/feature-flags', data),
  updateFeatureFlag: (id, data) => api.put(`/configuration/feature-flags/${id}`, data),
  toggleFeatureFlag: (id) => api.patch(`/configuration/feature-flags/${id}/toggle`),
  deleteFeatureFlag: (id) => api.delete(`/configuration/feature-flags/${id}`),

  // Lookup Types & Values
  getLookupTypes: (params) => api.get('/configuration/lookup-types', { params }),
  createLookupType: (data) => api.post('/configuration/lookup-types', data),
  updateLookupType: (id, data) => api.put(`/configuration/lookup-types/${id}`, data),
  deleteLookupType: (id) => api.delete(`/configuration/lookup-types/${id}`),
  getLookupValues: (typeId) => api.get(`/configuration/lookup-types/${typeId}/values`),
  createLookupValue: (typeId, data) => api.post(`/configuration/lookup-types/${typeId}/values`, data),
  updateLookupValue: (typeId, valueId, data) => api.put(`/configuration/lookup-types/${typeId}/values/${valueId}`, data),
  deleteLookupValue: (typeId, valueId) => api.delete(`/configuration/lookup-types/${typeId}/values/${valueId}`),

  // Business Rules
  getBusinessRules: (params) => api.get('/configuration/business-rules', { params }),
  createBusinessRule: (data) => api.post('/configuration/business-rules', data),
  updateBusinessRule: (id, data) => api.put(`/configuration/business-rules/${id}`, data),
  toggleBusinessRule: (id) => api.patch(`/configuration/business-rules/${id}/toggle`),
  deleteBusinessRule: (id) => api.delete(`/configuration/business-rules/${id}`),

  // Number Sequences
  getNumberSequences: (params) => api.get('/configuration/number-sequences', { params }),
  createNumberSequence: (data) => api.post('/configuration/number-sequences', data),
  updateNumberSequence: (id, data) => api.put(`/configuration/number-sequences/${id}`, data),
  generateNextNumber: (id) => api.post(`/configuration/number-sequences/${id}/next`),
  deleteNumberSequence: (id) => api.delete(`/configuration/number-sequences/${id}`),

  // Localization & Resources
  getLocalizations: (params) => api.get('/configuration/localizations', { params }),
  createLocalization: (data) => api.post('/configuration/localizations', data),
  updateLocalization: (id, data) => api.put(`/configuration/localizations/${id}`, data),
  deleteLocalization: (id) => api.delete(`/configuration/localizations/${id}`),
  getLanguageResources: (localizationId) => api.get(`/configuration/localizations/${localizationId}/resources`),
  saveLanguageResource: (localizationId, data) => api.post(`/configuration/localizations/${localizationId}/resources`, data),

  // Calendars & Holidays
  getCalendars: (params) => api.get('/configuration/calendars', { params }),
  createCalendar: (data) => api.post('/configuration/calendars', data),
  updateCalendar: (id, data) => api.put(`/configuration/calendars/${id}`, data),
  deleteCalendar: (id) => api.delete(`/configuration/calendars/${id}`),
  getCalendarHolidays: (calendarId) => api.get(`/configuration/calendars/${calendarId}/holidays`),
  saveCalendarHoliday: (calendarId, data) => api.post(`/configuration/calendars/${calendarId}/holidays`, data),
  deleteCalendarHoliday: (calendarId, holidayId) => api.delete(`/configuration/calendars/${calendarId}/holidays/${holidayId}`),

  // Bootstrap
  getBootstrap: () => api.get('/configuration/bootstrap')
};

export default configApi;

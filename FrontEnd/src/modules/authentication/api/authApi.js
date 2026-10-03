import api from '../../../api/client';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (username) => api.post('/auth/forgot-password', { username }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  changePassword: (data) => api.post('/auth/change-password', data),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  updateNotificationPreferences: (prefs) => api.put('/auth/notification-preferences', prefs),
  getSessions: () => api.get('/auth/sessions'),
  revokeSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`)
};

export default authApi;

import api from '../../../api/client';

export const notificationApi = {
  // Overview Metrics
  getOverviewMetrics: () => api.get('/notifications/overview'),

  // Reference data
  getTypes: () => api.get('/notifications/types'),
  getChannels: () => api.get('/notifications/channels'),

  // User Inbox, Unread Count & Actions
  getInbox: (params) => api.get('/notifications/inbox', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: (data) => api.patch('/notifications/read-all', data),

  // Event Triggers & Dispatch
  notifyEvent: (eventCode, contextData) => api.post('/notifications/event', { eventCode, contextData }),
  dispatchNotification: (data) => api.post('/notifications/dispatch', data),

  // Notification Preferences
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (preferences) => api.put('/notifications/preferences', { preferences }),

  // Delivery Audit Log
  getDeliveryLog: (params) => api.get('/notifications/delivery-log', { params }),

  // Templates
  getTemplates: () => api.get('/notifications/templates'),
  createTemplate: (data) => api.post('/notifications/templates', data),
  updateTemplate: (id, data) => api.put(`/notifications/templates/${id}`, data),

  // Reminders
  getReminders: (params) => api.get('/notifications/reminders', { params }),
  createReminder: (data) => api.post('/notifications/reminders', data),
  completeReminder: (id) => api.patch(`/notifications/reminders/${id}/complete`),

  // Test Email
  sendTestEmail: (data) => api.post('/notifications/test-email', data)
};

export default notificationApi;

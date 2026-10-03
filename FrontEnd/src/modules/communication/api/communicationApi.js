import api from '../../../api/client';

/**
 * Communication API Client — Production-Ready
 * Request-centered conversations, messages, internal notes, comments, announcements.
 */
export const communicationApi = {
  // ── Overview Metrics ──
  getOverviewMetrics: () => api.get('/communication/overview'),

  // ── Conversations ──
  getUserConversations: (params = {}) => api.get('/communication/conversations', { params }),
  getConversationByRequestId: (issueRequestId) =>
    api.get(`/communication/conversations/request/${issueRequestId}`),
  getOrCreateRequestConversation: (issueRequestId) =>
    api.post(`/communication/conversations/request/${issueRequestId}`),
  getConversationParticipants: (conversationId) =>
    api.get(`/communication/conversations/${conversationId}/participants`),
  addParticipant: (conversationId, userId) =>
    api.post(`/communication/conversations/${conversationId}/participants`, { userId }),

  // ── Messages ──
  getMessages: (conversationId, params = {}) =>
    api.get(`/communication/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, MessageText) =>
    api.post(`/communication/conversations/${conversationId}/messages`, { MessageText }),
  sendRequestMessage: (issueRequestId, MessageText) =>
    api.post(`/communication/requests/${issueRequestId}/messages`, { MessageText }),
  markAsRead: (conversationId) =>
    api.put(`/communication/conversations/${conversationId}/read`),

  // ── Internal Notes (Staff-Only) ──
  getInternalNotes: (requestId) => api.get(`/communication/notes/${requestId}`),
  addInternalNote: (requestId, NoteText) =>
    api.post(`/communication/notes/${requestId}`, { NoteText }),
  deleteInternalNote: (noteId) => api.delete(`/communication/notes/${noteId}`),

  // ── Request Comments (Legacy) ──
  getComments: (issueRequestId) => api.get(`/communication/comments/${issueRequestId}`),
  addComment: (data) => api.post('/communication/comments', data),
  deleteComment: (id) => api.delete(`/communication/comments/${id}`),

  // ── Announcements ──
  getAnnouncements: (params = {}) => api.get('/communication/announcements', { params }),
  createAnnouncement: (data) => api.post('/communication/announcements', data),
  deleteAnnouncement: (id) => api.delete(`/communication/announcements/${id}`),

  // ── Team Channels / Discussion Groups ──
  getTeamDiscussions: () => api.get('/communication/channels'),
  getTeamMessages: (channelId) => api.get(`/communication/channels/${channelId}/messages`),
  addTeamMessage: (channelId, data) => api.post(`/communication/channels/${channelId}/messages`, data),
  createTeamDiscussion: (data) => api.post('/communication/channels', data),

  // ── Activity Timeline ──
  getActivityTimeline: (issueRequestId) =>
    api.get(`/communication/activity/${issueRequestId}`)
};

export default communicationApi;

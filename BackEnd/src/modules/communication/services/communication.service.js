import communicationRepository from '../repositories/communication.repository.js';
import { query } from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';

/**
 * Communication Service — Production-Ready
 * Business logic for request-centered conversations, messages,
 * internal notes, comments, and announcements.
 */
export const communicationService = {

  // ════════════════════════════════════════════════════════════════════════
  //  OVERVIEW METRICS
  // ════════════════════════════════════════════════════════════════════════

  async getOverviewMetrics(userId) {
    return communicationRepository.getOverviewMetrics(userId);
  },

  // ════════════════════════════════════════════════════════════════════════
  //  CONVERSATIONS
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Get all conversations the current user participates in.
   */
  async getUserConversations(userId, pagination = {}) {
    if (!userId) throw new AppError('User ID is required', 400);
    return communicationRepository.getUserConversations(userId, pagination);
  },

  /**
   * Get or create a conversation for a specific request.
   * Automatically adds the requesting user and all request stakeholders as participants.
   */
  async getOrCreateRequestConversation(issueRequestId, userId) {
    if (!issueRequestId) throw new AppError('IssueRequestID is required', 400);
    if (!userId) throw new AppError('User ID is required', 400);

    const conversationId = await communicationRepository.getOrCreateConversation(issueRequestId, userId);

    // Auto-add request stakeholders (requester, technician, manager)
    await communicationRepository.autoAddRequestParticipants(conversationId, issueRequestId);

    return { conversationId };
  },

  /**
   * Get conversation details by request ID.
   */
  async getConversationByRequestId(issueRequestId, userId, isStaff = false) {
    if (!issueRequestId) throw new AppError('IssueRequestID is required', 400);

    const conversation = await communicationRepository.getConversationByRequestId(issueRequestId);
    if (!conversation) return null;

    // Verify participation
    const isParticipant = await communicationRepository.isParticipant(
      conversation.ConversationID, userId
    );

    if (!isParticipant) {
      if (isStaff) {
        // Staff/Admin automatically enrolled as participant upon inspection
        await communicationRepository.ensureParticipant(conversation.ConversationID, userId);
      } else {
        // Auto-add the user if they have a stakeholder relationship with the request
        await communicationRepository.autoAddRequestParticipants(
          conversation.ConversationID, issueRequestId
        );

        // Re-check
        const isNowParticipant = await communicationRepository.isParticipant(
          conversation.ConversationID, userId
        );
        if (!isNowParticipant) {
          throw new AppError('You are not authorized to view this conversation', 403);
        }
      }
    }

    const participants = await communicationRepository.getConversationParticipants(
      conversation.ConversationID
    );

    return { ...conversation, participants };
  },

  /**
   * Get participants of a conversation.
   */
  async getConversationParticipants(conversationId, userId, isStaff = false) {
    let isParticipant = await communicationRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      if (isStaff) {
        await communicationRepository.ensureParticipant(conversationId, userId);
      } else {
        throw new AppError('You are not authorized to view this conversation', 403);
      }
    }
    return communicationRepository.getConversationParticipants(conversationId);
  },

  /**
   * Add a participant to a conversation.
   */
  async addParticipant(conversationId, targetUserId, actorUserId) {
    if (!conversationId || !targetUserId) {
      throw new AppError('ConversationID and TargetUserID are required', 400);
    }
    await communicationRepository.ensureParticipant(conversationId, targetUserId);
    return { success: true };
  },

  // ════════════════════════════════════════════════════════════════════════
  //  MESSAGES
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Get messages for a conversation.
   */
  async getMessages(conversationId, userId, pagination = {}, isStaff = false) {
    if (!conversationId) throw new AppError('ConversationID is required', 400);

    // Authorize
    let isParticipant = await communicationRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      if (isStaff) {
        await communicationRepository.ensureParticipant(conversationId, userId);
      } else {
        throw new AppError('You are not authorized to view these messages', 403);
      }
    }

    return communicationRepository.getMessages(conversationId, userId, pagination);
  },

  /**
   * Send a message in a conversation.
   */
  async sendMessage(conversationId, senderUserId, messageText, isStaff = false) {
    if (!conversationId) throw new AppError('ConversationID is required', 400);
    if (!messageText || !messageText.trim()) throw new AppError('Message text is required', 400);

    // Authorize
    let isParticipant = await communicationRepository.isParticipant(conversationId, senderUserId);
    if (!isParticipant) {
      if (isStaff) {
        await communicationRepository.ensureParticipant(conversationId, senderUserId);
      } else {
        throw new AppError('You are not authorized to send messages in this conversation', 403);
      }
    }

    const message = await communicationRepository.sendMessage(
      conversationId, senderUserId, messageText.trim()
    );

    // Trigger notification for other participants (fire-and-forget)
    this._triggerMessageNotification(conversationId, senderUserId, messageText).catch(() => {});

    return message;
  },

  /**
   * Send a message in the context of a request.
   * Creates or finds the conversation automatically.
   */
  async sendRequestMessage(issueRequestId, senderUserId, messageText, isStaff = false) {
    if (!issueRequestId) throw new AppError('IssueRequestID is required', 400);
    if (!messageText || !messageText.trim()) throw new AppError('Message text is required', 400);

    const conversationId = await communicationRepository.getOrCreateConversation(
      issueRequestId, senderUserId
    );

    // Auto-add stakeholders
    await communicationRepository.autoAddRequestParticipants(conversationId, issueRequestId);

    const message = await communicationRepository.sendMessage(
      conversationId, senderUserId, messageText.trim()
    );

    this._triggerMessageNotification(conversationId, senderUserId, messageText).catch(() => {});

    return message;
  },

  /**
   * Mark all messages in a conversation as read by the current user.
   */
  async markAsRead(conversationId, userId) {
    if (!conversationId) throw new AppError('ConversationID is required', 400);
    const count = await communicationRepository.markMessagesAsRead(conversationId, userId);
    return { markedAsRead: count };
  },

  /**
   * Fire-and-forget notification trigger for new messages.
   */
  async _triggerMessageNotification(conversationId, senderUserId, messageText) {
    try {
      const notificationModule = await import('../../notification/services/notification.service.js');
      const notificationService = notificationModule.default || notificationModule.notificationService;
      if (notificationService?.notifyEvent) {
        const [conv] = await query(
          'SELECT ReferenceIssueRequestID FROM Conversation WHERE ConversationID = ?',
          [conversationId]
        );
        const requestId = conv?.ReferenceIssueRequestID;
        if (requestId) {
          await notificationService.notifyEvent('NEW_COMMENT', {
            requestId,
            messageText: messageText.substring(0, 200)
          }, senderUserId);
        }
      }
    } catch (err) {
      console.warn('[Communication] Notification trigger failed:', err.message);
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  //  INTERNAL NOTES (Staff-Only)
  // ════════════════════════════════════════════════════════════════════════

  async getInternalNotes(requestId) {
    if (!requestId) throw new AppError('RequestID is required', 400);
    return communicationRepository.getInternalNotes(requestId);
  },

  async addInternalNote(requestId, authorUserId, noteText) {
    if (!requestId) throw new AppError('RequestID is required', 400);
    if (!noteText || !noteText.trim()) throw new AppError('Note text is required', 400);
    return communicationRepository.addInternalNote(requestId, authorUserId, noteText.trim());
  },

  async deleteInternalNote(noteId, userId) {
    if (!noteId) throw new AppError('NoteID is required', 400);
    await communicationRepository.deleteInternalNote(noteId, userId);
    return { noteId, deleted: true };
  },

  // ════════════════════════════════════════════════════════════════════════
  //  REQUEST COMMENTS (Legacy compatibility)
  // ════════════════════════════════════════════════════════════════════════

  async getCommentsByIssueId(issueRequestId, isStaffUser = true) {
    if (!issueRequestId) throw new AppError('IssueRequestID is required', 400);
    return communicationRepository.getCommentsByIssueId(issueRequestId, isStaffUser);
  },

  async addComment(data, userId = 1) {
    if (!data.IssueRequestID || !data.CommentText) {
      throw new AppError('IssueRequestID and CommentText are required', 400);
    }
    const commentId = await communicationRepository.addComment({
      IssueRequestID: data.IssueRequestID,
      UserID: userId,
      CommentText: data.CommentText,
      IsInternal: data.IsInternal || false
    });
    const comments = await communicationRepository.getCommentsByIssueId(data.IssueRequestID, true);
    return comments.find(c => c.IssueRequestCommentID === commentId);
  },

  async deleteComment(commentId, userId = 1) {
    await communicationRepository.deleteComment(commentId, userId);
    return { commentId, deleted: true };
  },

  // ════════════════════════════════════════════════════════════════════════
  //  ANNOUNCEMENTS
  // ════════════════════════════════════════════════════════════════════════

  async getAnnouncements(pagination = {}) {
    return communicationRepository.getAnnouncements(pagination);
  },

  async createAnnouncement(data, userId = 1) {
    if (!data.Title || !data.Message) {
      throw new AppError('Title and Message are required for announcement', 400);
    }
    const announcementId = await communicationRepository.createAnnouncement({
      Title: data.Title,
      Message: data.Message,
      BusinessParkID: data.BusinessParkID,
      TargetTenantID: data.TargetTenantID,
      ExpiryDateTime: data.ExpiryDateTime,
      CreatedBy: userId
    });

    // Centralized notification event trigger
    try {
      const notificationModule = await import('../../notification/services/notification.service.js');
      const notificationService = notificationModule.default || notificationModule.notificationService;
      if (notificationService?.notifyEvent) {
        await notificationService.notifyEvent('SYSTEM_ANNOUNCEMENT', {
          tenantId: data.TargetTenantID,
          title: data.Title,
          message: data.Message
        }, userId);
      }
    } catch (err) {
      console.warn('[Communication] Announcement notification failed:', err.message);
    }

    const result = await communicationRepository.getAnnouncements();
    return result.announcements.find(a => Number(a.AnnouncementID) === Number(announcementId));
  },

  async deleteAnnouncement(announcementId, userId) {
    if (!announcementId) throw new AppError('AnnouncementID is required', 400);
    await communicationRepository.deleteAnnouncement(announcementId, userId);
    return { announcementId, deleted: true };
  },

  // ════════════════════════════════════════════════════════════════════════
  //  TEAM CHANNELS / DISCUSSION GROUPS
  // ════════════════════════════════════════════════════════════════════════

  async getDiscussionGroups() {
    return communicationRepository.getDiscussionGroups();
  },

  async createDiscussionGroup(title, topic, userId) {
    if (!title || !title.trim()) throw new AppError('Channel name is required', 400);
    const id = await communicationRepository.createDiscussionGroup(title.trim(), topic, userId);
    return { id, title };
  },

  async getDiscussionMessages(groupId) {
    if (!groupId) throw new AppError('Channel ID is required', 400);
    return communicationRepository.getDiscussionMessages(groupId);
  },

  async addDiscussionMessage(groupId, userId, text) {
    if (!groupId) throw new AppError('Channel ID is required', 400);
    if (!text || !text.trim()) throw new AppError('Message text is required', 400);
    return communicationRepository.addDiscussionMessage(groupId, userId, text.trim());
  },

  // ════════════════════════════════════════════════════════════════════════
  //  ACTIVITY TIMELINE
  // ════════════════════════════════════════════════════════════════════════

  async getActivityTimeline(issueRequestId) {
    if (!issueRequestId) throw new AppError('IssueRequestID is required', 400);
    return communicationRepository.getActivityTimeline(issueRequestId);
  }
};

export default communicationService;

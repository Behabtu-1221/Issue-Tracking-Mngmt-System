import communicationService from '../services/communication.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import AppError from '../../../shared/errors/AppError.js';

const getUserId = (req) => req.actor?.userId || req.user?.id || req.user?.userId || 1;
const isStaffActor = (req) => {
  const type = (req.actor?.userTypeCode || req.user?.role || '').toUpperCase();
  return !['TENANT', 'EMPLOYEE', 'CUSTOMER', 'GUEST'].includes(type);
};

/**
 * Communication Controller — Production-Ready
 */
export const communicationController = {

  // ── Metrics ──
  async getOverviewMetrics(req, res, next) {
    try {
      const userId = getUserId(req);
      const data = await communicationService.getOverviewMetrics(userId);
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  // ── Conversations ──
  async getUserConversations(req, res, next) {
    try {
      const userId = getUserId(req);
      const { page = 1, limit = 20 } = req.query;
      const data = await communicationService.getUserConversations(userId, {
        page: parseInt(page), limit: parseInt(limit)
      });
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async getOrCreateRequestConversation(req, res, next) {
    try {
      const userId = getUserId(req);
      const { issueRequestId } = req.params;
      const data = await communicationService.getOrCreateRequestConversation(
        parseInt(issueRequestId), userId
      );
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async getConversationByRequestId(req, res, next) {
    try {
      const userId = getUserId(req);
      const isStaff = isStaffActor(req);
      const { issueRequestId } = req.params;
      const data = await communicationService.getConversationByRequestId(
        parseInt(issueRequestId), userId, isStaff
      );
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async getConversationParticipants(req, res, next) {
    try {
      const userId = getUserId(req);
      const isStaff = isStaffActor(req);
      const { conversationId } = req.params;
      const data = await communicationService.getConversationParticipants(
        parseInt(conversationId), userId, isStaff
      );
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async addParticipant(req, res, next) {
    try {
      const actorUserId = getUserId(req);
      const { conversationId } = req.params;
      const { userId } = req.body;
      const data = await communicationService.addParticipant(
        parseInt(conversationId), parseInt(userId), actorUserId
      );
      return sendSuccess(res, data, 201);
    } catch (err) { next(err); }
  },

  // ── Messages ──
  async getMessages(req, res, next) {
    try {
      const userId = getUserId(req);
      const isStaff = isStaffActor(req);
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const data = await communicationService.getMessages(
        parseInt(conversationId), userId, { page: parseInt(page), limit: parseInt(limit) }, isStaff
      );
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async sendMessage(req, res, next) {
    try {
      const userId = getUserId(req);
      const isStaff = isStaffActor(req);
      const { conversationId } = req.params;
      const { MessageText } = req.body;
      const data = await communicationService.sendMessage(
        parseInt(conversationId), userId, MessageText, isStaff
      );
      return sendSuccess(res, data, 201);
    } catch (err) { next(err); }
  },

  async sendRequestMessage(req, res, next) {
    try {
      const userId = getUserId(req);
      const isStaff = isStaffActor(req);
      const { issueRequestId } = req.params;
      const { MessageText } = req.body;
      const data = await communicationService.sendRequestMessage(
        parseInt(issueRequestId), userId, MessageText, isStaff
      );
      return sendSuccess(res, data, 201);
    } catch (err) { next(err); }
  },

  async markAsRead(req, res, next) {
    try {
      const userId = getUserId(req);
      const { conversationId } = req.params;
      const data = await communicationService.markAsRead(parseInt(conversationId), userId);
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  // ── Internal Notes (Staff-Only) ──
  async getInternalNotes(req, res, next) {
    try {
      if (!isStaffActor(req)) {
        throw new AppError('Internal notes are restricted to park staff only', 403);
      }
      const { requestId } = req.params;
      const data = await communicationService.getInternalNotes(parseInt(requestId));
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async addInternalNote(req, res, next) {
    try {
      if (!isStaffActor(req)) {
        throw new AppError('Internal notes are restricted to park staff only', 403);
      }
      const userId = getUserId(req);
      const { requestId } = req.params;
      const { NoteText } = req.body;
      const data = await communicationService.addInternalNote(
        parseInt(requestId), userId, NoteText
      );
      return sendSuccess(res, data, 201);
    } catch (err) { next(err); }
  },

  async deleteInternalNote(req, res, next) {
    try {
      if (!isStaffActor(req)) {
        throw new AppError('Internal notes are restricted to park staff only', 403);
      }
      const userId = getUserId(req);
      const { noteId } = req.params;
      const data = await communicationService.deleteInternalNote(parseInt(noteId), userId);
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  // ── Request Comments (Legacy compatibility) ──
  async getComments(req, res, next) {
    try {
      const isStaff = isStaffActor(req);
      const data = await communicationService.getCommentsByIssueId(
        parseInt(req.params.issueRequestId), isStaff
      );
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async addComment(req, res, next) {
    try {
      const userId = getUserId(req);
      const data = await communicationService.addComment(req.body, userId);
      return sendSuccess(res, data, 201);
    } catch (err) { next(err); }
  },

  async deleteComment(req, res, next) {
    try {
      const userId = getUserId(req);
      const data = await communicationService.deleteComment(parseInt(req.params.id), userId);
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  // ── Announcements ──
  async getAnnouncements(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const data = await communicationService.getAnnouncements({
        page: parseInt(page), limit: parseInt(limit)
      });
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async createAnnouncement(req, res, next) {
    try {
      const userId = getUserId(req);
      const data = await communicationService.createAnnouncement(req.body, userId);
      return sendSuccess(res, data, 201);
    } catch (err) { next(err); }
  },

  async deleteAnnouncement(req, res, next) {
    try {
      const userId = getUserId(req);
      const data = await communicationService.deleteAnnouncement(parseInt(req.params.id), userId);
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  // ── Team Channels / Discussion Groups ──
  async getDiscussionGroups(req, res, next) {
    try {
      const data = await communicationService.getDiscussionGroups();
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async createDiscussionGroup(req, res, next) {
    try {
      const userId = getUserId(req);
      const { Title, Topic } = req.body;
      const data = await communicationService.createDiscussionGroup(Title, Topic, userId);
      return sendSuccess(res, data, 201);
    } catch (err) { next(err); }
  },

  async getDiscussionMessages(req, res, next) {
    try {
      const { channelId } = req.params;
      const data = await communicationService.getDiscussionMessages(parseInt(channelId));
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  },

  async addDiscussionMessage(req, res, next) {
    try {
      const userId = getUserId(req);
      const { channelId } = req.params;
      const { MessageText } = req.body;
      const data = await communicationService.addDiscussionMessage(parseInt(channelId), userId, MessageText);
      return sendSuccess(res, data, 201);
    } catch (err) { next(err); }
  },

  // ── Activity Timeline ──
  async getActivityTimeline(req, res, next) {
    try {
      const data = await communicationService.getActivityTimeline(
        parseInt(req.params.issueRequestId)
      );
      return sendSuccess(res, data);
    } catch (err) { next(err); }
  }
};

export default communicationController;

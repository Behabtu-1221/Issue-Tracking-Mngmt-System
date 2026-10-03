import { Router } from 'express';
import communicationController from '../controllers/communication.controller.js';

const router = Router();

// ── Overview Metrics ──
router.get('/overview', communicationController.getOverviewMetrics);

// ── Conversations ──
router.get('/conversations', communicationController.getUserConversations);
router.get('/conversations/request/:issueRequestId', communicationController.getConversationByRequestId);
router.post('/conversations/request/:issueRequestId', communicationController.getOrCreateRequestConversation);
router.get('/conversations/:conversationId/participants', communicationController.getConversationParticipants);
router.post('/conversations/:conversationId/participants', communicationController.addParticipant);

// ── Messages ──
router.get('/conversations/:conversationId/messages', communicationController.getMessages);
router.post('/conversations/:conversationId/messages', communicationController.sendMessage);
router.post('/requests/:issueRequestId/messages', communicationController.sendRequestMessage);
router.put('/conversations/:conversationId/read', communicationController.markAsRead);

// ── Internal Notes (Staff-only) ──
router.get('/notes/:requestId', communicationController.getInternalNotes);
router.post('/notes/:requestId', communicationController.addInternalNote);
router.delete('/notes/:noteId', communicationController.deleteInternalNote);

// ── Request Comments (Legacy compatibility) ──
router.get('/comments/:issueRequestId', communicationController.getComments);
router.post('/comments', communicationController.addComment);
router.delete('/comments/:id', communicationController.deleteComment);

// ── Announcements ──
router.get('/announcements', communicationController.getAnnouncements);
router.post('/announcements', communicationController.createAnnouncement);
router.delete('/announcements/:id', communicationController.deleteAnnouncement);

// ── Team Channels / Discussion Groups ──
router.get('/channels', communicationController.getDiscussionGroups);
router.post('/channels', communicationController.createDiscussionGroup);
router.get('/channels/:channelId/messages', communicationController.getDiscussionMessages);
router.post('/channels/:channelId/messages', communicationController.addDiscussionMessage);

// ── Activity Timeline ──
router.get('/activity/:issueRequestId', communicationController.getActivityTimeline);

export default router;

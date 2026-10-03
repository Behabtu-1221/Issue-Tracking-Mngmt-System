import { Router } from 'express';
import communicationController from '../controllers/communication.controller.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

const staffRoles = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER', 'TECHNICIAN', 'DISPATCHER'];
const adminRoles = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'];

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
router.get('/notes/:requestId', authorizeRoles(...staffRoles), communicationController.getInternalNotes);
router.post('/notes/:requestId', authorizeRoles(...staffRoles), communicationController.addInternalNote);
router.delete('/notes/:noteId', authorizeRoles(...staffRoles), communicationController.deleteInternalNote);

// ── Request Comments (Legacy compatibility) ──
router.get('/comments/:issueRequestId', communicationController.getComments);
router.post('/comments', communicationController.addComment);
router.delete('/comments/:id', communicationController.deleteComment);

// ── Announcements ──
router.get('/announcements', communicationController.getAnnouncements);
router.post('/announcements', authorizeRoles(...adminRoles), communicationController.createAnnouncement);
router.delete('/announcements/:id', authorizeRoles(...adminRoles), communicationController.deleteAnnouncement);

// ── Team Channels / Discussion Groups ──
router.get('/channels', communicationController.getDiscussionGroups);
router.post('/channels', authorizeRoles(...adminRoles), communicationController.createDiscussionGroup);
router.get('/channels/:channelId/messages', communicationController.getDiscussionMessages);
router.post('/channels/:channelId/messages', communicationController.addDiscussionMessage);

// ── Activity Timeline ──
router.get('/activity/:issueRequestId', communicationController.getActivityTimeline);

export default router;

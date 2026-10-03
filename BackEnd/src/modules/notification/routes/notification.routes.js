import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

const adminOnly = authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN');
const managerOrAdmin = authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER');

// Metrics & Types/Channels
router.get('/overview', notificationController.getOverviewMetrics);
router.get('/types', notificationController.getNotificationTypes);
router.get('/channels', notificationController.getNotificationChannels);

// User Inbox, Unread Count & Actions
router.get('/inbox', notificationController.getUserNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markAsRead);

// Event Trigger & Dispatch
router.post('/event', notificationController.notifyEvent);
router.post('/dispatch', managerOrAdmin, notificationController.dispatchNotification);

// User Preferences
router.get('/preferences', notificationController.getUserPreferences);
router.put('/preferences', notificationController.updateUserPreferences);

// Delivery Audit Log
router.get('/delivery-log', adminOnly, notificationController.getDeliveryLog);

// Templates
router.get('/templates', notificationController.getTemplates);
router.post('/templates', adminOnly, notificationController.createTemplate);
router.put('/templates/:id', adminOnly, notificationController.updateTemplate);

// Reminders
router.get('/reminders', notificationController.getReminders);
router.post('/reminders', notificationController.createReminder);
router.patch('/reminders/:id/complete', notificationController.completeReminder);

// Test Email
router.post('/test-email', adminOnly, notificationController.sendTestEmail);

export default router;

import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';

const router = Router();

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
router.post('/dispatch', notificationController.dispatchNotification);

// User Preferences
router.get('/preferences', notificationController.getUserPreferences);
router.put('/preferences', notificationController.updateUserPreferences);

// Delivery Audit Log
router.get('/delivery-log', notificationController.getDeliveryLog);

// Templates
router.get('/templates', notificationController.getTemplates);
router.post('/templates', notificationController.createTemplate);
router.put('/templates/:id', notificationController.updateTemplate);

// Reminders
router.get('/reminders', notificationController.getReminders);
router.post('/reminders', notificationController.createReminder);
router.patch('/reminders/:id/complete', notificationController.completeReminder);

// Test Email
router.post('/test-email', notificationController.sendTestEmail);

export default router;

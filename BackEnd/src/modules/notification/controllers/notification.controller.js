import notificationService from '../services/notification.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export const notificationController = {
  async getOverviewMetrics(req, res, next) {
    try {
      const data = await notificationService.getOverviewMetrics();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getUserNotifications(req, res, next) {
    try {
      const isParkAdmin = req.actor?.isParkAdmin || ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'].includes((req.actor?.userTypeCode || '').toUpperCase());
      const userId = (isParkAdmin && req.query.userId) ? parseInt(req.query.userId, 10) : (req.actor?.userId || req.user?.id || 1);
      const data = await notificationService.getUserNotifications(userId, {
        unreadOnly: req.query.unreadOnly === 'true',
        limit: req.query.limit || 50,
        offset: req.query.offset || 0
      });
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const isParkAdmin = req.actor?.isParkAdmin || ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'].includes((req.actor?.userTypeCode || '').toUpperCase());
      const userId = (isParkAdmin && req.query.userId) ? parseInt(req.query.userId, 10) : (req.actor?.userId || req.user?.id || 1);
      const count = await notificationService.getUnreadCount(userId);
      return sendSuccess(res, { unreadCount: count });
    } catch (err) {
      next(err);
    }
  },

  async notifyEvent(req, res, next) {
    try {
      const { eventCode, contextData } = req.body;
      const actorUserId = req.actor?.userId || req.user?.id || 1;
      const data = await notificationService.notifyEvent(eventCode, contextData, actorUserId);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async dispatchNotification(req, res, next) {
    try {
      const { typeCode, recipientUserIds, contextData } = req.body;
      const data = await notificationService.dispatchNotification(typeCode, recipientUserIds, contextData);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const userId = req.actor?.userId || req.user?.id || null;
      const data = await notificationService.markAsRead(req.params.id, userId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req, res, next) {
    try {
      const userId = req.actor?.userId || req.user?.id || req.body.userId || 1;
      const data = await notificationService.markAllRead(userId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /* ── Preferences ── */
  async getUserPreferences(req, res, next) {
    try {
      const userId = req.actor?.userId || req.user?.id || req.query.userId || 1;
      const data = await notificationService.getUserPreferences(userId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async updateUserPreferences(req, res, next) {
    try {
      const userId = req.actor?.userId || req.user?.id || 1;
      const data = await notificationService.updateUserPreferences(userId, req.body.preferences || req.body);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /* ── Delivery Logs & Admin Operations ── */
  async getDeliveryLog(req, res, next) {
    try {
      const data = await notificationService.getDeliveryLog({
        channelCode: req.query.channelCode,
        limit: req.query.limit,
        offset: req.query.offset
      });
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getTemplates(req, res, next) {
    try {
      const data = await notificationService.getTemplates();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async createTemplate(req, res, next) {
    try {
      const data = await notificationService.createTemplate(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateTemplate(req, res, next) {
    try {
      const data = await notificationService.updateTemplate(req.params.id, req.body);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getNotificationTypes(req, res, next) {
    try {
      const data = await notificationService.getNotificationTypes();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getNotificationChannels(req, res, next) {
    try {
      const data = await notificationService.getNotificationChannels();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getReminders(req, res, next) {
    try {
      const data = await notificationService.getReminders({ status: req.query.status });
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async createReminder(req, res, next) {
    try {
      const data = await notificationService.createReminder(req.body);
      return sendSuccess(res, data, 201);
    } catch (err) {
      next(err);
    }
  },

  async completeReminder(req, res, next) {
    try {
      const data = await notificationService.completeReminder(req.params.id);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async sendTestEmail(req, res, next) {
    try {
      const data = await notificationService.sendTestEmail(req.body.toEmail);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
};

export default notificationController;

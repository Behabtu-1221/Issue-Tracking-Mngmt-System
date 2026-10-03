import notificationRepository from '../repositories/notification.repository.js';
import authorizedRecipientService from './authorized-recipient.service.js';
import emailService from './email.service.js';
import { query } from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';

let isWorkerRunning = false;

export const notificationService = {
  async getOverviewMetrics() {
    return await notificationRepository.getOverviewMetrics();
  },

  /**
   * Primary centralized event trigger.
   * Business modules emit notification events here.
   * Recipient determination, multi-tenant isolation, template rendering,
   * in-app fan-out, and async email delivery are completely handled here.
   *
   * @param {string} eventCode - Business event type code (e.g. 'ISSUE_CREATED', 'APPROVAL_REQUIRED', etc.)
   * @param {Object} contextData - Context payload (e.g. { requestId, issue, approval, ... })
   * @param {number} actorUserId - User triggering the event
   */
  async notifyEvent(eventCode, contextData = {}, actorUserId = null) {
    if (!eventCode) {
      throw new AppError('Event code is required to trigger notification', 400);
    }

    try {
      // 1. Resolve NotificationType
      const types = await notificationRepository.getNotificationTypes();
      let notifType = types.find(t => t.TypeCode === eventCode);
      if (!notifType) {
        // Fallback mapping for common aliases
        if (eventCode === 'REQUEST_SUBMITTED') notifType = types.find(t => t.TypeCode === 'ISSUE_CREATED');
        else if (eventCode === 'DEPARTMENT_REJECTED') notifType = types.find(t => t.TypeCode === 'APPROVAL_REJECTED');
      }

      if (!notifType) {
        console.warn(`[Notification] Unknown NotificationType code '${eventCode}'. Skipping.`);
        return { success: false, reason: `Unknown type '${eventCode}'` };
      }

      // 2. Authoritative Recipient Resolution with Strict Multi-Tenant Isolation
      const recipients = await authorizedRecipientService.resolveRecipients(eventCode, contextData, actorUserId);
      if (!recipients || recipients.length === 0) {
        console.log(`[Notification] No authorized recipients determined for event '${eventCode}'.`);
        return { success: true, notificationId: null, recipientsCount: 0 };
      }

      // 3. Resolve context details for templates
      let issue = contextData.issue || null;
      const reqId = contextData.requestId || contextData.IssueRequestID || issue?.IssueRequestID;
      if (!issue && reqId) {
        const [foundIssue] = await query(
          `SELECT ir.*, d.DepartmentName, t.CompanyName AS TenantName
           FROM IssueRequest ir
           LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
           LEFT JOIN Tenant t ON ir.TenantID = t.TenantID
           WHERE ir.IssueRequestID = ? AND ir.IsDeleted = 0`,
          [reqId]
        );
        issue = foundIssue || null;
      }

      let requestNumber = contextData.requestNumber || issue?.RequestNumber || '';
      let issueTitle = contextData.title || issue?.Title || '';
      let deptName = contextData.departmentName || issue?.DepartmentName || 'Department';

      // 4. Fetch Templates for IN_APP and EMAIL
      const inAppTemplate = await notificationRepository.getTemplateByTypeAndChannel(notifType.NotificationTypeID, 'IN_APP');
      const emailTemplate = await notificationRepository.getTemplateByTypeAndChannel(notifType.NotificationTypeID, 'EMAIL');

      const templateContext = {
        requestNumber,
        title: issueTitle,
        departmentName: deptName,
        priority: contextData.priority || issue?.PriorityCode || 'MEDIUM',
        status: contextData.status || issue?.StatusCode || 'OPEN',
        remarks: contextData.remarks || contextData.comments || '',
        approvalReasons: contextData.reasons ? (Array.isArray(contextData.reasons) ? contextData.reasons.join(', ') : contextData.reasons) : '',
        estimatedCost: contextData.estimatedCost ? Number(contextData.estimatedCost).toLocaleString() : '',
        assigneeName: contextData.assigneeName || '',
        newAssigneeName: contextData.newAssigneeName || contextData.assigneeName || '',
        location: contextData.location || 'Campus Facility',
        targetResolution: contextData.targetResolution || 'Standard SLA',
        breachType: contextData.breachType || 'Resolution Target',
        deadline: contextData.deadline || 'Approaching Deadline',
        commentAuthor: contextData.commentAuthor || 'System',
        commentText: contextData.commentText || '',
        commentSnippet: (contextData.commentText || '').slice(0, 80),
        message: contextData.message || ''
      };

      // Format master title & text
      const defaultTitle = `${notifType.TypeName}${requestNumber ? `: ${requestNumber}` : ''}`;
      let masterMessage = inAppTemplate?.TemplateBody
        ? emailService.renderTemplate(inAppTemplate.TemplateBody, templateContext)
        : (contextData.message || `Update regarding ${requestNumber || eventCode}`);

      // 5. Create Master Notification Record
      const triggeredTable = contextData.TriggeredByTable || (requestNumber ? 'IssueRequest' : null);
      const triggeredId = contextData.TriggeredByID || contextData.requestId || contextData.issue?.IssueRequestID || null;

      const notificationId = await notificationRepository.createNotification({
        NotificationTypeID: notifType.NotificationTypeID,
        Title: defaultTitle,
        MessageText: masterMessage,
        TriggeredByTable: triggeredTable,
        TriggeredByID: triggeredId,
        CreatedBy: actorUserId || 1
      });

      // 6. Fan-Out to Authorized Recipients based on Preferences
      let inAppDeliveredCount = 0;
      let emailQueuedCount = 0;

      for (const recipient of recipients) {
        const uid = recipient.userId;
        const userTemplateContext = { ...templateContext, recipientName: recipient.fullName };

        // Channel A: IN_APP
        const inAppAllowed = await notificationRepository.checkUserChannelPreference(uid, notifType.NotificationTypeID, 'IN_APP');
        if (inAppAllowed) {
          await notificationRepository.createUserNotification({
            NotificationID: notificationId,
            UserID: uid,
            ChannelCode: 'IN_APP',
            CreatedBy: actorUserId || 1
          });

          await notificationRepository.createNotificationRecipient({
            NotificationID: notificationId,
            RecipientUserID: uid,
            NotificationChannelID: 1, // IN_APP
            DeliveryStatusCode: 'DELIVERED',
            CreatedBy: actorUserId || 1
          });

          await notificationRepository.logDelivery({
            NotificationID: notificationId,
            UserID: uid,
            ChannelCode: 'IN_APP',
            DeliveryStatus: 'DELIVERED',
            RecipientAddress: `user:${uid}`
          });
          inAppDeliveredCount++;
        }

        // Channel B: EMAIL
        if (recipient.email) {
          const emailAllowed = await notificationRepository.checkUserChannelPreference(uid, notifType.NotificationTypeID, 'EMAIL');
          if (emailAllowed) {
            const recipientId = await notificationRepository.createNotificationRecipient({
              NotificationID: notificationId,
              RecipientUserID: uid,
              NotificationChannelID: 2, // EMAIL
              DeliveryStatusCode: 'PENDING',
              CreatedBy: actorUserId || 1
            });

            await notificationRepository.queueEmailJob({
              notificationRecipientId: recipientId,
              retryCount: 0
            });

            await notificationRepository.logDelivery({
              NotificationID: notificationId,
              UserID: uid,
              ChannelCode: 'EMAIL',
              DeliveryStatus: 'PENDING',
              RecipientAddress: recipient.email
            });
            emailQueuedCount++;
          }
        }
      }

      console.log(`[Notification] Event '${eventCode}' dispatched. In-App: ${inAppDeliveredCount}, Email Queued: ${emailQueuedCount}`);

      // 7. Trigger Asynchronous Background Email Delivery (non-blocking)
      if (emailQueuedCount > 0) {
        setImmediate(() => {
          this._processEmailQueue().catch(err => console.error('[Notification Worker Error]:', err.message));
        });
      }

      return {
        success: true,
        notificationId,
        recipientsCount: recipients.length,
        inAppCount: inAppDeliveredCount,
        emailQueuedCount
      };
    } catch (err) {
      console.error(`[Notification] Error executing notifyEvent for '${eventCode}':`, err);
      // Non-blocking safety: business transaction continues even if notification logging has an edge case
      return { success: false, error: err.message };
    }
  },

  /**
   * Backward-compatible direct dispatch method.
   */
  async dispatchNotification(typeCode, recipientUserIds = [], contextData = {}) {
    return this.notifyEvent(typeCode, {
      ...contextData,
      recipientUserIds: Array.isArray(recipientUserIds) ? recipientUserIds : [recipientUserIds]
    }, contextData.senderUserId || 1);
  },

  /**
   * Asynchronous Background Email Queue Worker.
   * Processes pending email delivery jobs from NotificationQueue with retries and logging.
   */
  async _processEmailQueue() {
    if (isWorkerRunning) return;
    isWorkerRunning = true;

    try {
      const jobs = await notificationRepository.getPendingQueueJobs(25);
      if (!jobs || jobs.length === 0) {
        isWorkerRunning = false;
        return;
      }

      for (const job of jobs) {
        try {
          await notificationRepository.updateQueueJob(job.NotificationQueueID, {
            status: 'PROCESSING',
            retryCount: job.RetryCount
          });

          // Fetch Email template
          const template = await notificationRepository.getTemplateByTypeAndChannel(job.NotificationTypeID, 'EMAIL');

          const contextMap = {
            recipientName: job.FullName || 'Valued User',
            requestNumber: job.Title?.match(/REQ-[0-9-]+/) ? job.Title.match(/REQ-[0-9-]+/)[0] : '',
            title: job.Title || '',
            message: job.MessageText || '',
            status: 'UPDATED',
            priority: 'MEDIUM',
            departmentName: 'Facilities & IT'
          };

          const rawSubject = template?.TemplateSubject || job.Title || 'ITMS Notification';
          const rawBody = template?.TemplateBody || `<p>${job.MessageText}</p>`;

          const renderedSubject = emailService.renderTemplate(rawSubject, contextMap);
          const renderedBody = emailService.renderTemplate(rawBody, contextMap);
          const htmlContent = emailService.wrapInHtmlEmail(renderedSubject, renderedBody);

          const emailRes = await emailService.sendEmail({
            to: job.Email,
            subject: renderedSubject,
            html: htmlContent,
            text: job.MessageText
          });

          if (emailRes.success) {
            await notificationRepository.updateQueueJob(job.NotificationQueueID, {
              status: 'COMPLETED',
              retryCount: job.RetryCount
            });

            await notificationRepository.logDelivery({
              NotificationID: job.NotificationID,
              UserID: job.RecipientUserID,
              ChannelCode: 'EMAIL',
              DeliveryStatus: 'DELIVERED',
              RecipientAddress: job.Email
            });
          } else {
            const nextRetry = job.RetryCount + 1;
            const newStatus = nextRetry >= 3 ? 'FAILED' : 'RETRY';

            await notificationRepository.updateQueueJob(job.NotificationQueueID, {
              status: newStatus,
              retryCount: nextRetry,
              errorMessage: emailRes.error || 'Delivery failed'
            });

            await notificationRepository.logDelivery({
              NotificationID: job.NotificationID,
              UserID: job.RecipientUserID,
              ChannelCode: 'EMAIL',
              DeliveryStatus: newStatus,
              RecipientAddress: job.Email,
              ErrorMessage: emailRes.error || 'Delivery failed'
            });
          }
        } catch (jobErr) {
          console.error(`[Queue Job ${job.NotificationQueueID} Error]:`, jobErr.message);
          await notificationRepository.updateQueueJob(job.NotificationQueueID, {
            status: job.RetryCount >= 2 ? 'FAILED' : 'RETRY',
            retryCount: job.RetryCount + 1,
            errorMessage: jobErr.message
          });
        }
      }
    } finally {
      isWorkerRunning = false;
    }
  },

  /* ── User In-App Inbox API Operations ── */
  async getUserNotifications(userId, filters = {}) {
    return await notificationRepository.getUserNotifications(userId, filters);
  },

  async getUnreadCount(userId) {
    return await notificationRepository.getUnreadCount(userId);
  },

  async markAsRead(userNotificationId, userId) {
    if (!userNotificationId) {
      throw new AppError('UserNotificationID is required', 400);
    }
    const updated = await notificationRepository.markAsRead(userNotificationId, userId);
    return { userNotificationId, read: updated };
  },

  async markAllRead(userId) {
    await notificationRepository.markAllRead(userId);
    return { userId, allRead: true };
  },

  /* ── Notification Preferences Operations ── */
  async getUserPreferences(userId) {
    return await notificationRepository.getUserPreferences(userId);
  },

  async updateUserPreferences(userId, preferencesList = []) {
    if (!Array.isArray(preferencesList)) {
      throw new AppError('Preferences must be an array of settings', 400);
    }

    const types = await notificationRepository.getNotificationTypes();
    const channels = await notificationRepository.getNotificationChannels();

    for (const item of preferencesList) {
      let typeId = item.NotificationTypeID;
      if (!typeId && item.TypeCode) {
        const foundType = types.find(t => t.TypeCode === item.TypeCode);
        if (foundType) typeId = foundType.NotificationTypeID;
      }

      let channelId = item.NotificationChannelID;
      if (!channelId && item.ChannelCode) {
        const foundChannel = channels.find(c => c.ChannelCode === item.ChannelCode);
        if (foundChannel) channelId = foundChannel.NotificationChannelID;
      }

      if (typeId && channelId) {
        await notificationRepository.updateUserPreference(userId, typeId, channelId, item.IsEnabled !== false);
      }
    }

    return await this.getUserPreferences(userId);
  },

  /* ── Delivery Logs & Admin Operations ── */
  async getDeliveryLog(filters = {}) {
    return await notificationRepository.getDeliveryLog(filters);
  },

  async getTemplates() {
    return await notificationRepository.getTemplates();
  },

  async createTemplate(data) {
    if (!data.NotificationTypeID || !data.NotificationChannelID || !data.TemplateCode || !data.TemplateBody) {
      throw new AppError('NotificationTypeID, NotificationChannelID, TemplateCode, and TemplateBody are required', 400);
    }
    const id = await notificationRepository.createTemplate(data);
    const templates = await notificationRepository.getTemplates();
    return templates.find(t => t.NotificationTemplateID === id);
  },

  async updateTemplate(id, data) {
    if (!id) {
      throw new AppError('NotificationTemplateID is required', 400);
    }
    await notificationRepository.updateTemplate(id, data);
    const templates = await notificationRepository.getTemplates();
    return templates.find(t => t.NotificationTemplateID === Number(id));
  },

  async getNotificationTypes() {
    return await notificationRepository.getNotificationTypes();
  },

  async getNotificationChannels() {
    return await notificationRepository.getNotificationChannels();
  },

  async getReminders(filters = {}) {
    return await notificationRepository.getReminders(filters);
  },

  async createReminder(data) {
    if (!data.Title || !data.ReminderDateTime) {
      throw new AppError('Title and ReminderDateTime are required', 400);
    }
    const id = await notificationRepository.createReminder(data);
    const reminders = await notificationRepository.getReminders();
    return reminders.find(r => r.NotificationReminderID === id);
  },

  async completeReminder(id) {
    await notificationRepository.completeReminder(id);
    return { id, status: 'COMPLETED' };
  },

  async sendTestEmail(toEmail) {
    if (!toEmail) {
      throw new AppError('Recipient email address is required', 400);
    }
    const subject = 'Test Email from Enterprise Issue Tracking System';
    const bodyHtml = `
      <p>Hello!</p>
      <p>This is a <strong>test email</strong> sent from the Enterprise ITMS Notification Management Module.</p>
      <p>If you received this message, your SMTP email delivery configuration is working perfectly!</p>
    `;
    const fullHtml = emailService.wrapInHtmlEmail(subject, bodyHtml);

    return await emailService.sendEmail({
      to: toEmail,
      subject,
      html: fullHtml,
      text: 'Test Email from Enterprise Issue Tracking System. SMTP delivery is working!'
    });
  }
};

export default notificationService;

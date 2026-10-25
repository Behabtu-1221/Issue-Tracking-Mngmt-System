import { query } from '../../../database/connection.js';

export const notificationRepository = {
  async initTables() {
    await query(`
      CREATE TABLE IF NOT EXISTS UserNotification (
        UserNotificationID BIGINT AUTO_INCREMENT PRIMARY KEY,
        NotificationID BIGINT NOT NULL,
        UserID BIGINT NOT NULL,
        ChannelCode VARCHAR(30) NOT NULL DEFAULT 'IN_APP',
        CustomTitle VARCHAR(255) NULL,
        CustomMessage TEXT NULL,
        IsRead TINYINT NOT NULL DEFAULT 0,
        ReadDateTime DATETIME(6) NULL,
        IsActive TINYINT NOT NULL DEFAULT 1,
        IsDeleted TINYINT NOT NULL DEFAULT 0,
        CreatedBy BIGINT NOT NULL DEFAULT 1,
        CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_usernotif_user (UserID, IsRead, IsDeleted)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure CustomTitle & CustomMessage columns exist on existing UserNotification table
    const existingCols = await query(`SHOW COLUMNS FROM UserNotification`);
    const colNames = existingCols.map(c => c.Field);
    if (!colNames.includes('CustomTitle')) {
      await query(`ALTER TABLE UserNotification ADD COLUMN CustomTitle VARCHAR(255) NULL AFTER ChannelCode`);
    }
    if (!colNames.includes('CustomMessage')) {
      await query(`ALTER TABLE UserNotification ADD COLUMN CustomMessage TEXT NULL AFTER CustomTitle`);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS NotificationLog (
        NotificationLogID BIGINT AUTO_INCREMENT PRIMARY KEY,
        NotificationID BIGINT NOT NULL,
        UserID BIGINT NULL,
        ChannelCode VARCHAR(30) NOT NULL,
        DeliveryStatus VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        RecipientAddress VARCHAR(255) NULL,
        ErrorMessage TEXT NULL,
        SentDateTime DATETIME(6) NULL,
        CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_notiflog_channel (ChannelCode, DeliveryStatus)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS NotificationReminder (
        NotificationReminderID BIGINT AUTO_INCREMENT PRIMARY KEY,
        Title VARCHAR(255) NOT NULL,
        MessageText TEXT NULL,
        ReminderDateTime DATETIME(6) NOT NULL,
        LinkedIssueRequestID BIGINT NULL,
        AssignedToUserID BIGINT NULL,
        Status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        IsActive TINYINT NOT NULL DEFAULT 1,
        IsDeleted TINYINT NOT NULL DEFAULT 0,
        CreatedBy BIGINT NOT NULL DEFAULT 1,
        CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed Enterprise Notification Types
    const enterpriseTypes = [
      { code: 'ISSUE_CREATED', name: 'Ticket Submitted & Acknowledged' },
      { code: 'APPROVAL_REQUIRED', name: 'Department Review Required' },
      { code: 'HIGHER_APPROVAL_REQUIRED', name: 'Executive Administrator Review Required' },
      { code: 'DEPARTMENT_APPROVED', name: 'Department Approved & Forwarded' },
      { code: 'APPROVAL_COMPLETED', name: 'All Approvals Completed' },
      { code: 'ISSUE_APPROVED_FOR_DISPATCH', name: 'Ticket Approved for Dispatch' },
      { code: 'APPROVAL_REJECTED', name: 'Approval Request Declined' },
      { code: 'ISSUE_ASSIGNED', name: 'Work Order Assigned' },
      { code: 'ASSIGNMENT_REASSIGNED', name: 'Work Order Reassigned' },
      { code: 'REQUEST_STATUS_CHANGED', name: 'Ticket Status Updated' },
      { code: 'REQUEST_PROGRESS_UPDATED', name: 'Technician Progress & Milestone Update' },
      { code: 'SLA_WARNING', name: 'SLA Milestone Approaching' },
      { code: 'SLA_BREACH', name: 'SLA Threshold Breached' },
      { code: 'ISSUE_RESOLVED', name: 'Work Completed & Ready for Verification' },
      { code: 'REQUEST_CLOSED', name: 'Ticket Closed & Completed' },
      { code: 'REQUEST_CANCELLED', name: 'Ticket Cancelled' },
      { code: 'REQUEST_REOPENED', name: 'Ticket Reopened' },
      { code: 'NEW_COMMENT_ADDED', name: 'New Activity & Comment' },
      { code: 'PARTS_REQUIRED', name: 'Materials / Spare Parts Requested' },
      { code: 'MAINTENANCE_SCHEDULED', name: 'Scheduled Maintenance Advisory' }
    ];

    for (const t of enterpriseTypes) {
      await query(
        `INSERT INTO NotificationType (TypeCode, TypeName, IsActive, IsDeleted, CreatedBy)
         SELECT ?, ?, 1, 0, 1
         WHERE NOT EXISTS (SELECT 1 FROM NotificationType WHERE TypeCode = ? AND IsDeleted = 0)`,
        [t.code, t.name, t.code]
      );
    }

    // Seed Enterprise Notification Templates (for both IN_APP and EMAIL channels)
    const existingChannels = await query(`SELECT NotificationChannelID, ChannelCode FROM NotificationChannel WHERE IsDeleted = 0`);
    const inAppChannel = existingChannels.find(c => c.ChannelCode === 'IN_APP');
    const emailChannel = existingChannels.find(c => c.ChannelCode === 'EMAIL');
    const dbTypes = await query(`SELECT NotificationTypeID, TypeCode FROM NotificationType WHERE IsDeleted = 0`);
    const typeMap = new Map(dbTypes.map(t => [t.TypeCode, t.NotificationTypeID]));

    const defaultTemplates = [
      {
        typeCode: 'ISSUE_CREATED',
        inApp: 'Ticket #{{requestNumber}} ("{{title}}") has been logged and routed to {{departmentName}}. Priority: {{priority}}.',
        emailSubject: '[ITMS {{priority}}] Ticket Received: #{{requestNumber}} - {{title}}',
        emailBody: '<p>Dear {{recipientName}},</p><p>Your service request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>) has been recorded successfully and routed to the <strong>{{departmentName}}</strong> department.</p><p><strong>Priority:</strong> {{priority}}<br><strong>Location:</strong> {{location}}<br><strong>Target Resolution:</strong> {{targetResolution}}</p><p>You will receive automated status notifications as our team reviews and progresses your request.</p>'
      },
      {
        typeCode: 'APPROVAL_REQUIRED',
        inApp: 'Action Required: Request #{{requestNumber}} ("{{title}}") requires department management review.',
        emailSubject: '[Action Required] Department Review: Request #{{requestNumber}}',
        emailBody: '<p>Dear {{recipientName}},</p><p>A new request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>) has been submitted and requires your department managerial review.</p><p><strong>Department:</strong> {{departmentName}}<br><strong>Priority:</strong> {{priority}}<br><strong>Estimated Cost:</strong> {{estimatedCost}}</p><p>Please log in to your ITMS Approvals Dashboard to review and take action.</p>'
      },
      {
        typeCode: 'HIGHER_APPROVAL_REQUIRED',
        inApp: 'Executive Review: Request #{{requestNumber}} ("{{title}}") escalated for Business Park Administrator approval.',
        emailSubject: '[Executive Review] Administrator Authorization Required: Request #{{requestNumber}}',
        emailBody: '<p>Dear {{recipientName}},</p><p>Request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>) has passed department review and requires higher-level Executive Park Administrator authorization.</p><p><strong>Department:</strong> {{departmentName}}<br><strong>Priority:</strong> {{priority}}<br><strong>Escalation Reason:</strong> {{approvalReasons}}</p><p>Please access the executive approvals portal to approve or decline.</p>'
      },
      {
        typeCode: 'DEPARTMENT_APPROVED',
        inApp: 'Progress Update: Request #{{requestNumber}} approved by department management and forwarded for final review.',
        emailSubject: '[Update] Department Approved: Request #{{requestNumber}}',
        emailBody: '<p>Dear {{recipientName}},</p><p>Request <strong>#{{requestNumber}}</strong> has received stage 1 approval from {{departmentName}} management and has been forwarded for executive confirmation.</p>'
      },
      {
        typeCode: 'APPROVAL_COMPLETED',
        inApp: 'Request #{{requestNumber}} ("{{title}}") is fully approved and authorized for execution.',
        emailSubject: '[Authorized] Full Approval Granted: Request #{{requestNumber}}',
        emailBody: '<p>Dear {{recipientName}},</p><p>All necessary approvals for request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>) have been completed. The request is now cleared for operational execution and dispatch.</p>'
      },
      {
        typeCode: 'ISSUE_APPROVED_FOR_DISPATCH',
        inApp: 'Ready for Dispatch: Approved Request #{{requestNumber}} is queued for technician assignment in {{departmentName}}.',
        emailSubject: '[Dispatch Queue] Approved Ticket Ready: #{{requestNumber}}',
        emailBody: '<p>Dear {{recipientName}},</p><p>Authorized request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>) is now in the dispatch queue for <strong>{{departmentName}}</strong>.</p><p><strong>Priority:</strong> {{priority}}<br><strong>Target Resolution:</strong> {{targetResolution}}</p><p>Please assign an individual technician or service team to begin work.</p>'
      },
      {
        typeCode: 'APPROVAL_REJECTED',
        inApp: 'Notice: Request #{{requestNumber}} ("{{title}}") was not approved. Remarks: {{remarks}}',
        emailSubject: '[Notice] Request #{{requestNumber}} Review Update',
        emailBody: '<p>Dear {{recipientName}},</p><p>Your request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>) was reviewed by management and could not be approved at this time.</p><p><strong>Review Remarks:</strong> {{remarks}}</p><p>Please consult with your supervisor or tenant representative if additional clarification is needed.</p>'
      },
      {
        typeCode: 'ISSUE_ASSIGNED',
        inApp: 'Work Order #{{requestNumber}} ("{{title}}") has been assigned to you. Location: {{location}}.',
        emailSubject: '[Work Order] Assignment: #{{requestNumber}} - {{title}}',
        emailBody: '<p>Dear {{recipientName}},</p><p>You have been assigned to service request <strong>#{{requestNumber}}</strong>: <em>{{title}}</em>.</p><p><strong>Location:</strong> {{location}}<br><strong>Priority:</strong> {{priority}}<br><strong>Target Resolution:</strong> {{targetResolution}}</p><p>Please acknowledge and begin dispatch execution through the ITMS Work Orders module.</p>'
      },
      {
        typeCode: 'ASSIGNMENT_REASSIGNED',
        inApp: 'Assignment Transferred: Work Order #{{requestNumber}} reassigned to {{newAssigneeName}}.',
        emailSubject: '[Assignment Update] Ticket #{{requestNumber}} Reassigned',
        emailBody: '<p>Dear {{recipientName}},</p><p>Work order for request <strong>#{{requestNumber}}</strong> has been reassigned to <strong>{{newAssigneeName}}</strong>.</p><p>Remarks: {{remarks}}</p>'
      },
      {
        typeCode: 'REQUEST_STATUS_CHANGED',
        inApp: 'Status Update: Request #{{requestNumber}} transitioned to status {{status}}.',
        emailSubject: '[Status Update] Request #{{requestNumber}} is now {{status}}',
        emailBody: '<p>Dear {{recipientName}},</p><p>The status of request <strong>#{{requestNumber}}</strong> has transitioned to <strong>{{status}}</strong>.</p><p>Remarks: {{remarks}}</p>'
      },
      {
        typeCode: 'REQUEST_PROGRESS_UPDATED',
        inApp: 'Progress Update on #{{requestNumber}}: {{progressPercentage}}% ({{progressMilestone}}). {{remarks}}',
        emailSubject: '[Progress {{progressPercentage}}%] Field Update on Request #{{requestNumber}}',
        emailBody: '<p>Dear {{recipientName}},</p><p>Technician <strong>{{technicianName}}</strong> updated progress on ticket <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>).</p><p><strong>Progress:</strong> {{progressPercentage}}% ({{progressMilestone}})<br><strong>Status:</strong> {{status}}<br><strong>Work Log / Notes:</strong> {{remarks}}</p><p>You can follow the live resolution timeline in your ITMS dashboard.</p>'
      },
      {
        typeCode: 'SLA_WARNING',
        inApp: 'SLA Warning: Request #{{requestNumber}} is approaching its service target deadline ({{deadline}}).',
        emailSubject: '[SLA Warning] Approaching Deadline on Ticket #{{requestNumber}}',
        emailBody: '<p>Dear {{recipientName}},</p><p><strong style="color:#d97706">SLA Alert:</strong> Request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>) is within 15% of its service level milestone deadline (<strong>{{deadline}}</strong>).</p><p>Please expedite resolution to avoid an SLA breach.</p>'
      },
      {
        typeCode: 'SLA_BREACH',
        inApp: 'CRITICAL SLA BREACH: Request #{{requestNumber}} has exceeded resolution SLA threshold.',
        emailSubject: '[CRITICAL SLA BREACH] Escalation on Ticket #{{requestNumber}}',
        emailBody: '<p>Dear {{recipientName}},</p><p><strong style="color:#dc2626;font-size:16px">CRITICAL SLA BREACH ESCALATION:</strong></p><p>Request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>) has exceeded its SLA threshold for <strong>{{breachType}}</strong>.</p><p><strong>Department:</strong> {{departmentName}}<br><strong>Priority:</strong> {{priority}}</p><p>Immediate supervisory intervention is required.</p>'
      },
      {
        typeCode: 'ISSUE_RESOLVED',
        inApp: 'Work Completed: Ticket #{{requestNumber}} marked RESOLVED by technician. Please inspect and confirm.',
        emailSubject: '[Action: Verification] Request #{{requestNumber}} Marked as Resolved',
        emailBody: '<p>Dear {{recipientName}},</p><p>The assigned technician has resolved request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>).</p><p><strong>Resolution Remarks:</strong> {{remarks}}</p><p>Please inspect the resolution and confirm closure via the portal, or reopen if further attention is required.</p>'
      },
      {
        typeCode: 'REQUEST_CLOSED',
        inApp: 'Ticket #{{requestNumber}} has been verified and closed. Thank you.',
        emailSubject: '[Closed] Ticket #{{requestNumber}} Completed',
        emailBody: '<p>Dear {{recipientName}},</p><p>Request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>) has been verified and officially closed.</p><p>Thank you for using the Enterprise ITMS portal.</p>'
      },
      {
        typeCode: 'REQUEST_CANCELLED',
        inApp: 'Ticket #{{requestNumber}} was cancelled. Reason: {{remarks}}',
        emailSubject: '[Cancelled] Ticket #{{requestNumber}}',
        emailBody: '<p>Dear {{recipientName}},</p><p>Request <strong>#{{requestNumber}}</strong> was cancelled.</p><p><strong>Reason:</strong> {{remarks}}</p>'
      },
      {
        typeCode: 'REQUEST_REOPENED',
        inApp: 'Reopened: Ticket #{{requestNumber}} has been reopened. Remarks: {{remarks}}',
        emailSubject: '[Reopened] Ticket #{{requestNumber}} Reopened for Service',
        emailBody: '<p>Dear {{recipientName}},</p><p>Request <strong>#{{requestNumber}}</strong> (<em>{{title}}</em>) has been reopened for additional attention.</p><p><strong>Remarks:</strong> {{remarks}}</p>'
      },
      {
        typeCode: 'NEW_COMMENT_ADDED',
        inApp: 'New Note on #{{requestNumber}} by {{commentAuthor}}: {{commentSnippet}}',
        emailSubject: '[New Note] Activity on Ticket #{{requestNumber}}',
        emailBody: '<p>Dear {{recipientName}},</p><p><strong>{{commentAuthor}}</strong> added a note to request <strong>#{{requestNumber}}</strong>:</p><blockquote style="border-left:3px solid #6366f1;padding-left:12px;margin:8px 0;color:#475569">{{commentText}}</blockquote>'
      }
    ];

    if (inAppChannel && emailChannel) {
      for (const tpl of defaultTemplates) {
        const typeId = typeMap.get(tpl.typeCode);
        if (!typeId) continue;

        // In-App Template
        if (tpl.inApp) {
          await query(
            `INSERT INTO NotificationTemplate (NotificationTypeID, NotificationChannelID, TemplateCode, TemplateBody, CreatedBy)
             SELECT ?, ?, ?, ?, 1
             WHERE NOT EXISTS (
               SELECT 1 FROM NotificationTemplate 
               WHERE NotificationTypeID = ? AND NotificationChannelID = ? AND IsDeleted = 0
             )`,
            [typeId, inAppChannel.NotificationChannelID, `${tpl.typeCode}_INAPP`, tpl.inApp, typeId, inAppChannel.NotificationChannelID]
          );
        }

        // Email Template
        if (tpl.emailSubject && tpl.emailBody) {
          await query(
            `INSERT INTO NotificationTemplate (NotificationTypeID, NotificationChannelID, TemplateCode, TemplateSubject, TemplateBody, CreatedBy)
             SELECT ?, ?, ?, ?, ?, 1
             WHERE NOT EXISTS (
               SELECT 1 FROM NotificationTemplate 
               WHERE NotificationTypeID = ? AND NotificationChannelID = ? AND IsDeleted = 0
             )`,
            [typeId, emailChannel.NotificationChannelID, `${tpl.typeCode}_EMAIL`, tpl.emailSubject, tpl.emailBody, typeId, emailChannel.NotificationChannelID]
          );
        }
      }
    }
  },

  /* ── Overview Metrics ── */
  async getOverviewMetrics() {
    await this.initTables();
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM Notification WHERE IsDeleted = 0) AS totalSent,
        (SELECT COUNT(*) FROM UserNotification WHERE IsRead = 0 AND IsDeleted = 0) AS unreadInApp,
        (SELECT COUNT(*) FROM NotificationLog WHERE ChannelCode = 'EMAIL' AND DeliveryStatus = 'DELIVERED') AS emailsDelivered,
        (SELECT COUNT(*) FROM NotificationReminder WHERE Status = 'PENDING' AND IsDeleted = 0) AS pendingReminders
    `;
    const rows = await query(sql);
    return rows[0] || { totalSent: 0, unreadInApp: 0, emailsDelivered: 0, pendingReminders: 0 };
  },

  /* ── Master Notification ── */
  async createNotification(data) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
      INSERT INTO Notification (NotificationTypeID, Title, MessageText, TriggeredByTable, TriggeredByID, CreatedBy, CreatedDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const res = await query(sql, [
      data.NotificationTypeID,
      data.Title,
      data.MessageText,
      data.TriggeredByTable || null,
      data.TriggeredByID || null,
      data.CreatedBy || 1,
      now
    ]);
    return res.insertId;
  },

  /* ── Notification Recipient ── */
  async createNotificationRecipient(data) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
      INSERT INTO NotificationRecipient (
        NotificationID, RecipientUserID, NotificationChannelID, SentDateTime, DeliveryStatusCode, CreatedBy, CreatedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE DeliveryStatusCode = VALUES(DeliveryStatusCode), ModifiedDate = NOW()
    `;
    const res = await query(sql, [
      data.NotificationID,
      data.RecipientUserID,
      data.NotificationChannelID,
      data.SentDateTime || now,
      data.DeliveryStatusCode || 'PENDING',
      data.CreatedBy || 1,
      now
    ]);
    return res.insertId;
  },

  /* ── User In-App Inbox ── */
  async createUserNotification(data) {
    await this.initTables();
    const sql = `
      INSERT INTO UserNotification (NotificationID, UserID, ChannelCode, CustomTitle, CustomMessage, CreatedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const res = await query(sql, [
      data.NotificationID,
      data.UserID,
      data.ChannelCode || 'IN_APP',
      data.CustomTitle || null,
      data.CustomMessage || null,
      data.CreatedBy || 1
    ]);
    return res.insertId;
  },

  async getUserNotifications(userId, { unreadOnly = false, limit = 50, offset = 0 } = {}) {
    await this.initTables();
    let sql = `
      SELECT un.UserNotificationID, un.NotificationID, un.UserID, un.ChannelCode, un.IsRead, un.ReadDateTime, un.CreatedDate,
        COALESCE(un.CustomTitle, n.Title) AS Title,
        COALESCE(un.CustomMessage, n.MessageText) AS MessageText,
        n.TriggeredByTable, n.TriggeredByID, n.CreatedDate AS NotificationDate,
        nt.TypeCode, nt.TypeName,
        ir.IssueRequestID, ir.RequestNumber, ir.PriorityCode, ir.StatusCode, ir.CategoryCode,
        ir.Title AS IssueTitle, ir.Description AS IssueDescription, ir.TargetResolutionDateTime,
        d.DepartmentName, t.CompanyName AS TenantName,
        b.BuildingName
      FROM UserNotification un
      JOIN Notification n ON un.NotificationID = n.NotificationID
      LEFT JOIN NotificationType nt ON n.NotificationTypeID = nt.NotificationTypeID
      LEFT JOIN IssueRequest ir ON (n.TriggeredByTable = 'IssueRequest' AND n.TriggeredByID = ir.IssueRequestID)
      LEFT JOIN Department d ON ir.AssignedDepartmentID = d.DepartmentID
      LEFT JOIN Tenant t ON ir.TenantID = t.TenantID
      LEFT JOIN Building b ON ir.BuildingID = b.BuildingID
      WHERE un.UserID = ? AND un.IsDeleted = 0
    `;
    const params = [Number(userId)];
    if (unreadOnly) {
      sql += ` AND un.IsRead = 0`;
    }
    sql += ` ORDER BY un.CreatedDate DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
    return await query(sql, params);
  },

  async getUnreadCount(userId) {
    await this.initTables();
    const rows = await query(
      `SELECT COUNT(*) AS unreadCount
       FROM UserNotification
       WHERE UserID = ? AND IsRead = 0 AND IsDeleted = 0`,
      [Number(userId)]
    );
    return Number(rows[0]?.unreadCount || 0);
  },

  async markAsRead(userNotificationId, userId = null) {
    await this.initTables();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let sql = `UPDATE UserNotification SET IsRead = 1, ReadDateTime = ? WHERE UserNotificationID = ?`;
    const params = [now, userNotificationId];
    if (userId) {
      sql += ` AND UserID = ?`;
      params.push(Number(userId));
    }
    const res = await query(sql, params);
    return res.affectedRows > 0;
  },

  async markAsUnread(userNotificationId, userId = null) {
    await this.initTables();
    let sql = `UPDATE UserNotification SET IsRead = 0, ReadDateTime = NULL WHERE UserNotificationID = ?`;
    const params = [userNotificationId];
    if (userId) {
      sql += ` AND UserID = ?`;
      params.push(Number(userId));
    }
    const res = await query(sql, params);
    return res.affectedRows > 0;
  },

  async markAllRead(userId) {
    await this.initTables();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await query(`UPDATE UserNotification SET IsRead = 1, ReadDateTime = ? WHERE UserID = ? AND IsRead = 0`, [now, Number(userId)]);
  },

  /* ── Delivery Queue & Logs ── */
  async queueEmailJob({ notificationRecipientId, scheduledDateTime = null, retryCount = 0 }) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sched = scheduledDateTime || now;
    const sql = `
      INSERT INTO NotificationQueue (NotificationRecipientID, RetryCount, ScheduledDateTime, Status, CreatedBy, CreatedDate)
      VALUES (?, ?, ?, 'PENDING', 1, ?)
    `;
    const res = await query(sql, [notificationRecipientId, retryCount, sched, now]);
    return res.insertId;
  },

  async getPendingQueueJobs(limit = 20) {
    const sql = `
      SELECT nq.NotificationQueueID, nq.NotificationRecipientID, nq.RetryCount, nq.Status,
             nr.NotificationID, nr.RecipientUserID, nr.NotificationChannelID,
             n.Title, n.MessageText, n.TriggeredByTable, n.TriggeredByID,
             nt.NotificationTypeID, nt.TypeCode, nt.TypeName,
             u.Email, CONCAT(u.FirstName, ' ', u.LastName) AS FullName, u.TenantID
      FROM NotificationQueue nq
      JOIN NotificationRecipient nr ON nq.NotificationRecipientID = nr.NotificationRecipientID
      JOIN Notification n ON nr.NotificationID = n.NotificationID
      JOIN NotificationType nt ON n.NotificationTypeID = nt.NotificationTypeID
      JOIN \`User\` u ON nr.RecipientUserID = u.UserID
      WHERE nq.Status IN ('PENDING', 'RETRY') AND nq.IsDeleted = 0
      ORDER BY nq.NotificationQueueID ASC
      LIMIT ?
    `;
    return await query(sql, [limit]);
  },

  async updateQueueJob(queueId, { status, retryCount, errorMessage = null }) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let sql = `UPDATE NotificationQueue SET Status = ?, RetryCount = ?, ModifiedDate = ? WHERE NotificationQueueID = ?`;
    await query(sql, [status, retryCount, now, queueId]);
  },

  async logDelivery(data) {
    await this.initTables();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
      INSERT INTO NotificationLog (NotificationID, UserID, ChannelCode, DeliveryStatus, RecipientAddress, ErrorMessage, SentDateTime)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
      data.NotificationID,
      data.UserID || null,
      data.ChannelCode,
      data.DeliveryStatus,
      data.RecipientAddress || null,
      data.ErrorMessage || null,
      now
    ]);
  },

  async getDeliveryLog({ channelCode, limit = 50, offset = 0 } = {}) {
    await this.initTables();
    let sql = `
      SELECT nl.*, n.Title, n.MessageText,
        CONCAT(u.FirstName, ' ', u.LastName) AS RecipientName
      FROM NotificationLog nl
      LEFT JOIN Notification n ON nl.NotificationID = n.NotificationID
      LEFT JOIN \`User\` u ON nl.UserID = u.UserID
      WHERE 1=1
    `;
    const params = [];
    if (channelCode) {
      sql += ` AND nl.ChannelCode = ?`;
      params.push(channelCode);
    }
    sql += ` ORDER BY nl.CreatedDate DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
    return await query(sql, params);
  },

  /* ── User Notification Preferences ── */
  async getUserPreferences(userId) {
    const sql = `
      SELECT nt.NotificationTypeID, nt.TypeCode, nt.TypeName,
             nc.NotificationChannelID, nc.ChannelCode, nc.ChannelName,
             COALESCE(np.IsEnabled, 1) AS IsEnabled
      FROM NotificationType nt
      CROSS JOIN NotificationChannel nc
      LEFT JOIN NotificationPreference np 
        ON np.NotificationTypeID = nt.NotificationTypeID 
       AND np.NotificationChannelID = nc.NotificationChannelID 
       AND np.UserID = ? AND np.IsDeleted = 0
      WHERE nt.IsDeleted = 0 AND nc.IsDeleted = 0 AND nc.IsActive = 1 AND nc.ChannelCode != 'SMS'
      ORDER BY nt.NotificationTypeID ASC, nc.NotificationChannelID ASC
    `;
    return await query(sql, [Number(userId)]);
  },

  async checkUserChannelPreference(userId, notificationTypeId, channelCode) {
    const sql = `
      SELECT np.IsEnabled
      FROM NotificationPreference np
      JOIN NotificationChannel nc ON np.NotificationChannelID = nc.NotificationChannelID
      WHERE np.UserID = ? 
        AND np.NotificationTypeID = ? 
        AND nc.ChannelCode = ? 
        AND np.IsDeleted = 0
      LIMIT 1
    `;
    const rows = await query(sql, [Number(userId), notificationTypeId, channelCode]);
    if (rows.length === 0) return true; // Default enabled (opt-out)
    return Boolean(rows[0].IsEnabled);
  },

  async updateUserPreference(userId, notificationTypeId, channelId, isEnabled) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
      INSERT INTO NotificationPreference (UserID, NotificationTypeID, NotificationChannelID, IsEnabled, CreatedBy, CreatedDate)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE IsEnabled = VALUES(IsEnabled), ModifiedDate = NOW()
    `;
    await query(sql, [
      Number(userId),
      notificationTypeId,
      channelId,
      isEnabled ? 1 : 0,
      Number(userId),
      now
    ]);
  },

  /* ── Templates ── */
  async getTemplates() {
    return await query(`
      SELECT t.*, nt.TypeCode, nt.TypeName,
        nc.ChannelCode, nc.ChannelName
      FROM NotificationTemplate t
      LEFT JOIN NotificationType nt ON t.NotificationTypeID = nt.NotificationTypeID
      LEFT JOIN NotificationChannel nc ON t.NotificationChannelID = nc.NotificationChannelID
      WHERE t.IsDeleted = 0
      ORDER BY t.NotificationTemplateID ASC
    `);
  },

  async getTemplateByTypeAndChannel(notificationTypeId, channelCode) {
    const sql = `
      SELECT t.*, nt.TypeCode, nc.ChannelCode
      FROM NotificationTemplate t
      JOIN NotificationType nt ON t.NotificationTypeID = nt.NotificationTypeID
      JOIN NotificationChannel nc ON t.NotificationChannelID = nc.NotificationChannelID
      WHERE t.NotificationTypeID = ? AND nc.ChannelCode = ? AND t.IsActive = 1 AND t.IsDeleted = 0
      LIMIT 1
    `;
    const rows = await query(sql, [notificationTypeId, channelCode]);
    return rows[0] || null;
  },

  async createTemplate(data) {
    const sql = `
      INSERT INTO NotificationTemplate (NotificationTypeID, NotificationChannelID, TemplateCode, TemplateSubject, TemplateBody, CreatedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const res = await query(sql, [
      data.NotificationTypeID,
      data.NotificationChannelID,
      data.TemplateCode,
      data.TemplateSubject || null,
      data.TemplateBody,
      data.CreatedBy || 1
    ]);
    return res.insertId;
  },

  async updateTemplate(id, data) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
      UPDATE NotificationTemplate
      SET TemplateCode = COALESCE(?, TemplateCode),
          TemplateSubject = ?,
          TemplateBody = COALESCE(?, TemplateBody),
          IsActive = COALESCE(?, IsActive),
          ModifiedBy = ?,
          ModifiedDate = ?
      WHERE NotificationTemplateID = ?
    `;
    await query(sql, [
      data.TemplateCode,
      data.TemplateSubject ?? null,
      data.TemplateBody,
      data.IsActive !== undefined ? (data.IsActive ? 1 : 0) : undefined,
      data.ModifiedBy || 1,
      now,
      id
    ]);
  },

  /* ── Types & Channels ── */
  async getNotificationTypes() {
    return await query(`SELECT * FROM NotificationType WHERE IsDeleted = 0 ORDER BY NotificationTypeID ASC`);
  },

  async getNotificationChannels() {
    return await query(`SELECT * FROM NotificationChannel WHERE IsDeleted = 0 AND IsActive = 1 AND ChannelCode != 'SMS' ORDER BY NotificationChannelID ASC`);
  },

  /* ── Reminders ── */
  async getReminders(filters = {}) {
    await this.initTables();
    let sql = `
      SELECT nr.*, ir.RequestNumber, ir.Title AS IssueTitle,
        CONCAT(u.FirstName, ' ', u.LastName) AS AssignedUserName
      FROM NotificationReminder nr
      LEFT JOIN IssueRequest ir ON nr.LinkedIssueRequestID = ir.IssueRequestID
      LEFT JOIN \`User\` u ON nr.AssignedToUserID = u.UserID
      WHERE nr.IsDeleted = 0
    `;
    const params = [];
    if (filters.status) {
      sql += ` AND nr.Status = ?`;
      params.push(filters.status);
    }
    sql += ` ORDER BY nr.ReminderDateTime ASC`;
    return await query(sql, params);
  },

  async createReminder(data) {
    await this.initTables();
    const sql = `
      INSERT INTO NotificationReminder (Title, MessageText, ReminderDateTime, LinkedIssueRequestID, AssignedToUserID, CreatedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const res = await query(sql, [
      data.Title,
      data.MessageText || null,
      data.ReminderDateTime,
      data.LinkedIssueRequestID || null,
      data.AssignedToUserID || null,
      data.CreatedBy || 1
    ]);
    return res.insertId;
  },

  async completeReminder(id) {
    await this.initTables();
    await query(`UPDATE NotificationReminder SET Status = 'COMPLETED' WHERE NotificationReminderID = ?`, [id]);
  }
};

export default notificationRepository;

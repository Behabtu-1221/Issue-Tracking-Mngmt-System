import { query } from '../../../database/connection.js';

export const notificationRepository = {
  async initTables() {
    await query(`
      CREATE TABLE IF NOT EXISTS UserNotification (
        UserNotificationID BIGINT AUTO_INCREMENT PRIMARY KEY,
        NotificationID BIGINT NOT NULL,
        UserID BIGINT NOT NULL,
        ChannelCode VARCHAR(30) NOT NULL DEFAULT 'IN_APP',
        IsRead TINYINT NOT NULL DEFAULT 0,
        ReadDateTime DATETIME(6) NULL,
        IsActive TINYINT NOT NULL DEFAULT 1,
        IsDeleted TINYINT NOT NULL DEFAULT 0,
        CreatedBy BIGINT NOT NULL DEFAULT 1,
        CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX idx_usernotif_user (UserID, IsRead, IsDeleted)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

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
      INSERT INTO UserNotification (NotificationID, UserID, ChannelCode, CreatedBy)
      VALUES (?, ?, ?, ?)
    `;
    const res = await query(sql, [
      data.NotificationID,
      data.UserID,
      data.ChannelCode || 'IN_APP',
      data.CreatedBy || 1
    ]);
    return res.insertId;
  },

  async getUserNotifications(userId, { unreadOnly = false, limit = 50, offset = 0 } = {}) {
    await this.initTables();
    let sql = `
      SELECT un.UserNotificationID, un.NotificationID, un.UserID, un.ChannelCode, un.IsRead, un.ReadDateTime, un.CreatedDate,
        n.Title, n.MessageText, n.TriggeredByTable, n.TriggeredByID, n.CreatedDate AS NotificationDate,
        nt.TypeCode, nt.TypeName
      FROM UserNotification un
      JOIN Notification n ON un.NotificationID = n.NotificationID
      LEFT JOIN NotificationType nt ON n.NotificationTypeID = nt.NotificationTypeID
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
      WHERE nt.IsDeleted = 0 AND nc.IsDeleted = 0
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
    return await query(`SELECT * FROM NotificationChannel WHERE IsDeleted = 0 ORDER BY NotificationChannelID ASC`);
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

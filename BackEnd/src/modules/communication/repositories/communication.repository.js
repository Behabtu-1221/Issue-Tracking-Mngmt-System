import { query, getTransaction } from '../../../database/connection.js';

/**
 * Communication Repository — Production-Ready
 * Uses the schema's Conversation, ConversationParticipant, Message,
 * MessageRead, InternalNote, Announcement, and IssueRequestComment tables.
 */
export const communicationRepository = {

  // ════════════════════════════════════════════════════════════════════════
  //  CONVERSATIONS  (Request-Centered)
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Find or create a conversation for a given IssueRequestID.
   * Automatically adds the calling user as a participant.
   */
  async getOrCreateConversation(issueRequestId, userId) {
    // Try to find existing conversation for this request
    const existing = await query(
      `SELECT c.* FROM Conversation c
       WHERE c.ReferenceIssueRequestID = ? AND c.IsDeleted = 0 AND c.IsActive = 1
       LIMIT 1`,
      [issueRequestId]
    );

    let conversationId;
    if (existing.length > 0) {
      conversationId = existing[0].ConversationID;
    } else {
      // Get request info for the title
      const [req] = await query(
        `SELECT ir.RequestNumber, ir.RequestNumber AS IssueRequestCode, ir.Title, ir.TenantID
         FROM IssueRequest ir WHERE ir.IssueRequestID = ? AND ir.IsDeleted = 0`,
        [issueRequestId]
      );
      const title = req
        ? `Discussion: ${req.RequestNumber || ''} - ${req.Title || 'Request'}`
        : `Request #${issueRequestId} Discussion`;
      const tenantId = req?.TenantID || null;

      const result = await query(
        `INSERT INTO Conversation (TenantID, Title, ReferenceIssueRequestID, CreatedBy)
         VALUES (?, ?, ?, ?)`,
        [tenantId, title, issueRequestId, userId]
      );
      conversationId = result.insertId;
    }

    // Ensure calling user is a participant
    await this.ensureParticipant(conversationId, userId);
    return conversationId;
  },

  /**
   * Ensure a user is added as a participant in a conversation.
   */
  async ensureParticipant(conversationId, userId) {
    const existing = await query(
      `SELECT ConversationParticipantID FROM ConversationParticipant
       WHERE ConversationID = ? AND UserID = ? AND IsDeleted = 0`,
      [conversationId, userId]
    );
    if (existing.length === 0) {
      await query(
        `INSERT INTO ConversationParticipant (ConversationID, UserID, CreatedBy)
         VALUES (?, ?, ?)`,
        [conversationId, userId, userId]
      );
    }
  },

  /**
   * Get conversations for a user — only those where they are a participant.
   */
  async getUserConversations(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const conversations = await query(
      `SELECT c.ConversationID, c.Title, c.ReferenceIssueRequestID, c.CreatedDate,
              ir.RequestNumber, ir.RequestNumber AS IssueRequestCode, ir.Title AS RequestTitle, ir.StatusCode AS RequestStatus,
              ir.PriorityCode AS RequestPriority,
              t.CompanyName AS TenantName,
              (SELECT COUNT(*) FROM Message m WHERE m.ConversationID = c.ConversationID AND m.IsDeleted = 0) AS MessageCount,
              (SELECT MAX(m2.SentDateTime) FROM Message m2 WHERE m2.ConversationID = c.ConversationID AND m2.IsDeleted = 0) AS LastMessageAt,
              (SELECT COUNT(*) FROM Message m3
               WHERE m3.ConversationID = c.ConversationID AND m3.IsDeleted = 0
               AND m3.MessageID NOT IN (
                 SELECT mr.MessageID FROM MessageRead mr WHERE mr.UserID = ? AND mr.IsDeleted = 0
               )
               AND m3.SenderUserID != ?
              ) AS UnreadCount
       FROM Conversation c
       INNER JOIN ConversationParticipant cp ON cp.ConversationID = c.ConversationID AND cp.IsDeleted = 0
       LEFT JOIN IssueRequest ir ON ir.IssueRequestID = c.ReferenceIssueRequestID AND ir.IsDeleted = 0
       LEFT JOIN Tenant t ON t.TenantID = ir.TenantID
       WHERE cp.UserID = ? AND c.IsDeleted = 0 AND c.IsActive = 1
       ORDER BY LastMessageAt DESC, c.CreatedDate DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, userId, limit, offset]
    );

    const [countRow] = await query(
      `SELECT COUNT(DISTINCT c.ConversationID) AS total
       FROM Conversation c
       INNER JOIN ConversationParticipant cp ON cp.ConversationID = c.ConversationID AND cp.IsDeleted = 0
       WHERE cp.UserID = ? AND c.IsDeleted = 0 AND c.IsActive = 1`,
      [userId]
    );

    return {
      conversations,
      total: countRow?.total || 0,
      page,
      limit
    };
  },

  /**
   * Get conversation by request ID — for the conversation panel on a request detail.
   */
  async getConversationByRequestId(issueRequestId) {
    const rows = await query(
      `SELECT c.*, ir.RequestNumber, ir.RequestNumber AS IssueRequestCode, ir.Title AS RequestTitle
       FROM Conversation c
       LEFT JOIN IssueRequest ir ON ir.IssueRequestID = c.ReferenceIssueRequestID
       WHERE c.ReferenceIssueRequestID = ? AND c.IsDeleted = 0 AND c.IsActive = 1
       LIMIT 1`,
      [issueRequestId]
    );
    return rows[0] || null;
  },

  /**
   * Get participants of a conversation.
   */
  async getConversationParticipants(conversationId) {
    return query(
      `SELECT cp.ConversationParticipantID, cp.UserID, cp.JoinedDateTime,
              CONCAT(u.FirstName, ' ', u.LastName) AS FullName,
              u.Email, u.UserTypeCode,
              r.RoleCode, r.RoleName
       FROM ConversationParticipant cp
       JOIN \`User\` u ON u.UserID = cp.UserID
       LEFT JOIN UserRole ur ON ur.UserID = u.UserID AND ur.IsDeleted = 0
       LEFT JOIN \`Role\` r ON r.RoleID = ur.RoleID
       WHERE cp.ConversationID = ? AND cp.IsDeleted = 0
       ORDER BY cp.JoinedDateTime ASC`,
      [conversationId]
    );
  },

  /**
   * Check if user is a participant of a conversation.
   */
  async isParticipant(conversationId, userId) {
    const rows = await query(
      `SELECT 1 FROM ConversationParticipant
       WHERE ConversationID = ? AND UserID = ? AND IsDeleted = 0
       LIMIT 1`,
      [conversationId, userId]
    );
    return rows.length > 0;
  },

  // ════════════════════════════════════════════════════════════════════════
  //  MESSAGES
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Get messages for a conversation with pagination.
   */
  async getMessages(conversationId, userId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;

    const messages = await query(
      `SELECT m.MessageID, m.ConversationID, m.SenderUserID, m.MessageText,
              m.SentDateTime, m.CreatedDate,
              CONCAT(u.FirstName, ' ', u.LastName) AS SenderName,
              u.Email AS SenderEmail, u.UserTypeCode AS SenderUserType,
              r.RoleCode AS SenderRoleCode,
              (SELECT COUNT(*) FROM MessageRead mr
               WHERE mr.MessageID = m.MessageID AND mr.IsDeleted = 0) AS ReadCount,
              (SELECT GROUP_CONCAT(CONCAT(u2.FirstName, ' ', u2.LastName) SEPARATOR ', ')
               FROM MessageRead mr2
               JOIN \`User\` u2 ON u2.UserID = mr2.UserID
               WHERE mr2.MessageID = m.MessageID AND mr2.IsDeleted = 0) AS ReadByNames,
              EXISTS(SELECT 1 FROM MessageRead mr3
                     WHERE mr3.MessageID = m.MessageID AND mr3.UserID = ? AND mr3.IsDeleted = 0) AS IsReadByMe
       FROM Message m
       JOIN \`User\` u ON u.UserID = m.SenderUserID
       LEFT JOIN UserRole ur ON ur.UserID = u.UserID AND ur.IsDeleted = 0
       LEFT JOIN \`Role\` r ON r.RoleID = ur.RoleID
       WHERE m.ConversationID = ? AND m.IsDeleted = 0
       ORDER BY m.SentDateTime ASC
       LIMIT ? OFFSET ?`,
      [userId, conversationId, limit, offset]
    );

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM Message
       WHERE ConversationID = ? AND IsDeleted = 0`,
      [conversationId]
    );

    return {
      messages,
      total: countRow?.total || 0,
      page,
      limit
    };
  },

  /**
   * Send a new message in a conversation.
   */
  async sendMessage(conversationId, senderUserId, messageText) {
    const result = await query(
      `INSERT INTO Message (ConversationID, SenderUserID, MessageText, CreatedBy)
       VALUES (?, ?, ?, ?)`,
      [conversationId, senderUserId, messageText, senderUserId]
    );

    // Auto-mark as read by sender
    await query(
      `INSERT IGNORE INTO MessageRead (MessageID, UserID, CreatedBy)
       VALUES (?, ?, ?)`,
      [result.insertId, senderUserId, senderUserId]
    );

    // Fetch the created message
    const [msg] = await query(
      `SELECT m.*, CONCAT(u.FirstName, ' ', u.LastName) AS SenderName, u.Email AS SenderEmail
       FROM Message m
       JOIN \`User\` u ON u.UserID = m.SenderUserID
       WHERE m.MessageID = ?`,
      [result.insertId]
    );

    return msg;
  },

  /**
   * Mark messages as read by a user.
   */
  async markMessagesAsRead(conversationId, userId) {
    // Get all unread messages in this conversation for this user
    const unreadMessages = await query(
      `SELECT m.MessageID FROM Message m
       WHERE m.ConversationID = ? AND m.IsDeleted = 0
       AND m.SenderUserID != ?
       AND m.MessageID NOT IN (
         SELECT mr.MessageID FROM MessageRead mr WHERE mr.UserID = ? AND mr.IsDeleted = 0
       )`,
      [conversationId, userId, userId]
    );

    if (unreadMessages.length === 0) return 0;

    const values = unreadMessages.map(m => `(${m.MessageID}, ${userId}, ${userId})`).join(',');
    await query(
      `INSERT IGNORE INTO MessageRead (MessageID, UserID, CreatedBy) VALUES ${values}`
    );

    return unreadMessages.length;
  },

  // ════════════════════════════════════════════════════════════════════════
  //  INTERNAL NOTES  (Staff-Only)
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Get internal notes for a request — only visible to staff/admins.
   */
  async getInternalNotes(requestId) {
    return query(
      `SELECT n.InternalNoteID, n.RequestID, n.AuthorUserID, n.NoteText, n.CreatedDate,
              CONCAT(u.FirstName, ' ', u.LastName) AS AuthorName,
              u.Email AS AuthorEmail, r.RoleCode AS AuthorRole
       FROM InternalNote n
       JOIN \`User\` u ON u.UserID = n.AuthorUserID
       LEFT JOIN UserRole ur ON ur.UserID = u.UserID AND ur.IsDeleted = 0
       LEFT JOIN \`Role\` r ON r.RoleID = ur.RoleID
       WHERE n.RequestID = ? AND n.IsDeleted = 0
       ORDER BY n.CreatedDate ASC`,
      [requestId]
    );
  },

  /**
   * Add an internal note to a request.
   */
  async addInternalNote(requestId, authorUserId, noteText) {
    const result = await query(
      `INSERT INTO InternalNote (RequestID, AuthorUserID, NoteText, CreatedBy)
       VALUES (?, ?, ?, ?)`,
      [requestId, authorUserId, noteText, authorUserId]
    );

    const [note] = await query(
      `SELECT n.*, CONCAT(u.FirstName, ' ', u.LastName) AS AuthorName, u.Email AS AuthorEmail
       FROM InternalNote n
       JOIN \`User\` u ON u.UserID = n.AuthorUserID
       WHERE n.InternalNoteID = ?`,
      [result.insertId]
    );

    return note;
  },

  /**
   * Delete an internal note (soft delete).
   */
  async deleteInternalNote(noteId, userId) {
    await query(
      `UPDATE InternalNote SET IsDeleted = 1, DeletedBy = ?, DeletedDate = NOW(6)
       WHERE InternalNoteID = ?`,
      [userId, noteId]
    );
  },

  // ════════════════════════════════════════════════════════════════════════
  //  REQUEST COMMENTS  (Public-facing, visible to requester)
  // ════════════════════════════════════════════════════════════════════════

  async getCommentsByIssueId(issueRequestId, isStaffUser = true) {
    let sql = `
      SELECT c.IssueRequestCommentID, c.IssueRequestID, c.UserID, c.CommentText,
             c.IsInternal, c.CreatedDate,
             CONCAT(u.FirstName, ' ', u.LastName) AS AuthorName,
             u.Email AS AuthorEmail, u.UserTypeCode,
             r.RoleCode AS AuthorRole
      FROM IssueRequestComment c
      JOIN \`User\` u ON c.UserID = u.UserID
      LEFT JOIN UserRole ur ON ur.UserID = u.UserID AND ur.IsDeleted = 0
      LEFT JOIN \`Role\` r ON r.RoleID = ur.RoleID
      WHERE c.IssueRequestID = ? AND c.IsDeleted = 0
    `;
    const params = [issueRequestId];
    if (!isStaffUser) {
      sql += ` AND c.IsInternal = 0`;
    }
    sql += ` ORDER BY c.CreatedDate ASC`;
    return query(sql, params);
  },

  async addComment(data) {
    const result = await query(
      `INSERT INTO IssueRequestComment (IssueRequestID, UserID, CommentText, IsInternal, CreatedBy)
       VALUES (?, ?, ?, ?, ?)`,
      [data.IssueRequestID, data.UserID, data.CommentText, data.IsInternal ? 1 : 0, data.UserID]
    );
    return result.insertId;
  },

  async deleteComment(commentId, userId) {
    await query(
      `UPDATE IssueRequestComment SET IsDeleted = 1, DeletedBy = ?, DeletedDate = NOW(6)
       WHERE IssueRequestCommentID = ?`,
      [userId, commentId]
    );
  },

  // ════════════════════════════════════════════════════════════════════════
  //  ANNOUNCEMENTS
  // ════════════════════════════════════════════════════════════════════════

  async getAnnouncements({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const announcements = await query(
      `SELECT a.AnnouncementID, a.BusinessParkID, a.TargetTenantID, a.Title,
              a.ContentHTML AS Message, a.PublishDateTime, a.ExpiryDateTime,
              a.IsActive, a.CreatedDate,
              CONCAT(u.FirstName, ' ', u.LastName) AS AuthorName, u.Email AS AuthorEmail,
              bp.BusinessParkName,
              t.CompanyName AS TargetTenantName
       FROM Announcement a
       LEFT JOIN \`User\` u ON a.PublisherUserID = u.UserID
       LEFT JOIN BusinessPark bp ON bp.BusinessParkID = a.BusinessParkID
       LEFT JOIN Tenant t ON t.TenantID = a.TargetTenantID
       WHERE a.IsActive = 1 AND a.IsDeleted = 0
       ORDER BY a.PublishDateTime DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM Announcement WHERE IsActive = 1 AND IsDeleted = 0`
    );

    return { announcements, total: countRow?.total || 0, page, limit };
  },

  async createAnnouncement(data) {
    const result = await query(
      `INSERT INTO Announcement (BusinessParkID, TargetTenantID, Title, ContentHTML, PublisherUserID, PublishDateTime, ExpiryDateTime, CreatedBy)
       VALUES (?, ?, ?, ?, ?, NOW(6), ?, ?)`,
      [
        data.BusinessParkID || 1,
        data.TargetTenantID || null,
        data.Title,
        data.Message || data.ContentHTML || '',
        data.CreatedBy,
        data.ExpiryDateTime || null,
        data.CreatedBy
      ]
    );
    return result.insertId;
  },

  async deleteAnnouncement(announcementId, userId) {
    await query(
      `UPDATE Announcement SET IsDeleted = 1, DeletedBy = ?, DeletedDate = NOW(6) WHERE AnnouncementID = ?`,
      [userId, announcementId]
    );
  },

  // ════════════════════════════════════════════════════════════════════════
  //  DISCUSSION GROUPS / TEAM CHANNELS
  // ════════════════════════════════════════════════════════════════════════

  async getDiscussionGroups() {
    const groups = await query(
      `SELECT dg.DiscussionGroupID AS TeamDiscussionID, dg.DiscussionGroupID,
              dg.GroupName AS Title, dg.Description AS Topic, dg.CreatedDate,
              (SELECT COUNT(*) FROM \`comment\` c WHERE c.EntityName = 'DISCUSSION_GROUP' AND c.EntityID = dg.DiscussionGroupID AND c.IsDeleted = 0) AS MessageCount
       FROM discussiongroup dg
       WHERE dg.IsActive = 1 AND dg.IsDeleted = 0
       ORDER BY dg.CreatedDate ASC`
    );

    // Auto-seed standard channels if none exist
    if (groups.length === 0) {
      const defaultChannels = [
        { name: 'general', topic: 'Park-wide announcements and open discussions' },
        { name: 'facility-maintenance', topic: 'HVAC, plumbing, electrical, and facility upkeep coordination' },
        { name: 'it-infrastructure', topic: 'Network connectivity, server rooms, and telecommunication' }
      ];
      for (const ch of defaultChannels) {
        await query(
          `INSERT INTO discussiongroup (GroupName, Description, CreatedBy) VALUES (?, ?, 1)`,
          [ch.name, ch.topic]
        );
      }
      return query(
        `SELECT dg.DiscussionGroupID AS TeamDiscussionID, dg.DiscussionGroupID,
                dg.GroupName AS Title, dg.Description AS Topic, dg.CreatedDate,
                (SELECT COUNT(*) FROM \`comment\` c WHERE c.EntityName = 'DISCUSSION_GROUP' AND c.EntityID = dg.DiscussionGroupID AND c.IsDeleted = 0) AS MessageCount
         FROM discussiongroup dg
         WHERE dg.IsActive = 1 AND dg.IsDeleted = 0
         ORDER BY dg.CreatedDate ASC`
      );
    }

    return groups;
  },

  async createDiscussionGroup(title, topic, userId) {
    const res = await query(
      `INSERT INTO discussiongroup (GroupName, Description, CreatedBy) VALUES (?, ?, ?)`,
      [title, topic || '', userId]
    );
    return res.insertId;
  },

  async getDiscussionMessages(groupId) {
    return query(
      `SELECT c.CommentID AS MessageID, c.EntityID AS TeamDiscussionID, c.UserID AS SenderUserID,
              c.CommentText AS MessageText, c.CreatedDate,
              CONCAT(u.FirstName, ' ', u.LastName) AS SenderName, u.Email AS SenderEmail,
              u.UserTypeCode AS SenderUserType, r.RoleCode AS SenderRoleCode
       FROM \`comment\` c
       JOIN \`User\` u ON u.UserID = c.UserID
       LEFT JOIN UserRole ur ON ur.UserID = u.UserID AND ur.IsDeleted = 0
       LEFT JOIN \`Role\` r ON r.RoleID = ur.RoleID
       WHERE c.EntityName = 'DISCUSSION_GROUP' AND c.EntityID = ? AND c.IsDeleted = 0
       ORDER BY c.CreatedDate ASC`,
      [groupId]
    );
  },

  async addDiscussionMessage(groupId, userId, text) {
    const res = await query(
      `INSERT INTO \`comment\` (EntityName, EntityID, UserID, CommentText, CreatedBy) VALUES ('DISCUSSION_GROUP', ?, ?, ?, ?)`,
      [groupId, userId, text, userId]
    );
    const [msg] = await query(
      `SELECT c.CommentID AS MessageID, c.EntityID AS TeamDiscussionID, c.UserID AS SenderUserID,
              c.CommentText AS MessageText, c.CreatedDate,
              CONCAT(u.FirstName, ' ', u.LastName) AS SenderName, u.Email AS SenderEmail
       FROM \`comment\` c
       JOIN \`User\` u ON u.UserID = c.UserID
       WHERE c.CommentID = ?`,
      [res.insertId]
    );
    return msg;
  },

  // ════════════════════════════════════════════════════════════════════════
  //  ACTIVITY TIMELINE  (Unified View)
  // ════════════════════════════════════════════════════════════════════════

  async getActivityTimeline(issueRequestId) {
    const comments = await query(
      `SELECT 'COMMENT' AS ItemType, c.IssueRequestCommentID AS ItemID,
              c.CommentText AS SummaryText, c.IsInternal, c.CreatedDate AS EventDateTime,
              CONCAT(u.FirstName, ' ', u.LastName) AS ActorName, u.Email AS ActorEmail
       FROM IssueRequestComment c
       JOIN \`User\` u ON c.UserID = u.UserID
       WHERE c.IssueRequestID = ? AND c.IsDeleted = 0`,
      [issueRequestId]
    );

    const messages = await query(
      `SELECT 'MESSAGE' AS ItemType, m.MessageID AS ItemID,
              m.MessageText AS SummaryText, 0 AS IsInternal, m.SentDateTime AS EventDateTime,
              CONCAT(u.FirstName, ' ', u.LastName) AS ActorName, u.Email AS ActorEmail
       FROM Message m
       JOIN Conversation c ON c.ConversationID = m.ConversationID
       JOIN \`User\` u ON u.UserID = m.SenderUserID
       WHERE c.ReferenceIssueRequestID = ? AND m.IsDeleted = 0`,
      [issueRequestId]
    );

    const history = await query(
      `SELECT 'HISTORY' AS ItemType, h.IssueRequestHistoryID AS ItemID,
              CONCAT(COALESCE(h.ActionTypeCode, 'EVENT'), ': ', COALESCE(h.Remarks, 'Request updated')) AS SummaryText,
              0 AS IsInternal, h.ActionDateTime AS EventDateTime,
              CONCAT(u.FirstName, ' ', u.LastName) AS ActorName, u.Email AS ActorEmail
       FROM IssueRequestHistory h
       JOIN \`User\` u ON h.UserID = u.UserID
       WHERE h.IssueRequestID = ? AND h.IsDeleted = 0`,
      [issueRequestId]
    );

    const notes = await query(
      `SELECT 'INTERNAL_NOTE' AS ItemType, n.InternalNoteID AS ItemID,
              n.NoteText AS SummaryText, 1 AS IsInternal, n.CreatedDate AS EventDateTime,
              CONCAT(u.FirstName, ' ', u.LastName) AS ActorName, u.Email AS ActorEmail
       FROM InternalNote n
       JOIN \`User\` u ON u.UserID = n.AuthorUserID
       WHERE n.RequestID = ? AND n.IsDeleted = 0`,
      [issueRequestId]
    );

    return [...comments, ...messages, ...history, ...notes]
      .sort((a, b) => new Date(a.EventDateTime) - new Date(b.EventDateTime));
  },

  // ════════════════════════════════════════════════════════════════════════
  //  OVERVIEW METRICS
  // ════════════════════════════════════════════════════════════════════════

  async getOverviewMetrics(userId) {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM Conversation c
         INNER JOIN ConversationParticipant cp ON cp.ConversationID = c.ConversationID AND cp.IsDeleted = 0
         WHERE cp.UserID = ? AND c.IsDeleted = 0 AND c.IsActive = 1) AS totalConversations,
        (SELECT COUNT(*) FROM IssueRequestComment WHERE IsDeleted = 0) AS totalComments,
        (SELECT COUNT(*) FROM InternalNote WHERE IsDeleted = 0) AS internalNotesCount,
        (SELECT COUNT(*) FROM Announcement WHERE IsActive = 1 AND IsDeleted = 0) AS activeAnnouncementsCount,
        (SELECT COUNT(*) FROM Message m
         INNER JOIN Conversation c ON c.ConversationID = m.ConversationID
         INNER JOIN ConversationParticipant cp ON cp.ConversationID = c.ConversationID AND cp.IsDeleted = 0
         WHERE cp.UserID = ? AND m.IsDeleted = 0
         AND m.SenderUserID != ?
         AND m.MessageID NOT IN (
           SELECT mr.MessageID FROM MessageRead mr WHERE mr.UserID = ? AND mr.IsDeleted = 0
         )) AS totalUnreadMessages
    `;
    const rows = await query(sql, [userId, userId, userId, userId]);
    return rows[0] || {
      totalConversations: 0, totalComments: 0,
      internalNotesCount: 0, activeAnnouncementsCount: 0,
      totalUnreadMessages: 0
    };
  },

  /**
   * Auto-populate conversation participants from request stakeholders.
   */
  async autoAddRequestParticipants(conversationId, issueRequestId) {
    // Add: requester, assigned technician(s), department manager
    const stakeholders = await query(
      `SELECT DISTINCT u.UserID FROM (
         -- Requester
         SELECT ir.RequesterUserID AS UserID FROM IssueRequest ir WHERE ir.IssueRequestID = ? AND ir.IsDeleted = 0
         UNION
         -- Assigned technician(s)
         SELECT a.AssignedUserID AS UserID FROM Assignment a
         WHERE a.RequestID = ? AND a.IsDeleted = 0 AND a.AssignedUserID IS NOT NULL
         UNION
         -- Department manager
         SELECT d.ManagerUserID AS UserID FROM IssueRequest ir
         JOIN Department d ON d.DepartmentID = ir.AssignedDepartmentID
         WHERE ir.IssueRequestID = ? AND ir.IsDeleted = 0 AND d.ManagerUserID IS NOT NULL
       ) u WHERE u.UserID IS NOT NULL`,
      [issueRequestId, issueRequestId, issueRequestId]
    );

    for (const s of stakeholders) {
      await this.ensureParticipant(conversationId, s.UserID);
    }

    return stakeholders.length;
  }
};

export default communicationRepository;

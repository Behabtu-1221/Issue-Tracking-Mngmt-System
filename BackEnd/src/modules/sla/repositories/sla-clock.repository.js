import { query } from '../../../database/connection.js';

export const slaClockRepository = {
  async getOverviewMetrics(tenantId) {
    let sql = `
      SELECT
        (SELECT COUNT(*) FROM SLAClock WHERE IsDeleted = 0) AS totalMonitoredClocks,
        (SELECT COUNT(*) FROM SLAClock WHERE IsResponseBreached = 0 AND IsResolutionBreached = 0 AND IsDeleted = 0) AS compliantClocks,
        (SELECT COUNT(*) FROM SLAClock WHERE IsResponseBreached = 1 AND IsDeleted = 0) AS responseBreachesCount,
        (SELECT COUNT(*) FROM SLAClock WHERE IsResolutionBreached = 1 AND IsDeleted = 0) AS resolutionBreachesCount
    `;
    const rows = await query(sql);
    const m = rows[0] || { totalMonitoredClocks: 0, compliantClocks: 0, responseBreachesCount: 0, resolutionBreachesCount: 0 };
    const compliancePercent = m.totalMonitoredClocks > 0 ? Math.round((m.compliantClocks / m.totalMonitoredClocks) * 100) : 100;
    return { ...m, compliancePercent };
  },

  async findAllClocks({ search, clockStatus, priorityCode, isBreached, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT c.*,
        ir.RequestNumber,
        ir.Title AS RequestTitle,
        ir.PriorityCode,
        ir.StatusCode AS RequestStatusCode,
        s.ServiceName,
        st.TargetResponseMinutes,
        st.TargetResolutionMinutes
      FROM SLAClock c
      JOIN IssueRequest ir ON c.IssueRequestID = ir.IssueRequestID
      JOIN Service s ON ir.ServiceID = s.ServiceID
      JOIN SLAStage st ON c.SLAStageID = st.SLAStageID
      WHERE c.IsDeleted = 0
    `;

    const params = [];
    if (search) {
      sql += ` AND (ir.Title LIKE ? OR ir.RequestNumber LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (clockStatus && clockStatus !== 'ALL') {
      sql += ` AND c.ClockStatus = ?`;
      params.push(clockStatus);
    }
    if (priorityCode && priorityCode !== 'ALL') {
      sql += ` AND ir.PriorityCode = ?`;
      params.push(priorityCode);
    }
    if (isBreached) {
      sql += ` AND (c.IsResponseBreached = 1 OR c.IsResolutionBreached = 1)`;
    }

    sql += ` ORDER BY c.ResolutionDeadline ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const clocks = await query(sql, params);
    return { clocks, total: clocks.length };
  },

  async findClockById(clockId) {
    const sql = `
      SELECT c.*,
        ir.RequestNumber,
        ir.Title AS RequestTitle,
        ir.PriorityCode,
        ir.StatusCode AS RequestStatusCode,
        s.ServiceName
      FROM SLAClock c
      JOIN IssueRequest ir ON c.IssueRequestID = ir.IssueRequestID
      JOIN Service s ON ir.ServiceID = s.ServiceID
      WHERE c.SLAClockID = ? AND c.IsDeleted = 0
    `;
    const rows = await query(sql, [clockId]);
    if (rows.length === 0) return null;

    const historySql = `
      SELECT h.*, CONCAT(u.FirstName, ' ', u.LastName) AS PerformedByName
      FROM SLAHistory h
      LEFT JOIN \`User\` u ON h.PerformedByUserID = u.UserID
      WHERE h.SLAClockID = ? AND h.IsDeleted = 0
      ORDER BY h.EventDateTime ASC
    `;
    const history = await query(historySql, [clockId]);

    const breachesSql = `SELECT * FROM SLABreach WHERE SLAClockID = ? AND IsDeleted = 0 ORDER BY ActualBreachDateTime DESC`;
    const breaches = await query(breachesSql, [clockId]);

    return { ...rows[0], history, breaches };
  },

  async findClockByRequestId(requestId) {
    const sql = `
      SELECT c.*, st.TargetResponseMinutes, st.TargetResolutionMinutes
      FROM SLAClock c
      JOIN SLAStage st ON c.SLAStageID = st.SLAStageID
      WHERE c.IssueRequestID = ? AND c.IsDeleted = 0
      ORDER BY c.SLAClockID DESC LIMIT 1
    `;
    const rows = await query(sql, [requestId]);
    return rows[0] || null;
  },

  async createClock(data) {
    const sql = `
      INSERT INTO SLAClock (
        IssueRequestID, SLAStageID, ResponseDeadline, ResolutionDeadline, ClockStatus, CreatedBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.IssueRequestID,
      data.SLAStageID,
      data.ResponseDeadline,
      data.ResolutionDeadline,
      data.ClockStatus || 'RUNNING',
      data.CreatedBy || 1
    ];
    const res = await query(sql, params);
    return res.insertId;
  },

  async updateClock(id, data) {
    const fields = [];
    const params = [];

    if (data.ClockStatus) { fields.push('ClockStatus = ?'); params.push(data.ClockStatus); }
    if (data.ResponseAchievedDateTime) { fields.push('ResponseAchievedDateTime = ?'); params.push(data.ResponseAchievedDateTime); }
    if (data.ResolutionAchievedDateTime) { fields.push('ResolutionAchievedDateTime = ?'); params.push(data.ResolutionAchievedDateTime); }
    if (data.AccumulatedPausedSeconds !== undefined) { fields.push('AccumulatedPausedSeconds = ?'); params.push(data.AccumulatedPausedSeconds); }
    if (data.LastPausedDateTime !== undefined) { fields.push('LastPausedDateTime = ?'); params.push(data.LastPausedDateTime); }
    if (data.IsResponseBreached !== undefined) { fields.push('IsResponseBreached = ?'); params.push(data.IsResponseBreached); }
    if (data.IsResolutionBreached !== undefined) { fields.push('IsResolutionBreached = ?'); params.push(data.IsResolutionBreached); }
    if (data.ModifiedBy) { fields.push('ModifiedBy = ?'); params.push(data.ModifiedBy); }

    if (fields.length === 0) return;

    params.push(id);
    const sql = `UPDATE SLAClock SET ${fields.join(', ')} WHERE SLAClockID = ?`;
    await query(sql, params);
  },

  async createHistory(data) {
    const sql = `
      INSERT INTO SLAHistory (SLAClockID, EventName, PerformedByUserID, Remarks, CreatedBy)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.SLAClockID,
      data.EventName,
      data.PerformedByUserID || null,
      data.Remarks || null,
      data.CreatedBy || 1
    ];
    const res = await query(sql, params);
    return res.insertId;
  },

  async createBreach(data) {
    const sql = `
      INSERT INTO SLABreach (SLAClockID, BreachType, ActualBreachDateTime, SeverityLevel, CreatedBy)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.SLAClockID,
      data.BreachType,
      data.ActualBreachDateTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
      data.SeverityLevel || 'HIGH',
      data.CreatedBy || 1
    ];
    const res = await query(sql, params);
    return res.insertId;
  },

  async findAllBreaches({ page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT b.*,
        c.IssueRequestID,
        ir.RequestNumber,
        ir.Title AS RequestTitle,
        ir.PriorityCode,
        CONCAT(u.FirstName, ' ', u.LastName) AS AcknowledgedByName
      FROM SLABreach b
      JOIN SLAClock c ON b.SLAClockID = c.SLAClockID
      JOIN IssueRequest ir ON c.IssueRequestID = ir.IssueRequestID
      LEFT JOIN \`User\` u ON b.AcknowledgedByUserID = u.UserID
      WHERE b.IsDeleted = 0
      ORDER BY b.ActualBreachDateTime DESC LIMIT ? OFFSET ?
    `;
    const breaches = await query(sql, [limit, offset]);
    return { breaches, total: breaches.length };
  },

  async acknowledgeBreach(breachId, userId = 1) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
      UPDATE SLABreach
      SET IsAcknowledged = 1, AcknowledgedByUserID = ?, AcknowledgedDateTime = ?
      WHERE SLABreachID = ?
    `;
    await query(sql, [userId, now, breachId]);
  },

  async findActiveRunningClocks() {
    const sql = `
      SELECT c.*, ir.PriorityCode
      FROM SLAClock c
      JOIN IssueRequest ir ON c.IssueRequestID = ir.IssueRequestID
      WHERE c.ClockStatus = 'RUNNING' AND c.IsDeleted = 0
    `;
    return await query(sql);
  }
};

export default slaClockRepository;

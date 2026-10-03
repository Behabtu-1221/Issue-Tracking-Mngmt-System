import { pool, query } from '../../database/connection.js';

export const outboxRepository = {
  /**
   * Save an outbox event. Can participate in an active transaction `tx`.
   */
  async create({ aggregateType, aggregateId, eventType, payload, maxRetries = 5 }, tx = null) {
    const sql = `
      INSERT INTO outbox_events 
        (aggregate_type, aggregate_id, event_type, payload, status, retry_count, max_retries, scheduled_at)
      VALUES 
        (?, ?, ?, ?, 'PENDING', 0, ?, CURRENT_TIMESTAMP(6))
    `;
    const params = [
      aggregateType,
      aggregateId,
      eventType,
      JSON.stringify(payload || {}),
      maxRetries
    ];

    if (tx && typeof tx.query === 'function') {
      const result = await tx.query(sql, params);
      return result.insertId;
    }

    const result = await query(sql, params);
    return result.insertId;
  },

  /**
   * Claims pending/failed events using SELECT ... FOR UPDATE SKIP LOCKED.
   * Safe for multiple replicas concurrently. Must be executed with a transaction connection.
   */
  async claimPendingEvents(batchSize = 20, connection) {
    // 1. Select eligible events and lock them non-blockingly
    const selectSql = `
      SELECT id, aggregate_type, aggregate_id, event_type, payload, retry_count, max_retries
      FROM outbox_events
      WHERE status IN ('PENDING', 'FAILED')
        AND scheduled_at <= CURRENT_TIMESTAMP(6)
        AND retry_count < max_retries
      ORDER BY scheduled_at ASC
      LIMIT ?
      FOR UPDATE SKIP LOCKED
    `;
    const [events] = await connection.query(selectSql, [batchSize]);

    if (!events || events.length === 0) {
      return [];
    }

    // 2. Mark them as PROCESSING
    const ids = events.map((e) => e.id);
    const inPlaceholders = ids.map(() => '?').join(',');
    await connection.query(
      `UPDATE outbox_events SET status = 'PROCESSING' WHERE id IN (${inPlaceholders})`,
      ids
    );

    return events.map((e) => ({
      ...e,
      payload: typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload
    }));
  },

  /**
   * Mark an event as successfully published
   */
  async markPublished(id, connection = null) {
    const sql = `
      UPDATE outbox_events
      SET status = 'PUBLISHED',
          processed_at = CURRENT_TIMESTAMP(6),
          error_message = NULL
      WHERE id = ?
    `;
    if (connection) {
      return await connection.query(sql, [id]);
    }
    return await query(sql, [id]);
  },

  /**
   * Record failure with exponential backoff or dead-letter
   */
  async markFailed(id, errorMessage, retryCount, maxRetries, delaySeconds, connection = null) {
    const isDeadLetter = retryCount + 1 >= maxRetries;
    const nextStatus = isDeadLetter ? 'DEAD_LETTER' : 'FAILED';
    const sql = `
      UPDATE outbox_events
      SET retry_count = retry_count + 1,
          status = ?,
          error_message = ?,
          scheduled_at = DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL ? SECOND)
      WHERE id = ?
    `;
    const params = [nextStatus, String(errorMessage).substring(0, 1000), delaySeconds, id];

    if (connection) {
      return await connection.query(sql, params);
    }
    return await query(sql, params);
  },

  /**
   * Find dead-letter events for alerting/inspection
   */
  async getDeadLetterEvents(limit = 50) {
    return await query(
      `SELECT * FROM outbox_events WHERE status = 'DEAD_LETTER' ORDER BY id DESC LIMIT ?`,
      [limit]
    );
  }
};

export default outboxRepository;

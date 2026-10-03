import { pool } from '../../database/connection.js';
import outboxRepository from './outbox.repository.js';
import { notificationService } from '../../modules/notification/services/notification.service.js';
import logger from '../utils/logger.js';

class OutboxWorker {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.isProcessing = false;
    this.pollIntervalMs = 5000;
    this.batchSize = 20;
  }

  /**
   * Start polling background worker
   */
  start(pollIntervalMs = 5000) {
    if (this.isRunning) {
      logger.warn('[OutboxWorker] Already running');
      return;
    }

    this.pollIntervalMs = pollIntervalMs;
    this.isRunning = true;
    logger.info(`[OutboxWorker] Started background outbox processor (interval: ${this.pollIntervalMs}ms)`);

    // Initial tick
    this.processBatchSafe();

    this.intervalId = setInterval(() => {
      this.processBatchSafe();
    }, this.pollIntervalMs);
  }

  /**
   * Stop background worker gracefully
   */
  async stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Wait if a batch is currently executing
    let waited = 0;
    while (this.isProcessing && waited < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waited += 100;
    }

    logger.info('[OutboxWorker] Background processor stopped');
  }

  async processBatchSafe() {
    if (this.isProcessing || !this.isRunning) return;
    this.isProcessing = true;

    try {
      await this.processBatch(this.batchSize);
    } catch (err) {
      logger.error(`[OutboxWorker] Batch processing error: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Claim and dispatch a single batch of events
   */
  async processBatch(batchSize = 20) {
    const connection = await pool.getConnection();
    let claimedEvents = [];

    try {
      await connection.beginTransaction();
      claimedEvents = await outboxRepository.claimPendingEvents(batchSize, connection);
      await connection.commit();
    } catch (claimErr) {
      await connection.rollback();
      logger.error(`[OutboxWorker] Error claiming pending outbox events: ${claimErr.message}`);
      return 0;
    } finally {
      connection.release();
    }

    if (claimedEvents.length === 0) {
      return 0;
    }

    logger.info(`[OutboxWorker] Claimed ${claimedEvents.length} event(s) for publishing`);

    for (const event of claimedEvents) {
      try {
        await this.dispatchEvent(event);
        await outboxRepository.markPublished(event.id);
        logger.info(`[OutboxWorker] Successfully dispatched & published event [${event.id}] '${event.event_type}'`);
      } catch (dispatchErr) {
        // Calculate exponential backoff delay (seconds): 5s, 15s, 45s, 135s, 300s max
        const backoffDelay = Math.min(300, Math.round(5 * Math.pow(3, event.retry_count)));
        logger.error(
          `[OutboxWorker] Failed to publish event [${event.id}] '${event.event_type}' (attempt ${event.retry_count + 1}/${event.max_retries}): ${dispatchErr.message}. Next retry in ${backoffDelay}s`
        );

        await outboxRepository.markFailed(
          event.id,
          dispatchErr.message,
          event.retry_count,
          event.max_retries,
          backoffDelay
        );
      }
    }

    return claimedEvents.length;
  }

  /**
   * Route and deliver an event to subscribers
   */
  async dispatchEvent(event) {
    const { event_type, payload } = event;
    const actorUserId = payload?.actorUserId || null;

    // Central dispatch to notification service
    if (notificationService && typeof notificationService.notifyEvent === 'function') {
      await notificationService.notifyEvent(event_type, payload, actorUserId);
    } else {
      logger.warn(`[OutboxWorker] No handler registered for event type '${event_type}'`);
    }
  }
}

export const outboxWorker = new OutboxWorker();
export default outboxWorker;

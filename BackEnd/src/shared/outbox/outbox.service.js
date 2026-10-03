import outboxRepository from './outbox.repository.js';
import logger from '../utils/logger.js';

export const outboxService = {
  /**
   * Enqueue an outbox event.
   * If a transaction `tx` is provided, the event is saved within the same ACID transaction.
   *
   * @param {Object} tx - Active Unit of Work transaction (optional)
   * @param {Object} event
   * @param {string} event.aggregateType - e.g. 'IssueRequest', 'User'
   * @param {number|string} event.aggregateId - e.g. 101
   * @param {string} event.eventType - e.g. 'ISSUE_CREATED', 'ISSUE_ASSIGNED'
   * @param {Object} event.payload - Context data for subscribers/notifications
   * @returns {Promise<number>}
   */
  async emit(tx, { aggregateType, aggregateId, eventType, payload }) {
    if (!aggregateType || !aggregateId || !eventType) {
      throw new Error(`Outbox event requires aggregateType, aggregateId, and eventType. Received: ${JSON.stringify({ aggregateType, aggregateId, eventType })}`);
    }

    const eventId = await outboxRepository.create(
      {
        aggregateType,
        aggregateId,
        eventType,
        payload: payload || {}
      },
      tx
    );

    logger.debug(`[Outbox] Emitted event '${eventType}' for ${aggregateType}:${aggregateId} (OutboxID: ${eventId})`);
    return eventId;
  },

  /**
   * Helper when calling without an explicit transaction.
   */
  async emitWithoutTx({ aggregateType, aggregateId, eventType, payload }) {
    return this.emit(null, { aggregateType, aggregateId, eventType, payload });
  }
};

export default outboxService;

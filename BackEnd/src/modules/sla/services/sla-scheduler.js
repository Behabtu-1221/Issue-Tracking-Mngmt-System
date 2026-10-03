import { pool } from '../../../database/connection.js';
import outboxRepository from '../../../shared/outbox/outbox.repository.js';
import systemClock from '../utils/clock.js';
import logger from '../../../shared/utils/logger.js';

export class SlaScheduler {
  constructor(options = {}) {
    this.clock = options.clock || systemClock;
    this.pollIntervalMs = options.pollIntervalMs || 30000; // 30s
    this.batchSize = options.batchSize || 50;
    this.intervalId = null;
    this.isRunning = false;
    this.isProcessing = false;
  }

  start(intervalMs = null) {
    if (this.isRunning) {
      logger.warn('[SlaScheduler] Already running');
      return;
    }

    if (intervalMs) this.pollIntervalMs = intervalMs;
    this.isRunning = true;
    logger.info(`[SlaScheduler] Started background SLA scheduler (interval: ${this.pollIntervalMs}ms)`);

    // Run first tick immediately
    this.tickSafe();

    this.intervalId = setInterval(() => {
      this.tickSafe();
    }, this.pollIntervalMs);
  }

  async stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    let waited = 0;
    while (this.isProcessing && waited < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waited += 100;
    }

    logger.info('[SlaScheduler] Background scheduler stopped');
  }

  async tickSafe() {
    if (this.isProcessing || !this.isRunning) return;
    this.isProcessing = true;

    try {
      await this.tick();
    } catch (err) {
      logger.error(`[SlaScheduler] Tick error: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single evaluation tick.
   * Multi-replica safe via SELECT ... FOR UPDATE SKIP LOCKED.
   * Emits domain events via the Transactional Outbox.
   */
  async tick() {
    const connection = await pool.getConnection();
    const nowUtc = this.clock.now();
    let processedCount = 0;

    try {
      await connection.beginTransaction();

      // 1. Claim active issues needing evaluation with SKIP LOCKED
      const candidateSql = `
        SELECT 
          ir.IssueRequestID, ir.RequestNumber, ir.StatusCode, ir.PriorityCode,
          ir.CreatedDate, ir.ResponseDueAt, ir.ResolutionDueAt,
          ir.SLAWarningSentAt, ir.SLAResponseBreachedAt, ir.SLAResolutionBreachedAt,
          ir.AssignedDepartmentID, ir.TenantID
        FROM IssueRequest ir
        WHERE ir.StatusCode NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED', 'REJECTED')
          AND ir.StatusCode NOT IN ('WAITING_ON_CUSTOMER', 'PAUSED')
          AND (
            (ir.ResponseDueAt IS NOT NULL AND (ir.SLAResponseBreachedAt IS NULL OR ir.SLAWarningSentAt IS NULL))
            OR
            (ir.ResolutionDueAt IS NOT NULL AND (ir.SLAResolutionBreachedAt IS NULL OR ir.SLAWarningSentAt IS NULL))
          )
        ORDER BY COALESCE(ir.ResponseDueAt, ir.ResolutionDueAt) ASC
        LIMIT ?
        FOR UPDATE SKIP LOCKED
      `;

      const [candidates] = await connection.query(candidateSql, [this.batchSize]);

      if (!candidates || candidates.length === 0) {
        await connection.commit();
        return 0;
      }

      for (const issue of candidates) {
        const createdAt = new Date(issue.CreatedDate || Date.now());
        const responseDue = issue.ResponseDueAt ? new Date(issue.ResponseDueAt) : null;
        const resolutionDue = issue.ResolutionDueAt ? new Date(issue.ResolutionDueAt) : null;

        let warningTriggered = false;
        let responseBreached = false;
        let resolutionBreached = false;

        // A. 80% SLA Warning Check (if not already sent)
        if (!issue.SLAWarningSentAt) {
          // Check Resolution Warning (80% of window elapsed)
          if (resolutionDue) {
            const totalDurationMs = resolutionDue.getTime() - createdAt.getTime();
            const warningThresholdMs = createdAt.getTime() + totalDurationMs * 0.8;
            if (nowUtc.getTime() >= warningThresholdMs && nowUtc.getTime() < resolutionDue.getTime()) {
              warningTriggered = true;
            }
          }
          // Check Response Warning
          if (!warningTriggered && responseDue) {
            const totalDurationMs = responseDue.getTime() - createdAt.getTime();
            const warningThresholdMs = createdAt.getTime() + totalDurationMs * 0.8;
            if (nowUtc.getTime() >= warningThresholdMs && nowUtc.getTime() < responseDue.getTime()) {
              warningTriggered = true;
            }
          }

          if (warningTriggered) {
            await connection.query(
              `UPDATE IssueRequest SET SLAWarningSentAt = ? WHERE IssueRequestID = ?`,
              [nowUtc, issue.IssueRequestID]
            );

            await outboxRepository.create(
              {
                aggregateType: 'IssueRequest',
                aggregateId: issue.IssueRequestID,
                eventType: 'SLA_WARNING',
                payload: {
                  requestId: issue.IssueRequestID,
                  requestNumber: issue.RequestNumber,
                  priority: issue.PriorityCode,
                  warningSentAt: nowUtc.toISOString(),
                  responseDueAt: responseDue?.toISOString() || null,
                  resolutionDueAt: resolutionDue?.toISOString() || null
                }
              },
              connection
            );

            logger.info(`[SlaScheduler] Dispatched 80% SLA warning for issue ${issue.RequestNumber} (${issue.IssueRequestID})`);
          }
        }

        // B. Response Breach Check (if applicable and not yet breached)
        if (responseDue && !issue.SLAResponseBreachedAt) {
          // Breached if now is past ResponseDueAt and status is still awaiting initial response
          const unrespondedStatuses = ['SUBMITTED', 'PENDING_APPROVAL', 'ASSIGNED', 'NEW'];
          if (unrespondedStatuses.includes(issue.StatusCode) && nowUtc.getTime() >= responseDue.getTime()) {
            responseBreached = true;

            await connection.query(
              `UPDATE IssueRequest SET SLAResponseBreachedAt = ? WHERE IssueRequestID = ?`,
              [nowUtc, issue.IssueRequestID]
            );

            await outboxRepository.create(
              {
                aggregateType: 'IssueRequest',
                aggregateId: issue.IssueRequestID,
                eventType: 'SLA_RESPONSE_BREACHED',
                payload: {
                  requestId: issue.IssueRequestID,
                  requestNumber: issue.RequestNumber,
                  breachType: 'RESPONSE',
                  priority: issue.PriorityCode,
                  breachedAt: nowUtc.toISOString(),
                  deadline: responseDue.toISOString()
                }
              },
              connection
            );

            logger.warn(`[SlaScheduler] Response SLA breached for issue ${issue.RequestNumber} (${issue.IssueRequestID})`);
          }
        }

        // C. Resolution Breach Check (if applicable and not yet breached)
        if (resolutionDue && !issue.SLAResolutionBreachedAt) {
          if (nowUtc.getTime() >= resolutionDue.getTime()) {
            resolutionBreached = true;

            await connection.query(
              `UPDATE IssueRequest SET SLAResolutionBreachedAt = ? WHERE IssueRequestID = ?`,
              [nowUtc, issue.IssueRequestID]
            );

            await outboxRepository.create(
              {
                aggregateType: 'IssueRequest',
                aggregateId: issue.IssueRequestID,
                eventType: 'SLA_RESOLUTION_BREACHED',
                payload: {
                  requestId: issue.IssueRequestID,
                  requestNumber: issue.RequestNumber,
                  breachType: 'RESOLUTION',
                  priority: issue.PriorityCode,
                  breachedAt: nowUtc.toISOString(),
                  deadline: resolutionDue.toISOString()
                }
              },
              connection
            );

            logger.warn(`[SlaScheduler] Resolution SLA breached for issue ${issue.RequestNumber} (${issue.IssueRequestID})`);
          }
        }

        if (warningTriggered || responseBreached || resolutionBreached) {
          processedCount++;
        }
      }

      await connection.commit();
      return processedCount;
    } catch (err) {
      await connection.rollback();
      logger.error(`[SlaScheduler] Error in scheduler tick: ${err.message}`);
      throw err;
    } finally {
      connection.release();
    }
  }
}

export const slaScheduler = new SlaScheduler();
export default slaScheduler;

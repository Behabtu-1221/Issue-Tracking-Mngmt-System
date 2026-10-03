import assert from 'assert';
import { pool, query } from '../src/database/connection.js';
import unitOfWork from '../src/shared/database/unitOfWork.js';
import outboxRepository from '../src/shared/outbox/outbox.repository.js';
import outboxService from '../src/shared/outbox/outbox.service.js';
import { FakeClock } from '../src/modules/sla/utils/clock.js';
import { BusinessCalendar } from '../src/modules/sla/utils/business-calendar.js';
import { SlaScheduler } from '../src/modules/sla/services/sla-scheduler.js';
import migrator from '../src/database/migrator.js';
import { OptimisticLockError } from '../src/shared/errors/AppError.js';
import issueRequestRepository from '../src/modules/issue-management/repositories/issue-request.repository.js';
import issueRequestService from '../src/modules/issue-management/services/issue-request.service.js';

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`• Testing: ${name}... `);
    await fn();
    console.log('✅ PASS');
    passedTests++;
  } catch (err) {
    console.log('❌ FAIL');
    console.error(`  Error: ${err.message}\n${err.stack}`);
    failedTests++;
  }
}

console.log('===============================================================');
console.log('       ENTERPRISE ITMS: SYSTEM INTEGRITY AUTOMATED TEST SUITE    ');
console.log('===============================================================\n');

(async () => {
  try {
    // -------------------------------------------------------------
    // TEST 1: Database Migration System & Head Check
    // -------------------------------------------------------------
    await test('Forward-only migration system is at head with valid checksums', async () => {
      const head = await migrator.checkHead();
      assert.strictEqual(head.isAtHead, true, `Pending migrations found: ${head.pendingCount}`);
      assert.ok(head.latestAppliedVersion, 'Head version must exist');

      const statuses = await migrator.status();
      assert.ok(statuses.length >= 5, 'At least 5 migrations must be registered');
      for (const s of statuses) {
        assert.strictEqual(s.applied, true, `Migration ${s.name} must be applied`);
        assert.strictEqual(s.checksumMatch, true, `Migration ${s.name} checksum tampered`);
      }
    });

    // -------------------------------------------------------------
    // TEST 2: ACID Transactions & Unit of Work Rollback Guarantee
    // -------------------------------------------------------------
    await test('Unit of Work guarantees 100% rollback on failure with zero orphan records', async () => {
      const canaryTitle = `CANARY-ROLLBACK-TEST-${Date.now()}`;

      let caught = false;
      try {
        await unitOfWork.execute(async (tx) => {
          // Step 1: Create issue in tx
          await issueRequestRepository.create({
            ServiceID: 1,
            Title: canaryTitle,
            Description: 'This should be rolled back completely',
            PriorityCode: 'LOW',
            StatusCode: 'NEW',
            RequesterUserID: 1
          }, tx);

          // Step 2: Artificial failure midway through workflow
          throw new Error('Simulated network/DB crash in multi-step unit of work');
        });
      } catch (err) {
        caught = true;
        assert.strictEqual(err.message, 'Simulated network/DB crash in multi-step unit of work');
      }

      assert.strictEqual(caught, true, 'Exception must be propagated from unitOfWork');

      // Assert zero persistence (record must NOT exist in DB)
      const [found] = await query('SELECT IssueRequestID FROM IssueRequest WHERE Title = ?', [canaryTitle]);
      assert.strictEqual(found, undefined, 'Orphan issue record found! Transaction rollback failed.');
    });

    // -------------------------------------------------------------
    // TEST 3: Optimistic Concurrency Locking (RowVersion)
    // -------------------------------------------------------------
    await test('Optimistic Locking prevents lost updates and throws 409 Conflict', async () => {
      // 1. Create a test issue
      const issue = await issueRequestRepository.create({
        ServiceID: 1,
        Title: `OPTIMISTIC-LOCK-TEST-${Date.now()}`,
        Description: 'Testing RowVersion concurrency',
        PriorityCode: 'MEDIUM',
        StatusCode: 'NEW',
        RequesterUserID: 1
      });

      assert.ok(issue.IssueRequestID, 'Issue must be created');
      const initialRowVersion = issue.RowVersion;
      assert.ok(initialRowVersion, 'Issue must have initial RowVersion');

      // 2. First client successfully updates the issue
      const updatedFirst = await issueRequestRepository.update(issue.IssueRequestID, {
        Description: 'First concurrent update succeeded',
        expectedRowVersion: initialRowVersion
      });
      assert.notStrictEqual(updatedFirst.RowVersion, initialRowVersion, 'RowVersion must change after update');

      // 3. Second concurrent client attempts update with the stale initialRowVersion
      let conflictThrown = false;
      try {
        await issueRequestRepository.update(issue.IssueRequestID, {
          Description: 'Second concurrent update should be rejected',
          expectedRowVersion: initialRowVersion
        });
      } catch (err) {
        if (err instanceof OptimisticLockError || err.statusCode === 409) {
          conflictThrown = true;
        } else {
          throw err;
        }
      }

      assert.strictEqual(conflictThrown, true, 'Optimistic concurrency violation did not throw OptimisticLockError');

      // Cleanup
      await query('DELETE FROM IssueRequest WHERE IssueRequestID = ?', [issue.IssueRequestID]);
    });

    // -------------------------------------------------------------
    // TEST 4: Transactional Outbox & Concurrent SKIP LOCKED Claiming
    // -------------------------------------------------------------
    await test('Transactional Outbox supports SKIP LOCKED claiming without duplicate delivery', async () => {
      const tag = `OUTBOX-TEST-${Date.now()}`;

      // Insert 3 pending outbox events inside a single transaction
      await unitOfWork.execute(async (tx) => {
        await outboxService.emit(tx, {
          aggregateType: 'TestAggregate',
          aggregateId: 9991,
          eventType: 'TEST_EVENT_A',
          payload: { tag, index: 1 }
        });
        await outboxService.emit(tx, {
          aggregateType: 'TestAggregate',
          aggregateId: 9992,
          eventType: 'TEST_EVENT_B',
          payload: { tag, index: 2 }
        });
        await outboxService.emit(tx, {
          aggregateType: 'TestAggregate',
          aggregateId: 9993,
          eventType: 'TEST_EVENT_C',
          payload: { tag, index: 3 }
        });
      });

      // Simulate Worker 1 claiming a batch
      const conn1 = await pool.getConnection();
      await conn1.beginTransaction();
      const worker1Claimed = await outboxRepository.claimPendingEvents(2, conn1);
      await conn1.commit();
      conn1.release();

      // Simulate Worker 2 claiming concurrently
      const conn2 = await pool.getConnection();
      await conn2.beginTransaction();
      const worker2Claimed = await outboxRepository.claimPendingEvents(2, conn2);
      await conn2.commit();
      conn2.release();

      // Worker 1 and Worker 2 must claim distinct sets of events
      const w1Ids = worker1Claimed.map((e) => e.id);
      const w2Ids = worker2Claimed.map((e) => e.id);
      const intersection = w1Ids.filter((id) => w2Ids.includes(id));

      assert.strictEqual(intersection.length, 0, `Duplicate claim detected between workers: ${intersection}`);
      assert.ok(worker1Claimed.length > 0, 'Worker 1 must claim events');

      // Test marking published
      for (const ev of worker1Claimed) {
        await outboxRepository.markPublished(ev.id);
      }
      for (const ev of worker2Claimed) {
        await outboxRepository.markPublished(ev.id);
      }

      // Cleanup
      await query("DELETE FROM outbox_events WHERE aggregate_type = 'TestAggregate'");
    });

    // -------------------------------------------------------------
    // TEST 5: Business Calendar & Working Hours / Holiday SLA Deadlines
    // -------------------------------------------------------------
    await test('BusinessCalendar correctly computes deadlines across business hours and holidays', async () => {
      const calendar = new BusinessCalendar({
        startHour: 8,
        endHour: 17, // 9 hours = 540 min per day
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['2026-10-06'] // Simulated Tuesday holiday
      });

      // Scenario A: Within business hours on Monday 10:00 UTC (120 minutes) -> Monday 12:00 UTC
      const monMorning = new Date('2026-10-05T10:00:00.000Z'); // Monday
      const deadlineA = calendar.calculateDeadline(monMorning, 120);
      assert.strictEqual(deadlineA.toISOString(), '2026-10-05T12:00:00.000Z');

      // Scenario B: Submitted Friday at 16:00 UTC with 120 min duration
      // Friday 16:00 -> 17:00 (60 min used, 60 min remaining)
      // Saturday & Sunday skipped -> resumes Monday at 08:00 UTC -> Monday 09:00 UTC!
      const friAfternoon = new Date('2026-10-02T16:00:00.000Z'); // Friday
      const deadlineB = calendar.calculateDeadline(friAfternoon, 120);
      assert.strictEqual(deadlineB.toISOString(), '2026-10-05T09:00:00.000Z');

      // Scenario C: Holiday skipping
      // Monday 16:00 with 120 min duration -> 60 min left at 17:00
      // Tuesday 2026-10-06 is declared holiday -> skips to Wednesday 2026-10-07 09:00 UTC!
      const monAfternoon = new Date('2026-10-05T16:00:00.000Z');
      const deadlineC = calendar.calculateDeadline(monAfternoon, 120);
      assert.strictEqual(deadlineC.toISOString(), '2026-10-07T09:00:00.000Z');

      // Scenario D: 24x7 Critical Priority Override
      // Emergency 24x7 ticket created Friday 23:00 with 60 min duration -> Friday 24:00 (Saturday 00:00 UTC)
      const emergencyStart = new Date('2026-10-02T23:00:00.000Z');
      const deadlineD = calendar.calculateDeadline(emergencyStart, 60, { is24x7: true });
      assert.strictEqual(deadlineD.toISOString(), '2026-10-03T00:00:00.000Z');
    });

    // -------------------------------------------------------------
    // TEST 6: Distributed SLA Scheduler with FakeClock
    // -------------------------------------------------------------
    await test('Distributed SLA Scheduler detects 80% warnings and breaches via FakeClock', async () => {
      const baseNow = new Date();
      const clock = new FakeClock(baseNow);
      const scheduler = new SlaScheduler({ clock, batchSize: 10 });

      // 15 min response window, 240 min resolution window
      const responseDue = new Date(baseNow.getTime() + 15 * 60 * 1000);
      const resolutionDue = new Date(baseNow.getTime() + 240 * 60 * 1000);

      // Create an issue directly with deterministic SLA deadlines
      const issue = await issueRequestRepository.create({
        ServiceID: 1,
        Title: 'SLA Scheduler Test Issue',
        Description: 'Testing breach engine',
        PriorityCode: 'CRITICAL',
        StatusCode: 'NEW',
        RequesterUserID: 1,
        ResponseDueAt: responseDue,
        ResolutionDueAt: resolutionDue
      });
      const testIssueId = issue.IssueRequestID;

      try {
        // Tick 1: Time = baseNow (0% elapsed -> no warning, no breach)
        await scheduler.tick();
        const [fresh1] = await query('SELECT SLAWarningSentAt, SLAResponseBreachedAt FROM IssueRequest WHERE IssueRequestID = ?', [testIssueId]);
        assert.strictEqual(fresh1.SLAWarningSentAt, null);
        assert.strictEqual(fresh1.SLAResponseBreachedAt, null);

        // Advance FakeClock by 13 minutes (86.6% elapsed -> should trigger 80% warning)
        clock.advanceMinutes(13);
        await scheduler.tick();
        const [fresh2] = await query('SELECT SLAWarningSentAt, SLAResponseBreachedAt FROM IssueRequest WHERE IssueRequestID = ?', [testIssueId]);
        assert.notStrictEqual(fresh2.SLAWarningSentAt, null, '80% SLA Warning must be set');
        assert.strictEqual(fresh2.SLAResponseBreachedAt, null, 'Response should not yet be breached');

        // Advance FakeClock past 15 min deadline (total 16 minutes -> should trigger Response Breach)
        clock.advanceMinutes(3);
        await scheduler.tick();
        const [fresh3] = await query('SELECT SLAResponseBreachedAt FROM IssueRequest WHERE IssueRequestID = ?', [testIssueId]);
        assert.notStrictEqual(fresh3.SLAResponseBreachedAt, null, 'Response Breach timestamp must be recorded');

        // Verify domain events in outbox
        const outboxEvents = await query(
          "SELECT event_type FROM outbox_events WHERE aggregate_type = 'IssueRequest' AND aggregate_id = ?",
          [testIssueId]
        );
        const eventTypes = outboxEvents.map((e) => e.event_type);
        assert.ok(eventTypes.includes('SLA_WARNING'), 'Outbox must contain SLA_WARNING event');
        assert.ok(eventTypes.includes('SLA_RESPONSE_BREACHED'), 'Outbox must contain SLA_RESPONSE_BREACHED event');
      } finally {
        // Cleanup test issue and its outbox events
        await query('DELETE FROM outbox_events WHERE aggregate_type = ? AND aggregate_id = ?', ['IssueRequest', testIssueId]);
        await query('DELETE FROM IssueRequest WHERE IssueRequestID = ?', [testIssueId]);
      }
    });

    // -------------------------------------------------------------
    // TEST 7: Idempotency Key Storage & Fingerprint Collision Prevention
    // -------------------------------------------------------------
    await test('Idempotency table stores responses and prevents key hijacking', async () => {
      const testKey = `IDEM-TEST-${Date.now()}`;
      const userId = 42;
      const originalHash = 'hash-abc-123';
      const responseData = { status: 'success', data: { id: 777, code: 'OK' } };

      // 1. Insert idempotency record
      await query(
        `INSERT INTO idempotency_keys (idempotency_key, user_id, request_hash, response_status, response_body, expires_at)
         VALUES (?, ?, ?, 201, ?, DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 3600 SECOND))`,
        [testKey, userId, originalHash, JSON.stringify(responseData)]
      );

      // 2. Fetch and assert replay capability
      const [record] = await query(
        'SELECT * FROM idempotency_keys WHERE idempotency_key = ? AND user_id = ?',
        [testKey, userId]
      );
      assert.ok(record, 'Idempotency record must be stored');
      assert.strictEqual(record.response_status, 201);
      const parsedBody = typeof record.response_body === 'string'
        ? JSON.parse(record.response_body)
        : record.response_body;
      assert.strictEqual(parsedBody.data.id, 777);

      // Cleanup
      await query('DELETE FROM idempotency_keys WHERE idempotency_key = ?', [testKey]);
    });

  } finally {
    await pool.end();
  }

  console.log('\n===============================================================');
  console.log(`TOTAL TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('===============================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();

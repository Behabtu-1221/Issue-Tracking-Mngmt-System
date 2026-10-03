# Enterprise ITMS — System Integrity, Concurrency & SLA Runbook

## 1. System Integrity Architecture Overview

The Enterprise Issue Tracking & Management System (ITMS) implements robust transactional integrity and concurrency safety under network, database, and process failures following Twelve-Factor App and Domain-Driven Design principles.

```
                  ┌──────────────────────────────────────────────┐
                  │              HTTP / API Inbound               │
                  │   Idempotency-Key & JWT Auth Interceptor     │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                 Unit of Work                 │
                  │       (READ COMMITTED ACID Transaction)       │
                  ├──────────────────────┬───────────────────────┤
                  │                      │                       │
                  ▼                      ▼                       ▼
          ┌───────────────┐      ┌───────────────┐       ┌───────────────┐
          │ Domain Tables │      │ IssueRequest  │       │ outbox_events │
          │  (Audit Log / │      │  (RowVersion  │       │ (Transactional│
          │  Assignment / │      │  Optimistic   │       │    Outbox)    │
          │   Approval)   │      │   Locking)    │       │               │
          └───────────────┘      └───────────────┘       └───────┬───────┘
                                                                 │
                                                       (Atomic Commit)
                                                                 │
                                                                 ▼
                                                  ┌─────────────────────────────┐
                                                  │     Outbox Worker Poll      │
                                                  │   (SKIP LOCKED Concurrency) │
                                                  └──────────────┬──────────────┘
                                                                 │
                                                                 ▼
                                                  ┌─────────────────────────────┐
                                                  │   Email / Notification Hub  │
                                                  │  (Exponential Backoff & DLQ)│
                                                  └─────────────────────────────┘
```

---

## 2. Key Subsystems

### 2.1 Forward-Only Database Migration Engine
- **Engine Script**: [`src/database/migrator.js`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/database/migrator.js)
- **Migrations Directory**: [`src/database/migrations/`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/database/migrations/)
- **Distributed Concurrency Lock**: MySQL advisory lock via `GET_LOCK('itms_db_migrator_lock', 20)`. Prevents race conditions when multiple app replicas boot simultaneously.
- **Tamper & Drift Prevention**: Every migration is SHA-256 hashed. The database checks applied checksums against disk on every run; any modified or missing migration causes immediate fail-fast termination.
- **CLI Commands**:
  ```bash
  # Apply all pending migrations
  npm run migrate

  # Inspect status, timestamps, and integrity
  npm run migrate:status

  # Fail-fast check for CI/CD pipelines and Kubernetes container boot
  npm run migrate:check
  ```

### 2.2 Unit of Work (ACID Transactions)
- **Module**: [`src/shared/database/unitOfWork.js`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/shared/database/unitOfWork.js)
- **Semantics**:
  - `unitOfWork.execute(async (tx) => { ... })`
  - Acquires a dedicated connection from `pool`.
  - Sets isolation level to `READ COMMITTED`.
  - Begins transaction (`tx`).
  - Automatically commits on return; rolls back on any thrown exception.
  - Automatically unwinds nested units of work without creating nested transactions.
  - Maps database deadlocks (`ER_LOCK_DEADLOCK`), lock wait timeouts (`ER_LOCK_WAIT_TIMEOUT`), and duplicate keys (`ER_DUP_ENTRY`) to clean HTTP operational errors (409 Conflict).

### 2.3 Optimistic Concurrency Control (`RowVersion`)
- **Table Column**: `IssueRequest.RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`.
- **Query Pattern**:
  ```sql
  UPDATE IssueRequest
  SET StatusCode = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
  WHERE IssueRequestID = ? AND RowVersion = ?
  ```
- **Conflict Handling**:
  - If `affectedRows === 0` when `expectedRowVersion` is supplied, an `OptimisticLockError` is thrown.
  - Mapped to **HTTP 409 Conflict** with message: `"The issue request has been modified by another concurrent transaction. Please reload."`

### 2.4 Transactional Outbox & Background Worker
- **Table**: `outbox_events` (`status`: `PENDING`, `PROCESSING`, `PUBLISHED`, `FAILED`, `DEAD_LETTER`).
- **Worker**: [`src/shared/outbox/outbox-worker.js`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/shared/outbox/outbox-worker.js)
- **Multi-Replica Safe**:
  ```sql
  SELECT id, aggregate_type, aggregate_id, event_type, payload, retry_count, max_retries
  FROM outbox_events
  WHERE status IN ('PENDING', 'FAILED')
    AND scheduled_at <= CURRENT_TIMESTAMP(6)
    AND retry_count < max_retries
  ORDER BY scheduled_at ASC
  LIMIT 20
  FOR UPDATE SKIP LOCKED
  ```
- **Retry Backoff**: Exponential delay: `delay = min(300, 5 * 3^retry_count)` seconds (5s, 15s, 45s, 135s, 300s).
- **Dead-Letter Queue (DLQ)**: Once `max_retries` (5) is exceeded, the event is marked `DEAD_LETTER` for operator investigation.

### 2.5 Distributed SLA Engine & Business Calendar
- **Injectable Clock**: [`src/modules/sla/utils/clock.js`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/sla/utils/clock.js) (`SystemClock` for production, `FakeClock` for millisecond-accurate time travel testing).
- **Business Calendar**: [`src/modules/sla/utils/business-calendar.js`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/sla/utils/business-calendar.js):
  - Operating window: 08:00 to 17:00 UTC (Mon-Fri).
  - Weekend exclusion (Saturday & Sunday).
  - Ethiopian public holidays excluded.
  - `CRITICAL` priority tickets bypass calendar and calculate 24x7.
- **Distributed SLA Scheduler Worker**: [`src/modules/sla/services/sla-scheduler.js`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/sla/services/sla-scheduler.js):
  - Polls active candidate tickets every 30 seconds via `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 50`.
  - **80% SLA Warning**: Emits `SLA_WARNING` event to Outbox once 80% of response/resolution window has elapsed.
  - **Response Breach**: Emits `SLA_RESPONSE_BREACHED` event once current UTC time exceeds `ResponseDueAt`.
  - **Resolution Breach**: Emits `SLA_RESOLUTION_BREACHED` event once current UTC time exceeds `ResolutionDueAt`.

### 2.6 Idempotency Middleware
- **Module**: [`src/shared/middleware/idempotency.js`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/shared/middleware/idempotency.js)
- **Header**: `Idempotency-Key: <UUID>`
- **Behavior**:
  - Computes SHA-256 fingerprint of `method:path:sorted_payload`.
  - Replayed identical requests return cached status code, headers, and response body with header `X-Cache-Lookup: HIT-IDEMPOTENT`.
  - Reusing the same key with conflicting payload returns **HTTP 409 Conflict**.

### 2.7 Fail-Fast Startup & Probes
- **Configuration**: Joi schema validates all environment variables upon startup with `{ abortEarly: false }`, reporting all misconfigurations together.
- **Liveness Probe**: `GET /health/live` (Returns HTTP 200 `{ status: 'UP' }`).
- **Readiness Probe**: `GET /health/ready` (Returns HTTP 200 `{ status: 'UP', database: 'CONNECTED', migrations: 'AT_HEAD' }` or HTTP 503 if unready).
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT`, stops Express listener, stops Outbox & SLA workers, drains MySQL connection pool, and exits cleanly within 10 seconds.

---

## 3. Operational Playbook & Troubleshooting

### Investigating Dead-Letter Outbox Events
```sql
SELECT id, aggregate_type, aggregate_id, event_type, retry_count, error_message, created_at
FROM outbox_events
WHERE status = 'DEAD_LETTER'
ORDER BY id DESC;
```
To re-queue a dead-letter event after fixing network/SMTP issues:
```sql
UPDATE outbox_events
SET status = 'PENDING', retry_count = 0, scheduled_at = CURRENT_TIMESTAMP(6), error_message = NULL
WHERE id = <EVENT_ID>;
```

### Checking SLA Breached Tickets
```sql
SELECT IssueRequestID, RequestNumber, PriorityCode, StatusCode,
       ResponseDueAt, ResolutionDueAt, SLAWarningSentAt, SLAResponseBreachedAt, SLAResolutionBreachedAt
FROM IssueRequest
WHERE SLAResponseBreachedAt IS NOT NULL OR SLAResolutionBreachedAt IS NOT NULL
ORDER BY CreatedDate DESC;
```

---

## 4. Running the Integrity Test Suite
```bash
npm test
```
The test suite validates:
1. Schema migration forward-only execution and SHA-256 checksums
2. Transaction rollback and zero orphan record persistence
3. Optimistic locking with microsecond `RowVersion`
4. Transactional Outbox multi-worker claiming with `SKIP LOCKED`
5. Business calendar working hours, holidays, and 24x7 deadlines
6. SLA distributed scheduler 80% warning and breach tracking with `FakeClock`
7. Idempotency key caching and fingerprint collision detection

import db from '../connection.js';

export async function initReportingTables() {
  console.log('--- Ensuring Analysis & Reporting tables exist ---');

  // 1. SavedReport table
  await db.query(`
    CREATE TABLE IF NOT EXISTS SavedReport (
      SavedReportID BIGINT AUTO_INCREMENT PRIMARY KEY,
      TenantID BIGINT NULL,
      ReportName VARCHAR(150) NOT NULL,
      Description VARCHAR(500) NULL,
      ReportTypeCode VARCHAR(50) NOT NULL DEFAULT 'REQUEST_ANALYTICS',
      ConfigJson JSON NULL,
      VisibilityCode VARCHAR(30) NOT NULL DEFAULT 'PRIVATE',
      CreatedBy BIGINT NOT NULL DEFAULT 1,
      CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      ModifiedBy BIGINT NULL,
      ModifiedDate DATETIME(6) NULL,
      DeletedBy BIGINT NULL,
      DeletedDate DATETIME(6) NULL,
      IsActive TINYINT NOT NULL DEFAULT 1,
      IsDeleted TINYINT NOT NULL DEFAULT 0,
      RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      INDEX idx_saved_report_tenant (TenantID),
      INDEX idx_saved_report_user (CreatedBy),
      INDEX idx_saved_report_type (ReportTypeCode),
      CONSTRAINT fk_savedrep_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE SET NULL,
      CONSTRAINT fk_savedrep_user FOREIGN KEY (CreatedBy) REFERENCES \`User\`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. ReportSchedule table
  await db.query(`
    CREATE TABLE IF NOT EXISTS ReportSchedule (
      ReportScheduleID BIGINT AUTO_INCREMENT PRIMARY KEY,
      SavedReportID BIGINT NULL,
      TenantID BIGINT NULL,
      ScheduleName VARCHAR(150) NOT NULL,
      ReportTypeCode VARCHAR(50) NOT NULL DEFAULT 'EXECUTIVE_SUMMARY',
      FrequencyCode VARCHAR(30) NOT NULL DEFAULT 'WEEKLY',
      CronExpression VARCHAR(50) NULL,
      RecipientsJson JSON NULL,
      ExportFormat VARCHAR(20) NOT NULL DEFAULT 'CSV',
      LastRunDateTime DATETIME(6) NULL,
      NextRunDateTime DATETIME(6) NULL,
      Status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      IsActive TINYINT NOT NULL DEFAULT 1,
      IsDeleted TINYINT NOT NULL DEFAULT 0,
      CreatedBy BIGINT NOT NULL DEFAULT 1,
      CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      ModifiedBy BIGINT NULL,
      ModifiedDate DATETIME(6) NULL,
      DeletedBy BIGINT NULL,
      DeletedDate DATETIME(6) NULL,
      RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      INDEX idx_schedule_tenant (TenantID),
      INDEX idx_schedule_status (Status),
      INDEX idx_schedule_next_run (NextRunDateTime),
      CONSTRAINT fk_repsched_saved_report FOREIGN KEY (SavedReportID) REFERENCES SavedReport(SavedReportID) ON UPDATE CASCADE ON DELETE SET NULL,
      CONSTRAINT fk_repsched_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE SET NULL,
      CONSTRAINT fk_repsched_user FOREIGN KEY (CreatedBy) REFERENCES \`User\`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. ReportExecutionHistory table
  await db.query(`
    CREATE TABLE IF NOT EXISTS ReportExecutionHistory (
      ExecutionHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
      SavedReportID BIGINT NULL,
      ReportScheduleID BIGINT NULL,
      TenantID BIGINT NULL,
      ReportName VARCHAR(150) NOT NULL,
      ReportTypeCode VARCHAR(50) NOT NULL,
      TriggerType VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
      ExportFormat VARCHAR(20) NOT NULL DEFAULT 'CSV',
      RowCount INT NOT NULL DEFAULT 0,
      DurationMs INT NOT NULL DEFAULT 0,
      StatusCode VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
      ErrorMessage TEXT NULL,
      ExecutedByUserID BIGINT NOT NULL DEFAULT 1,
      ExecutionStartDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      ExecutionEndDateTime DATETIME(6) NULL,
      CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      INDEX idx_exec_report (SavedReportID),
      INDEX idx_exec_schedule (ReportScheduleID),
      INDEX idx_exec_tenant (TenantID),
      INDEX idx_exec_user (ExecutedByUserID),
      INDEX idx_exec_date (ExecutionStartDateTime),
      CONSTRAINT fk_repexec_saved_report FOREIGN KEY (SavedReportID) REFERENCES SavedReport(SavedReportID) ON UPDATE CASCADE ON DELETE SET NULL,
      CONSTRAINT fk_repexec_schedule FOREIGN KEY (ReportScheduleID) REFERENCES ReportSchedule(ReportScheduleID) ON UPDATE CASCADE ON DELETE SET NULL,
      CONSTRAINT fk_repexec_user FOREIGN KEY (ExecutedByUserID) REFERENCES \`User\`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Performance Indexes on authoritative tables if not existing
  const safeAddIndex = async (tableName, indexName, columns) => {
    try {
      const idxs = await db.query(`SHOW INDEX FROM ${tableName} WHERE Key_name = ?`, [indexName]);
      if (idxs.length === 0) {
        await db.query(`CREATE INDEX ${indexName} ON ${tableName} (${columns})`);
        console.log(`Created index ${indexName} on ${tableName}`);
      }
    } catch (e) {
      console.warn(`Index note for ${tableName}.${indexName}:`, e.message);
    }
  };

  await safeAddIndex('IssueRequest', 'idx_ir_report_filter', 'TenantID, StatusCode, PriorityCode, CreatedDate');
  await safeAddIndex('IssueRequest', 'idx_ir_dept_date', 'AssignedDepartmentID, CreatedDate');
  await safeAddIndex('Assignment', 'idx_assign_report', 'AssignedUserID, AssignedTeamID, AssignmentStatusCode');
  await safeAddIndex('SLAClock', 'idx_slaclock_report', 'ClockStatus, IsResponseBreached, IsResolutionBreached');
  await safeAddIndex('AuditLog', 'idx_audit_report', 'TenantID, UserID, AuditDateTime');

  // 5. Seed default starter Saved Reports if table is empty
  const existingReports = await db.query(`SELECT COUNT(*) as cnt FROM SavedReport WHERE IsDeleted = 0`);
  if (existingReports[0]?.cnt === 0) {
    const starterReports = [
      {
        name: 'Executive KPI Summary',
        desc: 'Executive-level summary of campus issue volume, SLA breach rates, and resolution turnaround',
        type: 'EXECUTIVE_SUMMARY',
        visibility: 'BUSINESS_PARK',
        config: JSON.stringify({
          dateRange: '30D',
          metrics: ['total_volume', 'resolution_rate', 'sla_compliance', 'escalation_rate', 'avg_resolution_time'],
          groupBy: 'PriorityCode'
        })
      },
      {
        name: 'SLA Breach & Risk Watch',
        desc: 'Active SLA clocks near breach threshold and historical breach breakdown by priority and department',
        type: 'SLA_ANALYTICS',
        visibility: 'BUSINESS_PARK',
        config: JSON.stringify({
          dateRange: '7D',
          filters: { clockStatus: 'RUNNING' },
          sortBy: 'ResolutionDeadline',
          sortOrder: 'ASC'
        })
      },
      {
        name: 'Technician Workload Balance',
        desc: 'Operational dispatch report of active assignments, in-progress tasks, and average turnaround per technician',
        type: 'WORKLOAD_ANALYTICS',
        visibility: 'BUSINESS_PARK',
        config: JSON.stringify({
          dateRange: '30D',
          groupBy: 'AssignedUserID'
        })
      },
      {
        name: 'Tenant Space Incident Summary',
        desc: 'Comparative breakdown of service requests, maintenance costs, and resolution speed by tenant company',
        type: 'TENANT_ANALYTICS',
        visibility: 'BUSINESS_PARK',
        config: JSON.stringify({
          dateRange: '90D',
          groupBy: 'TenantID'
        })
      },
      {
        name: 'Campus Facility Outages & Incidents',
        desc: 'Critical and high priority incident log covering electrical, HVAC, water, and building infrastructure',
        type: 'REQUEST_ANALYTICS',
        visibility: 'BUSINESS_PARK',
        config: JSON.stringify({
          dateRange: '30D',
          filters: { priority: 'P1' }
        })
      }
    ];

    for (const r of starterReports) {
      await db.query(
        `INSERT INTO SavedReport (ReportName, Description, ReportTypeCode, ConfigJson, VisibilityCode, CreatedBy) VALUES (?, ?, ?, ?, ?, 1)`,
        [r.name, r.desc, r.type, r.config, r.visibility]
      );
    }
    console.log(`Seeded ${starterReports.length} starter saved reports`);
  }

  // 6. Seed sample starter Report Schedules
  const existingSchedules = await db.query(`SELECT COUNT(*) as cnt FROM ReportSchedule WHERE IsDeleted = 0`);
  if (existingSchedules[0]?.cnt === 0) {
    const starterSchedules = [
      {
        name: 'Weekly Executive Briefing',
        type: 'EXECUTIVE_SUMMARY',
        freq: 'WEEKLY',
        cron: '0 8 * * 1',
        format: 'PDF',
        recipients: JSON.stringify(['superadmin@businesspark.com', 'operations@businesspark.com'])
      },
      {
        name: 'Daily SLA Breach Digest',
        type: 'SLA_ANALYTICS',
        freq: 'DAILY',
        cron: '0 7 * * *',
        format: 'CSV',
        recipients: JSON.stringify(['dispatch@businesspark.com', 'sla-lead@businesspark.com'])
      },
      {
        name: 'Monthly Tenant Service Summary',
        type: 'TENANT_ANALYTICS',
        freq: 'MONTHLY',
        cron: '0 9 1 * *',
        format: 'EXCEL',
        recipients: JSON.stringify(['billing@businesspark.com', 'leasing@businesspark.com'])
      }
    ];

    for (const s of starterSchedules) {
      await db.query(
        `INSERT INTO ReportSchedule (ScheduleName, ReportTypeCode, FrequencyCode, CronExpression, ExportFormat, RecipientsJson, CreatedBy) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [s.name, s.type, s.freq, s.cron, s.format, s.recipients]
      );
    }
    console.log(`Seeded ${starterSchedules.length} starter report schedules`);
  }

  console.log('--- Analysis & Reporting tables initialization complete ---');
}

if (process.argv[1] && process.argv[1].includes('init-reporting-tables')) {
  initReportingTables().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

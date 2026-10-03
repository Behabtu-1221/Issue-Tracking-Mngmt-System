-- Add composite index for SLA Scheduler candidate polling
SET @dbname = DATABASE();
SET @tablename = 'IssueRequest';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_issue_sla_schedule') > 0,
  'SELECT 1',
  'CREATE INDEX idx_issue_sla_schedule ON IssueRequest (StatusCode, ResponseDueAt, ResolutionDueAt)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

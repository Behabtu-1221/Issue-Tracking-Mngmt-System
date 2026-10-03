-- Add explicit UTC SLA columns to IssueRequest if they do not already exist
SET @dbname = DATABASE();
SET @tablename = 'IssueRequest';

-- ResponseDueAt
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'ResponseDueAt') > 0,
  'SELECT 1',
  'ALTER TABLE IssueRequest ADD COLUMN ResponseDueAt DATETIME(6) NULL AFTER TargetResolutionDateTime'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ResolutionDueAt
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'ResolutionDueAt') > 0,
  'SELECT 1',
  'ALTER TABLE IssueRequest ADD COLUMN ResolutionDueAt DATETIME(6) NULL AFTER ResponseDueAt'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- SLAWarningSentAt
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'SLAWarningSentAt') > 0,
  'SELECT 1',
  'ALTER TABLE IssueRequest ADD COLUMN SLAWarningSentAt DATETIME(6) NULL AFTER ResolutionDueAt'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- SLAResponseBreachedAt
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'SLAResponseBreachedAt') > 0,
  'SELECT 1',
  'ALTER TABLE IssueRequest ADD COLUMN SLAResponseBreachedAt DATETIME(6) NULL AFTER SLAWarningSentAt'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- SLAResolutionBreachedAt
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'SLAResolutionBreachedAt') > 0,
  'SELECT 1',
  'ALTER TABLE IssueRequest ADD COLUMN SLAResolutionBreachedAt DATETIME(6) NULL AFTER SLAResponseBreachedAt'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

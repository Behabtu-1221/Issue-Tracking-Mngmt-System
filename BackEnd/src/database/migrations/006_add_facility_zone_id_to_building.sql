-- Add FacilityZoneID column to Building if it does not already exist
SET @dbname = DATABASE();
SET @tablename = 'Building';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'FacilityZoneID') > 0,
  'SELECT 1',
  'ALTER TABLE Building ADD COLUMN FacilityZoneID BIGINT NULL AFTER BusinessParkID'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index on FacilityZoneID
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_building_facility_zone') > 0,
  'SELECT 1',
  'CREATE INDEX idx_building_facility_zone ON Building (FacilityZoneID)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

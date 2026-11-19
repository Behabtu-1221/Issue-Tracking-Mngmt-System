import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { pool } from './connection.js';
import migrator from './migrator.js';
import logger from '../shared/utils/logger.js';
import { enforceSingleBusinessPark } from './seeders/enforce-single-business-park.js';
import { initServiceCategoryDepartmentMapping } from './seeders/init-category-mapping-table.js';
import { initFeedbackTable } from './seeders/init-feedback-table.js';
import { initReportingTables } from './seeders/init-reporting-tables.js';
import { seedEnterpriseRBAC } from './seeders/seed-permissions.js';
import { seedRolePermissions } from './seeders/seed-role-permissions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_SQL_PATH = path.resolve(__dirname, 'Database.sql');
const SEED_DATA_SQL_PATH = path.resolve(__dirname, 'SeedData.sql');
const BOOTSTRAP_LOCK = 'itms_schema_bootstrap_lock';

/**
 * Splits raw SQL script into executable statements, stripping comments
 * and database-creation / context-switching commands.
 */
function parseSqlStatements(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const clean = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  return clean
    .split(';')
    .map((s) => s.trim())
    .filter((s) => {
      if (s.length === 0) return false;
      const upper = s.toUpperCase().trim();
      if (upper.startsWith('CREATE DATABASE')) return false;
      if (upper.startsWith('USE ')) return false;
      return true;
    });
}

/**
 * Checks if a table exists in the current connected database.
 */
async function tableExists(tableName, connection) {
  const runner = connection || db;
  const [rows] = await runner.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [tableName]
  );
  return Boolean(rows && rows.length > 0);
}

/**
 * Checks if a column exists in a given table.
 */
async function columnExists(tableName, columnName, connection) {
  const runner = connection || db;
  const [rows] = await runner.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [tableName, columnName]
  );
  return Boolean(rows && rows.length > 0);
}

/**
 * Checks if an index exists on a given table.
 */
async function indexExists(tableName, indexName, connection) {
  const runner = connection || db;
  const [rows] = await runner.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [tableName, indexName]
  );
  return Boolean(rows && rows.length > 0);
}

/**
 * Auto-bootstraps master schema and baseline seeders on any environment (Render/Cloud/Docker/Local).
 */
export async function ensureBaseSchema() {
  const connection = await pool.getConnection();

  try {
    // Acquire distributed lock to prevent race conditions during multi-instance deployment
    try {
      const [lockRows] = await connection.query('SELECT GET_LOCK(?, 60) AS acquired', [BOOTSTRAP_LOCK]);
      if (lockRows && lockRows[0]?.acquired === 0) {
        logger.warn('[SchemaBootstrapper] Could not acquire bootstrap lock. Proceeding after timeout.');
      }
    } catch (lockErr) {
      logger.warn(`[SchemaBootstrapper] Advisory lock notice: ${lockErr.message}. Proceeding without lock.`);
    }

    // 1. Check if core tables exist
    const hasIssueRequest = await tableExists('IssueRequest', connection);
    const hasUser = await tableExists('User', connection);
    const hasServiceCategory = await tableExists('ServiceCategory', connection);

    if (!hasIssueRequest || !hasUser || !hasServiceCategory) {
      logger.info('📦 [BOOTSTRAP] Base tables missing. Initializing master schema from Database.sql...');
      const statements = parseSqlStatements(DATABASE_SQL_PATH);

      try {
        await connection.query('SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0');
      } catch (fkErr) {
        logger.warn(`[BOOTSTRAP] FOREIGN_KEY_CHECKS notice: ${fkErr.message}`);
      }
      try {
        await connection.query('SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0');
      } catch (ucErr) {
        logger.warn(`[BOOTSTRAP] UNIQUE_CHECKS notice: ${ucErr.message}`);
      }

      let executed = 0;
      for (const stmt of statements) {
        try {
          await connection.query(stmt);
          executed++;
        } catch (stmtErr) {
          logger.warn(`[BOOTSTRAP SQL NOTICE] ${stmtErr.message.slice(0, 120)}`);
        }
      }

      try {
        await connection.query('SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS');
        await connection.query('SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS');
      } catch (rstErr) {
        logger.warn(`[BOOTSTRAP] Reset checks notice: ${rstErr.message}`);
      }
      logger.info(`✓ [BOOTSTRAP] Executed ${executed} DDL statements. Master tables established.`);
    }

    // 2. Check if baseline seed accounts exist
    const userTableOk = await tableExists('User', connection);
    if (userTableOk) {
      const [userCountRows] = await connection.query('SELECT COUNT(*) as cnt FROM `User`');
      const userCount = userCountRows?.[0]?.cnt || 0;

      if (userCount === 0 && fs.existsSync(SEED_DATA_SQL_PATH)) {
        logger.info('🌱 [BOOTSTRAP] Database has 0 users. Seeding foundational accounts and master data...');
        const seedStatements = parseSqlStatements(SEED_DATA_SQL_PATH);

        try {
          await connection.query('SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0');
        } catch (fkErr) {
          logger.warn(`[BOOTSTRAP SEED] FOREIGN_KEY_CHECKS notice: ${fkErr.message}`);
        }
        try {
          await connection.query('SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0');
        } catch (ucErr) {
          logger.warn(`[BOOTSTRAP SEED] UNIQUE_CHECKS notice: ${ucErr.message}`);
        }

        let seedCount = 0;
        for (const stmt of seedStatements) {
          try {
            await connection.query(stmt);
            seedCount++;
          } catch (seedErr) {
            logger.warn(`[BOOTSTRAP SEED NOTICE] ${seedErr.message.slice(0, 120)}`);
          }
        }

        try {
          await connection.query('SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS');
          await connection.query('SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS');
        } catch (rstErr) {
          logger.warn(`[BOOTSTRAP SEED] Reset checks notice: ${rstErr.message}`);
        }
        logger.info(`✓ [BOOTSTRAP] Seeded foundational data (${seedCount} operations).`);
      }
    }

    // 3. Ensure SLA columns exist on IssueRequest (Defense-in-depth)
    if (await tableExists('IssueRequest', connection)) {
      const slaColumns = [
        { name: 'ResponseDueAt', type: 'DATETIME(6) NULL' },
        { name: 'ResolutionDueAt', type: 'DATETIME(6) NULL' },
        { name: 'SLAWarningSentAt', type: 'DATETIME(6) NULL' },
        { name: 'SLAResponseBreachedAt', type: 'DATETIME(6) NULL' },
        { name: 'SLAResolutionBreachedAt', type: 'DATETIME(6) NULL' }
      ];

      for (const col of slaColumns) {
        const exists = await columnExists('IssueRequest', col.name, connection);
        if (!exists) {
          try {
            await connection.query(`ALTER TABLE IssueRequest ADD COLUMN ${col.name} ${col.type}`);
            logger.info(`✓ [BOOTSTRAP] Added missing column IssueRequest.${col.name}`);
          } catch (err) {
            logger.warn(`[BOOTSTRAP] Column add notice for ${col.name}: ${err.message}`);
          }
        }
      }

      const hasSlaIdx = await indexExists('IssueRequest', 'idx_issue_sla_schedule', connection);
      if (!hasSlaIdx) {
        try {
          await connection.query(
            'CREATE INDEX idx_issue_sla_schedule ON IssueRequest (StatusCode, ResponseDueAt, ResolutionDueAt)'
          );
        } catch (idxErr) {
          // Ignore if exists
        }
      }
    }

    // 4. Ensure FacilityZoneID on Building
    if (await tableExists('Building', connection)) {
      const hasZoneCol = await columnExists('Building', 'FacilityZoneID', connection);
      if (!hasZoneCol) {
        try {
          await connection.query('ALTER TABLE Building ADD COLUMN FacilityZoneID BIGINT NULL AFTER BusinessParkID');
          logger.info('✓ [BOOTSTRAP] Added missing column Building.FacilityZoneID');
        } catch (err) {
          logger.warn(`[BOOTSTRAP] Column add notice for Building.FacilityZoneID: ${err.message}`);
        }
      }

      const hasZoneIdx = await indexExists('Building', 'idx_building_facility_zone', connection);
      if (!hasZoneIdx) {
        try {
          await connection.query('CREATE INDEX idx_building_facility_zone ON Building (FacilityZoneID)');
        } catch (idxErr) {
          // Ignore if exists
        }
      }
    }

    // 4.1 Ensure BusinessParkID, DepartmentID, Age, Gender on User
    if (await tableExists('User', connection)) {
      const userColumns = [
        { name: 'BusinessParkID', type: 'BIGINT NOT NULL DEFAULT 1', after: 'UserID' },
        { name: 'DepartmentID', type: 'BIGINT NULL', after: 'TenantID' },
        { name: 'Age', type: 'INT NULL', after: 'LastName' },
        { name: 'Gender', type: 'VARCHAR(20) NULL', after: 'Age' }
      ];

      for (const col of userColumns) {
        const exists = await columnExists('User', col.name, connection);
        if (!exists) {
          try {
            await connection.query(`ALTER TABLE \`User\` ADD COLUMN ${col.name} ${col.type} AFTER ${col.after}`);
            logger.info(`✓ [BOOTSTRAP] Added missing column User.${col.name}`);
          } catch (err) {
            logger.warn(`[BOOTSTRAP] Column add notice for User.${col.name}: ${err.message}`);
          }
        }
      }

      const hasUserDeptIdx = await indexExists('User', 'idx_user_department', connection);
      if (!hasUserDeptIdx) {
        try {
          await connection.query('CREATE INDEX idx_user_department ON `User` (DepartmentID)');
        } catch (idxErr) {
          // Ignore if exists
        }
      }

      const hasUserParkIdx = await indexExists('User', 'idx_user_park', connection);
      if (!hasUserParkIdx) {
        try {
          await connection.query('CREATE INDEX idx_user_park ON `User` (BusinessParkID)');
        } catch (idxErr) {
          // Ignore if exists
        }
      }
    }

    // 4.2 Ensure BusinessParkID on Role
    if (await tableExists('Role', connection)) {
      const hasRoleParkCol = await columnExists('Role', 'BusinessParkID', connection);
      if (!hasRoleParkCol) {
        try {
          await connection.query('ALTER TABLE `Role` ADD COLUMN BusinessParkID BIGINT NOT NULL DEFAULT 1 AFTER RoleID');
          logger.info('✓ [BOOTSTRAP] Added missing column Role.BusinessParkID');
        } catch (err) {
          logger.warn(`[BOOTSTRAP] Column add notice for Role.BusinessParkID: ${err.message}`);
        }
      }
    }

    // 4.3 Ensure BusinessParkID on OrganizationUnit, CostCenter, KnowledgeCategory, FAQ
    const parkScopedTables = [
      { table: 'OrganizationUnit', after: 'OrganizationUnitID' },
      { table: 'CostCenter', after: 'CostCenterID' },
      { table: 'KnowledgeCategory', after: 'KnowledgeCategoryID' },
      { table: 'FAQ', after: 'FAQID' }
    ];
    for (const item of parkScopedTables) {
      if (await tableExists(item.table, connection)) {
        const hasCol = await columnExists(item.table, 'BusinessParkID', connection);
        if (!hasCol) {
          try {
            await connection.query(`ALTER TABLE \`${item.table}\` ADD COLUMN BusinessParkID BIGINT NOT NULL DEFAULT 1 AFTER ${item.after}`);
            logger.info(`✓ [BOOTSTRAP] Added missing column ${item.table}.BusinessParkID`);
          } catch (err) {
            logger.warn(`[BOOTSTRAP] Column add notice for ${item.table}.BusinessParkID: ${err.message}`);
          }
        }
      }
    }

    // 4b. Ensure BusinessParkID on Department
    if (await tableExists('Department', connection)) {
      const hasDeptParkCol = await columnExists('Department', 'BusinessParkID', connection);
      if (!hasDeptParkCol) {
        try {
          await connection.query('ALTER TABLE Department ADD COLUMN BusinessParkID BIGINT NOT NULL DEFAULT 1 AFTER DepartmentID');
          logger.info('✓ [BOOTSTRAP] Added missing column Department.BusinessParkID');
        } catch (err) {
          logger.warn(`[BOOTSTRAP] Column add notice for Department.BusinessParkID: ${err.message}`);
        }
      }

      const hasDeptParkIdx = await indexExists('Department', 'idx_dept_park', connection);
      if (!hasDeptParkIdx) {
        try {
          await connection.query('CREATE INDEX idx_dept_park ON Department (BusinessParkID)');
        } catch (idxErr) {
          // Ignore if exists
        }
      }
    }

    // 4c. Ensure DepartmentID and BusinessParkID on ServiceCategory
    if (await tableExists('ServiceCategory', connection)) {
      const catCols = [
        { name: 'BusinessParkID', type: 'BIGINT NOT NULL DEFAULT 1', after: 'ServiceCategoryID' },
        { name: 'DepartmentID', type: 'BIGINT NULL', after: 'BusinessParkID' }
      ];

      for (const col of catCols) {
        const exists = await columnExists('ServiceCategory', col.name, connection);
        if (!exists) {
          try {
            await connection.query(`ALTER TABLE ServiceCategory ADD COLUMN ${col.name} ${col.type} AFTER ${col.after}`);
            logger.info(`✓ [BOOTSTRAP] Added missing column ServiceCategory.${col.name}`);
          } catch (err) {
            logger.warn(`[BOOTSTRAP] Column add notice for ServiceCategory.${col.name}: ${err.message}`);
          }
        }
      }

      const hasCatDeptIdx = await indexExists('ServiceCategory', 'idx_svccat_dept', connection);
      if (!hasCatDeptIdx) {
        try {
          await connection.query('CREATE INDEX idx_svccat_dept ON ServiceCategory (DepartmentID)');
        } catch (idxErr) {
          // Ignore if exists
        }
      }

      const hasCatParkIdx = await indexExists('ServiceCategory', 'idx_svccat_park', connection);
      if (!hasCatParkIdx) {
        try {
          await connection.query('CREATE INDEX idx_svccat_park ON ServiceCategory (BusinessParkID)');
        } catch (idxErr) {
          // Ignore if exists
        }
      }
    }

    // 5. Ensure outbox_events and idempotency_keys exist
    if (!(await tableExists('outbox_events', connection))) {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS outbox_events (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          aggregate_type VARCHAR(50) NOT NULL,
          aggregate_id BIGINT NOT NULL,
          event_type VARCHAR(100) NOT NULL,
          payload JSON NOT NULL,
          status ENUM('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'DEAD_LETTER') NOT NULL DEFAULT 'PENDING',
          retry_count INT NOT NULL DEFAULT 0,
          max_retries INT NOT NULL DEFAULT 5,
          created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          scheduled_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          processed_at TIMESTAMP(6) NULL,
          error_message TEXT NULL,
          INDEX idx_outbox_status_scheduled (status, scheduled_at),
          INDEX idx_outbox_aggregate (aggregate_type, aggregate_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    }

    if (!(await tableExists('idempotency_keys', connection))) {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS idempotency_keys (
          idempotency_key VARCHAR(128) NOT NULL,
          user_id BIGINT NOT NULL,
          request_hash VARCHAR(64) NOT NULL,
          response_status INT NOT NULL,
          response_body JSON NOT NULL,
          created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          expires_at TIMESTAMP(6) NOT NULL,
          PRIMARY KEY (idempotency_key, user_id),
          INDEX idx_idempotency_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    }

    // Release advisory lock before running seeders
    try {
      await connection.query('SELECT RELEASE_LOCK(?)', [BOOTSTRAP_LOCK]);
    } catch {
      // Ignored
    }
  } finally {
    connection.release();
  }

  // 6. Apply any pending incremental migrations via Migrator
  try {
    const headCheck = await migrator.checkHead();
    if (!headCheck.isAtHead) {
      logger.info(`Applying ${headCheck.pendingCount} pending schema migration(s)...`);
      await migrator.migrate();
    }
  } catch (migErr) {
    logger.warn(`Migration step notice: ${migErr.message}`);
  }

  // 7. Execute baseline invariant seeders in proper dependency order
  try {
    await enforceSingleBusinessPark();
  } catch (err) {
    logger.warn(`EnforceSingleBusinessPark notice: ${err.message}`);
  }

  try {
    await initServiceCategoryDepartmentMapping();
  } catch (err) {
    logger.warn(`InitServiceCategoryDepartmentMapping notice: ${err.message}`);
  }

  try {
    await initFeedbackTable();
  } catch (err) {
    logger.warn(`InitFeedbackTable notice: ${err.message}`);
  }

  try {
    await initReportingTables();
  } catch (err) {
    logger.warn(`InitReportingTables notice: ${err.message}`);
  }

  try {
    await seedEnterpriseRBAC();
  } catch (err) {
    logger.warn(`SeedEnterpriseRBAC notice: ${err.message}`);
  }

  try {
    await seedRolePermissions();
  } catch (err) {
    logger.warn(`SeedRolePermissions notice: ${err.message}`);
  }
}

export default { ensureBaseSchema };


import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db, { pool } from './connection.js';
import logger from '../shared/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
const LOCK_NAME = 'itms_db_migrator_lock';

/**
 * Robust, deterministic, forward-only SQL Migration Engine for MySQL.
 * Prevents concurrent runs via MySQL advisory locks.
 * Guarantees zero-tampering via SHA-256 checksum verification.
 */
class Migrator {
  async acquireLock(connection, timeoutSec = 15) {
    const [rows] = await connection.query('SELECT GET_LOCK(?, ?) AS acquired', [LOCK_NAME, timeoutSec]);
    if (!rows || rows[0].acquired !== 1) {
      throw new Error(`Failed to acquire migration lock '${LOCK_NAME}'. Another migration process may be running.`);
    }
  }

  async releaseLock(connection) {
    try {
      await connection.query('SELECT RELEASE_LOCK(?)', [LOCK_NAME]);
    } catch (err) {
      logger.warn(`Could not release migration lock: ${err.message}`);
    }
  }

  getMigrationFiles() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      return [];
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return files.map((file) => {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      const version = file.split('_')[0];
      const checksum = crypto.createHash('sha256').update(sqlContent.trim()).digest('hex');

      return {
        version,
        name: file,
        filePath,
        sqlContent,
        checksum
      };
    });
  }

  async ensureMigrationsTable(connection) {
    const initSql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
        checksum VARCHAR(64) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(initSql);
  }

  async getAppliedMigrations(connection) {
    await this.ensureMigrationsTable(connection);
    const [rows] = await connection.query(
      'SELECT version, name, applied_at, checksum FROM schema_migrations ORDER BY version ASC'
    );
    return rows || [];
  }

  /**
   * Run all pending migrations in order.
   */
  async migrate() {
    const connection = await pool.getConnection();
    try {
      await this.acquireLock(connection, 20);
      await this.ensureMigrationsTable(connection);

      const availableMigrations = this.getMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations(connection);
      const appliedMap = new Map(appliedMigrations.map((m) => [m.version, m]));

      // 1. Verify integrity of existing migrations
      for (const applied of appliedMigrations) {
        const matchingFile = availableMigrations.find((f) => f.version === applied.version);
        if (!matchingFile) {
          throw new Error(`[MIGRATION DRIFT] Applied migration ${applied.name} (${applied.version}) missing from disk!`);
        }
        if (matchingFile.checksum !== applied.checksum) {
          throw new Error(
            `[TAMPER DETECTED] Migration ${applied.name} checksum mismatch! Expected ${applied.checksum}, got ${matchingFile.checksum}. Migrations are immutable.`
          );
        }
      }

      // 2. Identify pending migrations
      const pendingMigrations = availableMigrations.filter((m) => !appliedMap.has(m.version));

      if (pendingMigrations.length === 0) {
        logger.info('Database schema is already at head. No pending migrations.');
        return { appliedCount: 0, pendingMigrations: [] };
      }

      logger.info(`Applying ${pendingMigrations.length} pending migration(s)...`);

      // 3. Apply each migration sequentially
      for (const migration of pendingMigrations) {
        logger.info(`Executing migration [${migration.version}]: ${migration.name}...`);

        // Strip comments and split statements cleanly
        const cleanSql = migration.sqlContent
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/--.*$/gm, '');

        const statements = cleanSql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const statement of statements) {
          await connection.query(statement);
        }

        // Record migration
        await connection.query(
          'INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)',
          [migration.version, migration.name, migration.checksum]
        );

        logger.info(`✓ Successfully applied: ${migration.name}`);
      }

      return { appliedCount: pendingMigrations.length, pendingMigrations };
    } finally {
      await this.releaseLock(connection);
      connection.release();
    }
  }

  /**
   * Return status of all migrations.
   */
  async status() {
    const connection = await pool.getConnection();
    try {
      await this.ensureMigrationsTable(connection);
      const availableMigrations = this.getMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations(connection);
      const appliedMap = new Map(appliedMigrations.map((m) => [m.version, m]));

      return availableMigrations.map((m) => {
        const applied = appliedMap.get(m.version);
        return {
          version: m.version,
          name: m.name,
          applied: Boolean(applied),
          appliedAt: applied ? applied.applied_at : null,
          checksum: m.checksum,
          checksumMatch: applied ? applied.checksum === m.checksum : null
        };
      });
    } finally {
      connection.release();
    }
  }

  /**
   * Verify if current database head matches latest migration on disk (for fail-fast boot).
   */
  async checkHead() {
    const connection = await pool.getConnection();
    try {
      await this.ensureMigrationsTable(connection);
      const available = this.getMigrationFiles();
      const applied = await this.getAppliedMigrations(connection);

      const latestAvailable = available[available.length - 1];
      const latestApplied = applied[applied.length - 1];

      const pendingCount = available.filter((a) => !applied.some((app) => app.version === a.version)).length;

      return {
        isAtHead: pendingCount === 0,
        pendingCount,
        latestAvailableVersion: latestAvailable?.version || null,
        latestAppliedVersion: latestApplied?.version || null
      };
    } finally {
      connection.release();
    }
  }
}

export const migrator = new Migrator();
export default migrator;

// CLI execution handler
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] || 'migrate';

  (async () => {
    try {
      if (command === 'migrate') {
        const res = await migrator.migrate();
        console.log(`\n🎉 Migrations complete. Applied: ${res.appliedCount}`);
        process.exit(0);
      } else if (command === 'status') {
        const statuses = await migrator.status();
        console.table(statuses.map((s) => ({
          Version: s.version,
          Name: s.name,
          Applied: s.applied ? 'YES' : 'PENDING',
          AppliedAt: s.appliedAt || '-',
          Integrity: s.checksumMatch === false ? 'TAMPERED' : 'OK'
        })));
        process.exit(0);
      } else if (command === 'check') {
        const head = await migrator.checkHead();
        if (!head.isAtHead) {
          console.error(`❌ Migration check failed: ${head.pendingCount} pending migration(s).`);
          process.exit(1);
        }
        console.log(`✓ Migration check passed. Head version: ${head.latestAppliedVersion}`);
        process.exit(0);
      } else {
        console.error(`Unknown command "${command}". Available: migrate, status, check`);
        process.exit(1);
      }
    } catch (err) {
      console.error('\n❌ Migration failed:', err.message);
      process.exit(1);
    } finally {
      await pool.end();
    }
  })();
}

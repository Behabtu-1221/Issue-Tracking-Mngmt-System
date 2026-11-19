import app from './app.js';
import env from './config/env.js';
import { pool } from './database/connection.js';
import migrator from './database/migrator.js';
import { appLifecycle } from './shared/routes/health.routes.js';
import outboxWorker from './shared/outbox/outbox-worker.js';
import slaScheduler from './modules/sla/services/sla-scheduler.js';
import logger from './shared/utils/logger.js';
import { ensureBaseSchema } from './database/schema-bootstrapper.js';

const PORT = env.PORT;

const startServer = async () => {
  try {
    logger.info('Starting Enterprise ITMS backend server...');

    // 1. Verify Database Connectivity (Fail-fast)
    try {
      await pool.query('SELECT 1');
      logger.info('✓ Database connection verified.');
    } catch (dbErr) {
      logger.error(`[FATAL] Database connection failed: ${dbErr.message}`);
      process.exit(1);
    }

    // 2. Auto-bootstrap Database Master Schema, Tables, Seeds & Migrations
    try {
      await ensureBaseSchema();
      logger.info('✓ Database master schema, seed data, and invariant seeders verified.');
    } catch (schemaErr) {
      logger.error(`[FATAL] Database auto-bootstrap failed: ${schemaErr.message}`);
      process.exit(1);
    }

    // 3. Verify Schema Migrations at Head (Fail-fast)
    try {
      const headCheck = await migrator.checkHead();
      if (!headCheck.isAtHead) {
        logger.warn(`Pending migrations detected (${headCheck.pendingCount}). Applying pending migrations...`);
        await migrator.migrate();
      }
      const finalHead = await migrator.checkHead();
      logger.info(`✓ Database migrations verified at head version: ${finalHead.latestAppliedVersion}`);
    } catch (migErr) {
      logger.error(`[FATAL] Migration head verification failed: ${migErr.message}`);
      process.exit(1);
    }

    // 4. Start Background Workers
    outboxWorker.start(5000);
    slaScheduler.start(30000);

    // 5. Mark system as ready for traffic
    appLifecycle.isReady = true;

    // 6. Bind HTTP listener
    const HOST = env.HOST || '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT} (host: ${HOST})`);
    });

    // 7. Register Graceful Shutdown Handlers (SIGTERM / SIGINT)
    const gracefulShutdown = async (signal) => {
      logger.info(`\nReceived ${signal}. Initiating graceful shutdown...`);
      appLifecycle.isShuttingDown = true;
      appLifecycle.isReady = false;

      // Stop accepting new connections
      server.close(() => {
        logger.info('✓ HTTP server closed. Inbound traffic stopped.');
      });

      // Safety timeout to avoid hanging indefinitely
      const timeoutHandle = setTimeout(() => {
        logger.error('Graceful shutdown timeout exceeded (10s). Forcing termination.');
        process.exit(1);
      }, 10000);
      timeoutHandle.unref();

      try {
        // Stop background processors
        await Promise.all([
          outboxWorker.stop(),
          slaScheduler.stop()
        ]);
        logger.info('✓ Background workers stopped.');

        // Drain DB connection pool
        await pool.end();
        logger.info('✓ Database connection pool closed.');

        logger.info('Shutdown complete. Clean exit.');
        process.exit(0);
      } catch (shutdownErr) {
        logger.error(`Error during shutdown cleanup: ${shutdownErr.message}`);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (startupErr) {
    logger.error(`[FATAL] Unexpected startup failure: ${startupErr.message}`);
    process.exit(1);
  }
};

startServer();

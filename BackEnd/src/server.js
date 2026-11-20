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
  const HOST = env.HOST || '0.0.0.0';
  let server;

  try {
    logger.info('Starting Enterprise ITMS backend server...');

    // 1. Immediately bind HTTP listener so Render/PaaS platforms detect the open port and pass health checks
    server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server listening on port ${PORT} (host: ${HOST}) [Initializing dependencies...]`);
    });

    // 2. Register Graceful Shutdown Handlers (SIGTERM / SIGINT)
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

    // 3. Verify Database Connectivity (with timeout)
    try {
      await pool.query('SELECT 1');
      logger.info('✓ Database connection verified.');
    } catch (dbErr) {
      logger.error(`[FATAL] Database connection failed: ${dbErr.message}`);
      appLifecycle.initError = `Database connection failed: ${dbErr.message}`;
      return server;
    }

    // 4. Auto-bootstrap Database Master Schema, Tables, Seeds & Migrations
    try {
      await ensureBaseSchema();
      logger.info('✓ Database master schema, seed data, and invariant seeders verified.');
    } catch (schemaErr) {
      logger.error(`[FATAL] Database auto-bootstrap failed: ${schemaErr.message}`);
      appLifecycle.initError = `Database schema bootstrap failed: ${schemaErr.message}`;
      return server;
    }

    // 5. Verify Schema Migrations at Head
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
      appLifecycle.initError = `Migration head verification failed: ${migErr.message}`;
      return server;
    }

    // 6. Start Background Workers
    outboxWorker.start(5000);
    slaScheduler.start(30000);

    // 7. Mark system as ready for traffic
    appLifecycle.isReady = true;
    logger.info(`🚀 Enterprise ITMS server initialized and accepting production traffic on port ${PORT}`);

    return server;
  } catch (startupErr) {
    logger.error(`[FATAL] Unexpected startup failure: ${startupErr.message}`);
    appLifecycle.initError = startupErr.message;
  }
};

startServer();

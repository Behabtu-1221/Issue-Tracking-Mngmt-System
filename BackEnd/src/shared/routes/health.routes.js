import { Router } from 'express';
import { pool } from '../../database/connection.js';
import migrator from '../../database/migrator.js';

export const appLifecycle = {
  isShuttingDown: false,
  isReady: false
};

const router = Router();

/**
 * Liveness probe (/health/live)
 * Checks if the Node process is running and event loop is responsive.
 */
router.get('/live', (req, res) => {
  if (appLifecycle.isShuttingDown) {
    return res.status(503).json({ status: 'DOWN', reason: 'Shutting down' });
  }
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

/**
 * Readiness probe (/health/ready)
 * Verifies that DB connection is responsive and migrations are at head.
 * In production K8s/Docker, traffic is only routed if this returns 200.
 */
router.get('/ready', async (req, res) => {
  if (appLifecycle.isShuttingDown) {
    return res.status(503).json({
      status: 'DOWN',
      reason: 'Server is shutting down'
    });
  }

  if (!appLifecycle.isReady) {
    return res.status(503).json({
      status: 'DOWN',
      reason: 'Server initialization in progress'
    });
  }

  try {
    // 1. Verify database ping
    await pool.query('SELECT 1');

    // 2. Verify migration head
    const headCheck = await migrator.checkHead();
    if (!headCheck.isAtHead) {
      return res.status(503).json({
        status: 'DOWN',
        database: 'CONNECTED',
        migrations: 'DRIFT_DETECTED',
        pendingCount: headCheck.pendingCount,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      migrations: 'AT_HEAD',
      headVersion: headCheck.latestAppliedVersion,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Comprehensive health status (/health)
 */
router.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const head = await migrator.checkHead();
    res.status(200).json({
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      database: 'CONNECTED',
      migrations: head.isAtHead ? 'AT_HEAD' : `${head.pendingCount} PENDING`,
      headVersion: head.latestAppliedVersion,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'DEGRADED',
      database: 'DISCONNECTED',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

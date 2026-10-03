import crypto from 'crypto';
import { query } from '../../database/connection.js';
import logger from '../utils/logger.js';

/**
 * Idempotency Middleware for mutating HTTP requests (POST, PUT, PATCH).
 * Protects against duplicate network retries, double billing, duplicate approvals, etc.
 *
 * @param {Object} options
 * @param {number} options.ttlSeconds - Cache TTL in seconds (default: 86400 / 24 hours)
 * @param {boolean} options.required - If true, rejects requests without Idempotency-Key (default: false)
 */
export const idempotency = (options = {}) => {
  const ttlSeconds = options.ttlSeconds || 86400;
  const isRequired = options.required || false;

  return async (req, res, next) => {
    // Only apply to mutating requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      if (isRequired) {
        return res.status(400).json({
          status: 'fail',
          message: 'Idempotency-Key header is required for this operation.'
        });
      }
      return next();
    }

    // Sanitize idempotency key
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid Idempotency-Key. Must be between 8 and 128 characters.'
      });
    }

    const userId = req.user?.UserID || req.user?.id || 0;

    // Compute request fingerprint (method + path + sorted body)
    const normalizedBody = req.body ? JSON.stringify(req.body, Object.keys(req.body).sort()) : '';
    const requestFingerprint = crypto
      .createHash('sha256')
      .update(`${req.method}:${req.baseUrl || ''}${req.path}:${normalizedBody}`)
      .digest('hex');

    try {
      // 1. Check existing record
      const [existing] = await query(
        `SELECT idempotency_key, user_id, request_hash, response_status, response_body, expires_at
         FROM idempotency_keys
         WHERE idempotency_key = ? AND user_id = ? AND expires_at > CURRENT_TIMESTAMP(6)`,
        [idempotencyKey, userId]
      );

      if (existing) {
        // Check payload match
        if (existing.request_hash !== requestFingerprint) {
          logger.warn(`[Idempotency] Key conflict: '${idempotencyKey}' reused with differing payload/path.`);
          return res.status(409).json({
            status: 'fail',
            message: 'Idempotency-Key was already used with a different request payload or target endpoint.'
          });
        }

        // Exact match replay: return cached response
        logger.info(`[Idempotency] Replaying cached response for key '${idempotencyKey}' (User: ${userId})`);
        res.setHeader('X-Cache-Lookup', 'HIT-IDEMPOTENT');
        res.setHeader('Idempotency-Key', idempotencyKey);

        const body = typeof existing.response_body === 'string'
          ? JSON.parse(existing.response_body)
          : existing.response_body;

        return res.status(existing.response_status).json(body);
      }

      // 2. Intercept response to record upon completion
      const originalSend = res.send;
      let recorded = false;

      res.send = function (data) {
        // Restore originalSend immediately to prevent recursive loop
        res.send = originalSend;

        // Only store successful or client-side responses (do not cache 5xx server failures)
        if (!recorded && res.statusCode < 500) {
          recorded = true;
          try {
            let parsedBody = null;
            if (typeof data === 'string') {
              try {
                parsedBody = JSON.parse(data);
              } catch {
                parsedBody = { raw: data };
              }
            } else if (data && typeof data === 'object') {
              parsedBody = data;
            }

            if (parsedBody) {
              // Asynchronously record into idempotency_keys
              query(
                `INSERT INTO idempotency_keys 
                  (idempotency_key, user_id, request_hash, response_status, response_body, expires_at)
                 VALUES 
                  (?, ?, ?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL ? SECOND))
                 ON DUPLICATE KEY UPDATE
                  request_hash = VALUES(request_hash),
                  response_status = VALUES(response_status),
                  response_body = VALUES(response_body),
                  expires_at = VALUES(expires_at)`,
                [
                  idempotencyKey,
                  userId,
                  requestFingerprint,
                  res.statusCode,
                  JSON.stringify(parsedBody),
                  ttlSeconds
                ]
              ).catch((saveErr) => {
                logger.error(`[Idempotency] Failed to store idempotency record: ${saveErr.message}`);
              });
            }
          } catch (err) {
            logger.error(`[Idempotency] Error capturing response body: ${err.message}`);
          }
        }

        res.setHeader('Idempotency-Key', idempotencyKey);
        return originalSend.call(this, data);
      };

      next();
    } catch (err) {
      logger.error(`[Idempotency] Middleware error: ${err.message}`);
      next(err);
    }
  };
};

export default idempotency;

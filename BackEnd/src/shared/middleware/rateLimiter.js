import rateLimit from 'express-rate-limit';
import env from '../../config/env.js';

/**
 * Standard 429 response handler providing Retry-After header and uniform JSON error payload.
 */
const createLimitHandler = (customMessage) => (req, res, next, options) => {
  const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
  res.setHeader('Retry-After', retryAfterSeconds);
  res.status(options.statusCode).json({
    status: 'fail',
    message: customMessage || 'Too many requests from this IP, please try again later.',
    retryAfter: retryAfterSeconds
  });
};

const isBypass = (req) =>
  env.isTest ||
  req.headers['x-bypass-rate-limit'] === 'test-suite-bypass' ||
  (env.NODE_ENV === 'development' && process.env.STRICT_RATE_LIMIT !== 'true');

/**
 * Global API Rate Limiter
 * Default: 100 requests per minute per IP
 */
export const globalLimiter = rateLimit({
  windowMs: env.rateLimit.globalWindowMs,
  max: env.rateLimit.globalMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many requests from this IP, please try again later.'),
  skip: (req) => isBypass(req)
});

/**
 * Sensitive Endpoint Limiter: Login & Authentication
 * Default: 5 requests per minute per IP
 */
export const loginLimiter = rateLimit({
  windowMs: env.rateLimit.authWindowMs,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many login attempts. Please wait before retrying.'),
  skip: (req) => isBypass(req)
});

/**
 * Sensitive Endpoint Limiter: Password Reset Requests
 * Default: 3 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: env.rateLimit.passwordResetWindowMs,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many password reset requests. Please check your inbox or wait before retrying.'),
  skip: (req) => isBypass(req)
});

/**
 * Sensitive Endpoint Limiter: Token Refresh
 * Default: 10 requests per minute per IP
 */
export const tokenRefreshLimiter = rateLimit({
  windowMs: env.rateLimit.authWindowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many token refresh attempts. Please re-authenticate.'),
  skip: (req) => isBypass(req)
});

export default {
  globalLimiter,
  loginLimiter,
  passwordResetLimiter,
  tokenRefreshLimiter
};

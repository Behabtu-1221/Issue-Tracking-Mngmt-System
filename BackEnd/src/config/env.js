import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from BackEnd root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// Fail-fast validation helper
const requireEnv = (key, fallback = undefined) => {
  const val = process.env[key] || fallback;
  if (!val && !isTest) {
    throw new Error(`[FATAL] Missing required environment variable: "${key}". The application cannot start without it.`);
  }
  return val;
};

// Validate secrets are cryptographically adequate
const validateSecret = (key, val) => {
  if (isTest) return val || 'test-secret-at-least-32-characters-long-for-testing';
  const INSECURE_DEFAULTS = [
    'dev-access-secret',
    'dev-refresh-secret',
    'secret-key-12345',
    'dev_secret_key',
    'password',
    'secret'
  ];
  if (INSECURE_DEFAULTS.includes(val)) {
    if (isProd) {
      throw new Error(`[FATAL] Insecure default secret detected in production for "${key}". You must set a cryptographically secure random value.`);
    }
  }
  return val;
};

export const env = {
  NODE_ENV,
  isProd,
  isTest,
  PORT: parseInt(process.env.PORT || '5000', 10),

  // Database Configuration
  db: {
    host: requireEnv('DB_HOST', 'localhost'),
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: requireEnv('DB_USER', 'root'),
    password: process.env.DB_PASSWORD || '',
    database: requireEnv('DB_NAME', 'issue_tracking_system'),
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10)
  },

  // JWT & Cryptographic Security
  jwt: {
    secret: validateSecret('JWT_SECRET', requireEnv('JWT_SECRET', isProd ? undefined : 'dev-jwt-secret-minimum-32-chars-long-local-only')),
    refreshSecret: validateSecret('JWT_REFRESH_SECRET', requireEnv('JWT_REFRESH_SECRET', isProd ? undefined : 'dev-jwt-refresh-secret-min-32-chars-local-only')),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // CORS & Client Configuration
  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
  },

  // Rate Limiting
  rateLimit: {
    globalWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    globalMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per minute
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10), // 10 login/refresh attempts per minute
    passwordResetWindowMs: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
    passwordResetMax: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || '5', 10) // 5 reset requests per hour
  },

  // Email / SMTP
  smtp: {
    service: process.env.SMTP_SERVICE || '',
    host: process.env.SMTP_HOST || (process.env.SMTP_SERVICE === 'gmail' ? 'smtp.gmail.com' : ''),
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: (process.env.SMTP_PASS || '').replace(/\s/g, ''),
    secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    from: process.env.SMTP_FROM || '"Enterprise ITMS" <noreply@enterprise.com>'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

export default env;

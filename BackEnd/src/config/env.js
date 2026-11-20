import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Joi from 'joi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from BackEnd root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(5000),
  HOST: Joi.string().default('0.0.0.0'),

  // Database
  DB_HOST: Joi.string().required().description('MySQL Database Hostname'),
  DB_PORT: Joi.number().port().default(3306),
  DB_USER: Joi.string().required().description('MySQL Database Username'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().required().description('MySQL Database Name'),
  DB_CONNECTION_LIMIT: Joi.number().min(1).max(100).default(10),
  DB_SSL: Joi.string().valid('true', 'false', 'require', 'disable', '1', '0').optional().allow(''),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.string().valid('true', 'false', '1', '0').optional().allow(''),

  // JWT Security
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET must be at least 32 characters long for cryptographic security.'
  }),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters long for cryptographic security.'
  }),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // CORS & Client
  CORS_ALLOWED_ORIGINS: Joi.string().optional(),
  CLIENT_URL: Joi.string().default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  AUTH_RATE_LIMIT_MAX: Joi.number().default(10),
  PASSWORD_RESET_RATE_LIMIT_WINDOW_MS: Joi.number().default(3600000),
  PASSWORD_RESET_RATE_LIMIT_MAX: Joi.number().default(5),

  // SMTP Email Dispatcher
  SMTP_SERVICE: Joi.string().allow('').optional(),
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  SMTP_SECURE: Joi.string().valid('true', 'false').default('false'),
  SMTP_FROM: Joi.string().default('"Enterprise ITMS" <noreply@enterprise.com>'),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info')
}).unknown(true); // Allow other OS environment variables

const { error, value: validatedEnv } = envSchema.validate(process.env, {
  abortEarly: false
});

if (error) {
  const errorDetails = error.details.map((d) => `  • ${d.message}`).join('\n');
  console.error(`\n❌ [CONFIGURATION FATAL] Environment validation failed with ${error.details.length} error(s):\n${errorDetails}\n`);
  // In test environment, throw error rather than exit
  if (process.env.NODE_ENV === 'test') {
    throw new Error(`Environment validation failed:\n${errorDetails}`);
  }
  process.exit(1);
}

const isProd = validatedEnv.NODE_ENV === 'production';
const isTest = validatedEnv.NODE_ENV === 'test';

export const env = {
  NODE_ENV: validatedEnv.NODE_ENV,
  isProd,
  isTest,
  PORT: validatedEnv.PORT,
  HOST: validatedEnv.HOST,

  // Database Configuration
  db: (() => {
    const isCloudHost = Boolean(
      validatedEnv.DB_HOST && (
        validatedEnv.DB_HOST.includes('tidbcloud.com') ||
        validatedEnv.DB_HOST.includes('aivencloud.com') ||
        validatedEnv.DB_HOST.includes('planetscale.com') ||
        validatedEnv.DB_HOST.includes('psdb.cloud') ||
        validatedEnv.DB_HOST.includes('rds.amazonaws.com') ||
        validatedEnv.DB_HOST.includes('clever-cloud.com') ||
        validatedEnv.DB_HOST.includes('render.com')
      )
    );

    const isLocalHost = Boolean(
      !validatedEnv.DB_HOST ||
      validatedEnv.DB_HOST === 'localhost' ||
      validatedEnv.DB_HOST === '127.0.0.1' ||
      validatedEnv.DB_HOST === 'mysql'
    );

    const shouldEnableSsl =
      validatedEnv.DB_SSL === 'true' ||
      validatedEnv.DB_SSL === 'require' ||
      validatedEnv.DB_SSL === '1' ||
      (validatedEnv.DB_SSL !== 'false' && validatedEnv.DB_SSL !== 'disable' && validatedEnv.DB_SSL !== '0' && (
        isCloudHost || (validatedEnv.NODE_ENV === 'production' && !isLocalHost)
      ));

    const rejectUnauthorized =
      validatedEnv.DB_SSL_REJECT_UNAUTHORIZED === 'true' ||
      validatedEnv.DB_SSL_REJECT_UNAUTHORIZED === '1';

    let host = (validatedEnv.DB_HOST || '').trim().replace(/\.+$/, '');
    let port = validatedEnv.DB_PORT;
    let user = validatedEnv.DB_USER;
    let password = validatedEnv.DB_PASSWORD;
    let database = validatedEnv.DB_NAME;

    // Handle full connection URI pasted into DB_HOST (e.g. mysql://avnadmin:pass@host:port/dbname)
    if (host.includes('://')) {
      try {
        const parsed = new URL(host);
        host = parsed.hostname;
        if (parsed.port) port = Number(parsed.port);
        if (parsed.username) user = decodeURIComponent(parsed.username);
        if (parsed.password) password = decodeURIComponent(parsed.password);
        if (parsed.pathname && parsed.pathname.length > 1) {
          database = parsed.pathname.slice(1).split('?')[0];
        }
      } catch {
        // Fall back to raw host
      }
    }

    // Auto-detect TiDB Cloud default port (4000) if user left it as default 3306 or unset
    if ((!process.env.DB_PORT || String(process.env.DB_PORT).trim() === '3306') && host.includes('tidbcloud.com')) {
      port = 4000;
    }

    return {
      host,
      port,
      user,
      password,
      database,
      connectionLimit: validatedEnv.DB_CONNECTION_LIMIT,
      ssl: shouldEnableSsl ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized
      } : undefined
    };
  })(),

  // JWT & Cryptographic Security
  jwt: {
    secret: validatedEnv.JWT_SECRET,
    refreshSecret: validatedEnv.JWT_REFRESH_SECRET,
    expiresIn: validatedEnv.JWT_EXPIRES_IN,
    refreshExpiresIn: validatedEnv.JWT_REFRESH_EXPIRES_IN
  },

  // CORS & Client Configuration
  cors: {
    allowedOrigins: (validatedEnv.CORS_ALLOWED_ORIGINS || validatedEnv.CLIENT_URL)
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    clientUrl: validatedEnv.CLIENT_URL
  },

  // Rate Limiting
  rateLimit: {
    globalWindowMs: validatedEnv.RATE_LIMIT_WINDOW_MS,
    globalMax: validatedEnv.RATE_LIMIT_MAX,
    authWindowMs: validatedEnv.AUTH_RATE_LIMIT_WINDOW_MS,
    authMax: validatedEnv.AUTH_RATE_LIMIT_MAX,
    passwordResetWindowMs: validatedEnv.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
    passwordResetMax: validatedEnv.PASSWORD_RESET_RATE_LIMIT_MAX
  },

  // Email / SMTP
  smtp: {
    service: validatedEnv.SMTP_SERVICE,
    host: validatedEnv.SMTP_HOST || (validatedEnv.SMTP_SERVICE === 'gmail' ? 'smtp.gmail.com' : ''),
    port: validatedEnv.SMTP_PORT,
    user: validatedEnv.SMTP_USER,
    pass: (validatedEnv.SMTP_PASS || '').replace(/\s/g, ''),
    secure: validatedEnv.SMTP_SECURE === 'true' || validatedEnv.SMTP_PORT === 465,
    from: validatedEnv.SMTP_FROM
  },

  // Logging
  logging: {
    level: validatedEnv.LOG_LEVEL
  }
};

export default env;

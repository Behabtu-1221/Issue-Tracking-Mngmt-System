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
  db: {
    host: validatedEnv.DB_HOST,
    port: validatedEnv.DB_PORT,
    user: validatedEnv.DB_USER,
    password: validatedEnv.DB_PASSWORD,
    database: validatedEnv.DB_NAME,
    connectionLimit: validatedEnv.DB_CONNECTION_LIMIT
  },

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

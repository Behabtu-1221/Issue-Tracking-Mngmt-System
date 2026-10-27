import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import logger from './shared/utils/logger.js';
import errorHandler from './shared/middleware/errorHandler.js';
import attachActor from './shared/middleware/attachActor.js';
import globalAuth from './shared/middleware/globalAuth.js';
import dataScope from './shared/middleware/dataScope.js';
import AppError from './shared/errors/AppError.js';
import configurationModule from './modules/configuration-management/index.js';
import identityModule from './modules/identity-access/index.js';
import businessParkModule from './modules/business-park/index.js';
import tenantModule from './modules/tenant/index.js';
import organizationModule from './modules/organization/index.js';
import serviceCatalogModule from './modules/service-catalog/index.js';
import issueManagementModule from './modules/issue-management/index.js';
import approvalModule from './modules/approval/index.js';
import dispatchModule from './modules/dispatch/index.js';
import slaModule from './modules/sla/index.js';
import communicationModule from './modules/communication/index.js';
import notificationModule from './modules/notification/index.js';
import fileDocumentModule from './modules/file-document/index.js';
import reportingModule from './modules/reporting/index.js';

dotenv.config();

import env from './config/env.js';
import { globalLimiter } from './shared/middleware/rateLimiter.js';

const app = express();

// Trust reverse proxy for real client IP evaluation
app.set('trust proxy', 1);

app.use(helmet());

// Enhanced CORS: Normalize origins (strip trailing slashes), support wildcards, and allow private network in dev
const rawAllowedOrigins = env.cors.allowedOrigins || [];
const allowedOrigins = rawAllowedOrigins.map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);
if (env.cors.clientUrl) {
  const normalizedClient = env.cors.clientUrl.trim().replace(/\/+$/, '');
  if (!allowedOrigins.includes(normalizedClient)) {
    allowedOrigins.push(normalizedClient);
  }
}
const isDev = env.NODE_ENV === 'development';
const localNetworkPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.trim().replace(/\/+$/, '');

    // Allow wildcard '*' or exact match in configured allowed origins
    if (allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Support wildcard subdomains, e.g. '*.vercel.app' or '*.onrender.com'
    const matchesWildcard = allowedOrigins.some((allowed) => {
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return normalizedOrigin.endsWith(domain) || normalizedOrigin.endsWith('.' + domain);
      }
      return false;
    });
    if (matchesWildcard) {
      return callback(null, true);
    }

    if (isDev && localNetworkPattern.test(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new AppError(`Origin "${origin}" is not permitted by CORS policy.`, 403));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Idempotency-Key', 'Cache-Control', 'Pragma'],
  credentials: false,
  maxAge: 86400
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure req.body is always initialized to an object for mutation requests (POST/PUT/PATCH)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && (req.body === undefined || req.body === null)) {
    req.body = {};
  }
  next();
});

const morganFormat = env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  stream: { write: (message) => logger.info(message.trim()) }
}));

import healthRouter from './shared/routes/health.routes.js';
import idempotency from './shared/middleware/idempotency.js';

app.use(globalLimiter);
app.use(attachActor);
app.use(globalAuth);
app.use(dataScope);
app.use(idempotency());

app.use('/health', healthRouter);
app.use('/api/health', healthRouter);

const modules = [
  configurationModule,
  identityModule,
  businessParkModule,
  tenantModule,
  organizationModule,
  serviceCatalogModule,
  issueManagementModule,
  approvalModule,
  dispatchModule,
  slaModule,
  communicationModule,
  notificationModule,
  fileDocumentModule,
  reportingModule
];

modules.forEach((module) => {
  app.use(module.basePath, module.router);
  logger.info(`Registered module: ${module.name} at ${module.basePath}`);
});

app.use('/api/audit-logs', (req, res, next) => {
  req.url = '/audit-logs' + (req.url === '/' ? '' : req.url);
  identityModule.router(req, res, next);
});

// Dual-route support: Forward /auth directly to identityModule so both /api/auth and /auth paths are resolved
app.use('/auth', (req, res, next) => {
  req.url = '/auth' + (req.url === '/' ? '' : req.url);
  identityModule.router(req, res, next);
});

app.all(/(.*)/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

export { modules };
export default app;

import authenticate from './authenticate.js';

/**
 * Explicit Public Route Allowlist
 * Secure by default: Every route requires authentication UNLESS explicitly declared here.
 * Supports both /api/auth/... and /auth/... patterns to accommodate reverse proxies.
 */
export const PUBLIC_ROUTES = [
  { method: 'GET', pattern: /^(\/api)?\/health(\/(live|ready))?\/?$/i },
  { method: 'POST', pattern: /^(\/api)?\/auth\/login\/?$/i },
  { method: 'POST', pattern: /^(\/api)?\/auth\/refresh\/?$/i },
  { method: 'POST', pattern: /^(\/api)?\/auth\/refresh-token\/?$/i },
  { method: 'POST', pattern: /^(\/api)?\/auth\/forgot-password\/?$/i },
  { method: 'POST', pattern: /^(\/api)?\/auth\/reset-password\/?$/i },
  { method: 'GET', pattern: /^(\/api)?\/documents\/share\/[^/]+\/?$/i }
];

/**
 * Checks if the request method and path match the explicit allowlist.
 */
export const isPublicRoute = (method, path) => {
  if (!path) return false;
  const normalizedMethod = (method || '').toUpperCase();
  const normalizedPath = (path || '').split('?')[0];
  return PUBLIC_ROUTES.some(
    (route) => route.method === normalizedMethod && route.pattern.test(normalizedPath)
  );
};

/**
 * Global Authentication Guard
 * Enforces mandatory authentication globally across all routes by default.
 * Handles CORS preflight OPTIONS requests and proxy URL normalizations.
 */
export const globalAuth = async (req, res, next) => {
  // Always permit CORS preflight OPTIONS requests without requiring authentication
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Check both req.path and req.originalUrl (handles reverse proxy rewrites, trailing slashes, prefixes)
  if (isPublicRoute(req.method, req.path) || isPublicRoute(req.method, req.originalUrl)) {
    return next();
  }

  return authenticate(req, res, next);
};

export default globalAuth;

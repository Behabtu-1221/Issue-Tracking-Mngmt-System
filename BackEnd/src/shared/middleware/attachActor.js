import { verifyAccessToken } from '../utils/token.js';

/**
 * attachActor Middleware
 * Identity must come ONLY from a verified authentication token.
 * Client-supplied headers (like x-user-id), body fields, and default/anonymous fallbacks are strictly prohibited.
 */
const attachActor = (req, res, next) => {
  req.actor = null;
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7).trim();
    if (rawToken) {
      try {
        const decoded = verifyAccessToken(rawToken);
        if (decoded && decoded.userId) {
          req.actor = {
            userId: decoded.userId,
            userAccountId: decoded.userAccountId,
            tenantId: decoded.tenantId,
            username: decoded.username,
            userTypeCode: decoded.userTypeCode,
            sessionId: decoded.sessionId
          };
        }
      } catch {
        // Token invalid or expired — leave req.actor null.
      }
    }
  }

  next();
};

export default attachActor;

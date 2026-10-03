import { verifyAccessToken } from '../utils/token.js';

const attachActor = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = verifyAccessToken(authHeader.slice(7));
      req.actor = {
        userId: decoded.userId,
        userAccountId: decoded.userAccountId,
        tenantId: decoded.tenantId,
        username: decoded.username,
        userTypeCode: decoded.userTypeCode,
        sessionId: decoded.sessionId
      };
      return next();
    } catch {
      // Fall through to header/default actor for unauthenticated dev routes.
    }
  }

  const headerUserId = req.headers['x-user-id'];
  const userId = headerUserId ? parseInt(headerUserId, 10) : 1;

  req.actor = {
    userId: Number.isNaN(userId) ? 1 : userId
  };

  next();
};

export default attachActor;

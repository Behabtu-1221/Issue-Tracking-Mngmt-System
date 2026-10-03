import AppError from '../errors/AppError.js';
import { verifyAccessToken } from '../utils/token.js';
import userAccountRepository from '../../modules/identity-access/repositories/userAccount.repository.js';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.query?.token) {
    token = req.query.token;
  }

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const decoded = verifyAccessToken(token);
    const account = await userAccountRepository.findAuthContextByUserId(decoded.userId);

    if (!account || !account.IsActive || (account.AccountStatusCode !== 'ACTIVE' && account.AccountStatusCode !== 'MUST_CHANGE_PASSWORD')) {
      return next(new AppError('Account is inactive or locked', 401));
    }

    req.actor = {
      userId: account.UserID,
      userAccountId: account.UserAccountID,
      tenantId: account.TenantID,
      username: account.Username,
      userTypeCode: account.UserTypeCode,
      sessionId: decoded.sessionId
    };

    return next();
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }
};

export default authenticate;

import AppError from '../errors/AppError.js';
import userAccountRepository from '../../modules/identity-access/repositories/userAccount.repository.js';

export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.actor || !req.actor.userId) {
      return next(new AppError('Authentication required', 401));
    }

    try {
      if (req.actor.userTypeCode === 'SUPER_ADMIN' || req.actor.userTypeCode === 'PARK_ADMIN' || req.actor.userTypeCode === 'PARK_SUPER_ADMIN') {
        return next();
      }

      const userRoles = await userAccountRepository.findRolesByUserId(req.actor.userId);
      const roleCodes = userRoles.map((r) => r.RoleCode);

      const hasRole = allowedRoles.some((role) => roleCodes.includes(role));

      if (!hasRole) {
        return next(new AppError('Permission denied: Insufficient role authority', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const authorizePermissions = (...requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.actor || !req.actor.userId) {
      return next(new AppError('Authentication required', 401));
    }

    try {
      if (req.actor.userTypeCode === 'SUPER_ADMIN' || req.actor.userTypeCode === 'PARK_ADMIN' || req.actor.userTypeCode === 'PARK_SUPER_ADMIN') {
        return next();
      }

      const userPermissions = await userAccountRepository.findPermissionsByUserId(req.actor.userId);
      const permCodes = (userPermissions || []).map((p) => p.PermissionCode);

      // Support direct permission code match, wildcard '*', or equivalent legacy mapping
      const hasPermission = requiredPermissions.some((perm) => {
        if (permCodes.includes('*') || permCodes.includes(perm)) return true;

        // Legacy / Dot-notation equivalents mapping (e.g. Issue.Create <-> issue:create)
        const dotToColon = perm.toLowerCase().replace('.', ':');
        if (permCodes.includes(dotToColon)) return true;

        // Scope prefix fallback (e.g. Issue.Read.Own -> Issue.Read or issue:read)
        const basePerm = perm.split('.').slice(0, 2).join('.');
        if (permCodes.includes(basePerm)) return true;

        return false;
      });

      if (!hasPermission) {
        return next(new AppError(`Permission denied: Required permission code [${requiredPermissions.join(', ')}] missing`, 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default { authorizeRoles, authorizePermissions };

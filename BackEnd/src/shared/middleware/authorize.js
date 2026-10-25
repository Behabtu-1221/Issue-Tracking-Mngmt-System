import AppError from '../errors/AppError.js';
import userAccountRepository from '../../modules/identity-access/repositories/userAccount.repository.js';
import db from '../../database/connection.js';

export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.actor || !req.actor.userId) {
      return next(new AppError('Authentication required', 401));
    }

    try {
      const typeCode = (req.actor.userTypeCode || '').toUpperCase();
      if (typeCode === 'SUPER_ADMIN' || typeCode === 'PARK_ADMIN' || typeCode === 'PARK_SUPER_ADMIN') {
        return next();
      }

      const userRoles = await userAccountRepository.findRolesByUserId(req.actor.userId);
      const roleCodes = userRoles.map((r) => (r.RoleCode || '').toUpperCase());
      if (typeCode) {
        roleCodes.push(typeCode);
      }

      // Department Manager role check: user is designated Manager of any department or has manager type
      if (allowedRoles.includes('DEPARTMENT_MANAGER') || allowedRoles.includes('MANAGER')) {
        if (
          typeCode === 'DEPARTMENT_MANAGER' ||
          typeCode === 'MANAGER' ||
          roleCodes.includes('DEPARTMENT_MANAGER') ||
          roleCodes.includes('MANAGER') ||
          roleCodes.includes('FACILITY_MANAGER')
        ) {
          return next();
        }

        const [dept] = await db.query(
          `SELECT DepartmentID FROM Department WHERE ManagerUserID = ? AND IsDeleted = 0 LIMIT 1`,
          [req.actor.userId]
        );
        if (dept) {
          return next();
        }
      }

      const hasRole = allowedRoles.some((role) => roleCodes.includes(role.toUpperCase()));

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
      const typeCode = (req.actor.userTypeCode || '').toUpperCase();
      if (typeCode === 'SUPER_ADMIN' || typeCode === 'PARK_ADMIN' || typeCode === 'PARK_SUPER_ADMIN') {
        return next();
      }

      // Approval Permission Fast-Path for Department Managers & Authorized Approvers
      const isApprovalCheck = requiredPermissions.some((p) =>
        ['Issue.Approve', 'Approval.Decide', 'issue:approve', 'Request.Approve', 'approval:decide'].includes(p)
      );

      if (isApprovalCheck) {
        const userRoles = await userAccountRepository.findRolesByUserId(req.actor.userId);
        const roleCodes = (userRoles || []).map((r) => (r.RoleCode || '').toUpperCase());

        if (
          typeCode === 'DEPARTMENT_MANAGER' ||
          typeCode === 'MANAGER' ||
          roleCodes.includes('DEPARTMENT_MANAGER') ||
          roleCodes.includes('MANAGER') ||
          roleCodes.includes('FACILITY_MANAGER')
        ) {
          return next();
        }

        // Check if user is designated Manager of any active department
        const [isDeptManager] = await db.query(
          `SELECT DepartmentID FROM Department WHERE ManagerUserID = ? AND IsDeleted = 0 LIMIT 1`,
          [req.actor.userId]
        );
        if (isDeptManager) {
          return next();
        }
      }

      // Dispatch & Assignment Permission Fast-Path for Department Managers & Dispatchers
      const isDispatchCheck = requiredPermissions.some((p) =>
        ['Issue.Assign', 'Issue.Dispatch', 'issue:assign', 'issue:dispatch'].includes(p)
      );

      if (isDispatchCheck) {
        const userRoles = await userAccountRepository.findRolesByUserId(req.actor.userId);
        const roleCodes = (userRoles || []).map((r) => (r.RoleCode || '').toUpperCase());

        if (
          ['DEPARTMENT_MANAGER', 'MANAGER', 'FACILITY_MANAGER', 'DISPATCHER'].includes(typeCode) ||
          roleCodes.some((rc) => ['DEPARTMENT_MANAGER', 'MANAGER', 'FACILITY_MANAGER', 'DISPATCHER'].includes(rc))
        ) {
          return next();
        }

        // Check if user is designated Manager of any active department
        const [isDeptManager] = await db.query(
          `SELECT DepartmentID FROM Department WHERE ManagerUserID = ? AND IsDeleted = 0 LIMIT 1`,
          [req.actor.userId]
        );
        if (isDeptManager) {
          return next();
        }
      }

      const userPermissions = await userAccountRepository.findPermissionsByUserId(req.actor.userId);
      const permCodes = (userPermissions || []).map((p) => p.PermissionCode);

      // Support direct permission code match, wildcard '*', synonym mapping, or equivalent legacy mapping
      const hasPermission = requiredPermissions.some((perm) => {
        if (permCodes.includes('*') || permCodes.includes(perm)) return true;

        // Legacy / Dot-notation equivalents mapping (e.g. Issue.Create <-> issue:create)
        const dotToColon = perm.toLowerCase().replace('.', ':');
        if (permCodes.includes(dotToColon)) return true;

        // Colon to dot notation mapping (e.g. issue:create <-> Issue.Create)
        const colonToDot = perm.split(':').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('.');
        if (permCodes.includes(colonToDot)) return true;

        // Issue <-> Request synonym mapping (e.g. Issue.Approve <-> Request.Approve, Issue.Create <-> Request.Create)
        if (perm.startsWith('Issue.')) {
          const reqEquiv = 'Request.' + perm.slice(6);
          if (permCodes.includes(reqEquiv) || permCodes.includes(reqEquiv.toLowerCase().replace('.', ':'))) return true;
        } else if (perm.startsWith('Request.')) {
          const issueEquiv = 'Issue.' + perm.slice(8);
          if (permCodes.includes(issueEquiv) || permCodes.includes(issueEquiv.toLowerCase().replace('.', ':'))) return true;
        }

        // Approval.Decide <-> Issue.Approve / Request.Approve / issue:approve
        if (perm === 'Approval.Decide' || perm === 'approval:decide') {
          if (
            permCodes.includes('Issue.Approve') ||
            permCodes.includes('Request.Approve') ||
            permCodes.includes('issue:approve') ||
            permCodes.includes('request:approve')
          ) return true;
        }
        if (perm === 'Issue.Approve' || perm === 'Request.Approve' || perm === 'issue:approve' || perm === 'request:approve') {
          if (permCodes.includes('Approval.Decide') || permCodes.includes('approval:decide')) return true;
        }

        // Scope prefix fallback (e.g. Issue.Read.Own -> Issue.Read or issue:read)
        const basePerm = perm.split('.').slice(0, 2).join('.');
        if (permCodes.includes(basePerm) || permCodes.includes(basePerm.toLowerCase().replace('.', ':'))) return true;

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


import { query as dbQuery } from '../../database/connection.js';
import userAccountRepository from '../../modules/identity-access/repositories/userAccount.repository.js';
import employeeAssignmentRepository from '../../modules/organization/repositories/employee-assignment.repository.js';

/**
 * Data Scope Middleware (Row-Level Security)
 * Evaluates the logged in actor's role, tenant, and organizational scope to enforce
 * strict row-level isolation on all database queries.
 *
 * Scope Hierarchy:
 * - PARK_ADMIN / SUPER_ADMIN -> ALL (Multi-Tenant & Multi-Department Access)
 * - DEPARTMENT_MANAGER / DISPATCHER -> DEPARTMENT (Current Department Level Only)
 * - COMPANY_ADMIN / TENANT_ADMIN / TENANT_REPRESENTATIVE -> TENANT (Current Tenant Only)
 * - TECHNICIAN -> ASSIGNED (Assigned Work Items Only)
 * - EMPLOYEE -> OWN (Created / Requested by Actor Only)
 */
const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  return ['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATOR', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN'].includes(code);
};

export const dataScope = async (req, res, next) => {
  if (!req.actor || !req.actor.userId) {
    req.dataScope = { type: 'OWN', userId: null, tenantId: null, departmentId: null };
    return next();
  }

  try {
    const isParkAdmin = isParkAdminActor(req.actor);
    req.actor.isParkAdmin = isParkAdmin;

    // Strict Tenant Isolation: Never trust client-supplied tenant identifiers for non-park-admins
    if (!isParkAdmin && req.actor.tenantId) {
      if (req.body && typeof req.body === 'object') {
        if ('TenantID' in req.body) req.body.TenantID = req.actor.tenantId;
        if ('tenantId' in req.body) req.body.tenantId = req.actor.tenantId;
      }
      if (req.query && typeof req.query === 'object') {
        if ('TenantID' in req.query) req.query.TenantID = req.actor.tenantId;
        if ('tenantId' in req.query) req.query.tenantId = req.actor.tenantId;
      }
    }

    const { userId, tenantId, userTypeCode } = req.actor;
    const baseTypeCode = (userTypeCode || '').toUpperCase();

    // Collect all assigned role codes for the user
    let roleCodes = [];
    try {
      const userRoles = await userAccountRepository.findRolesByUserId(userId);
      roleCodes = (userRoles || []).map((r) => (r.RoleCode || '').toUpperCase());
    } catch {
      // Fallback if role lookup fails
    }
    if (baseTypeCode) {
      roleCodes.push(baseTypeCode);
    }

    // Resolve primary department for department staff, managers, and technicians
    let departmentId = req.actor.departmentId || null;
    let isDesignatedManager = false;

    try {
      // Check if user is appointed as ManagerUserID in Department table
      const [deptManagerRow] = await dbQuery(
        `SELECT DepartmentID FROM Department WHERE ManagerUserID = ? AND IsDeleted = 0 LIMIT 1`,
        [userId]
      );
      if (deptManagerRow && deptManagerRow.DepartmentID) {
        departmentId = deptManagerRow.DepartmentID;
        isDesignatedManager = true;
      }

      // If not designated manager, check direct User.DepartmentID
      if (!departmentId) {
        const [uRow] = await dbQuery(
          `SELECT DepartmentID FROM \`User\` WHERE UserID = ? AND IsDeleted = 0 LIMIT 1`,
          [userId]
        );
        if (uRow && uRow.DepartmentID) {
          departmentId = uRow.DepartmentID;
        }
      }

      // If still not resolved, check primary EmployeeAssignment
      if (!departmentId) {
        const [eaRow] = await dbQuery(
          `SELECT DepartmentID FROM EmployeeAssignment WHERE UserID = ? AND IsPrimary = 1 AND IsActive = 1 AND IsDeleted = 0 LIMIT 1`,
          [userId]
        );
        if (eaRow && eaRow.DepartmentID) {
          departmentId = eaRow.DepartmentID;
        }
      }
    } catch {
      // Ignore resolution fallback
    }

    // Cache verified departmentId onto actor
    if (departmentId) {
      req.actor.departmentId = departmentId;
    }

    // 1. Business Park Super Admin -> ALL (Unrestricted across park & tenants)
    if (
      isParkAdmin ||
      roleCodes.includes('SUPER_ADMIN') ||
      roleCodes.includes('PARK_ADMIN') ||
      roleCodes.includes('PARK_SUPER_ADMIN')
    ) {
      req.dataScope = {
        type: 'ALL',
        userId,
        tenantId: null,
        departmentId: null
      };
      return next();
    }

    // 2. Department Manager / Dispatcher -> DEPARTMENT (Strict department-level scoping)
    const isDeptManager =
      isDesignatedManager ||
      roleCodes.includes('DEPARTMENT_MANAGER') ||
      roleCodes.includes('MANAGER') ||
      roleCodes.includes('DISPATCHER') ||
      roleCodes.includes('FACILITY_MANAGER');

    if (isDeptManager) {
      req.dataScope = {
        type: 'DEPARTMENT',
        userId,
        tenantId: null, // Department Managers operate at department level across the park
        departmentId
      };

      // Strict Department Isolation: Lock query and body departmentId to actor's department
      if (departmentId) {
        if (req.query && typeof req.query === 'object') {
          req.query.departmentId = departmentId;
          req.query.DepartmentID = departmentId;
        }
        if (req.body && typeof req.body === 'object') {
          if ('DepartmentID' in req.body) req.body.DepartmentID = departmentId;
          if ('departmentId' in req.body) req.body.departmentId = departmentId;
        }
      }

      return next();
    }

    // 3. Tenant Representative / Tenant Admin -> TENANT (Strictly own tenant)
    if (
      roleCodes.includes('TENANT_REPRESENTATIVE') ||
      roleCodes.includes('TENANT_ADMIN') ||
      roleCodes.includes('COMPANY_ADMIN') ||
      roleCodes.includes('TENANT_USER')
    ) {
      req.dataScope = {
        type: 'TENANT',
        userId,
        tenantId: tenantId ? Number(tenantId) : null,
        departmentId: null
      };
      return next();
    }

    // 4. Field Technician -> ASSIGNED
    if (roleCodes.includes('TECHNICIAN') || roleCodes.includes('PARK_TECHNICIAN')) {
      req.dataScope = {
        type: 'ASSIGNED',
        userId,
        tenantId: tenantId ? Number(tenantId) : null,
        departmentId
      };
      return next();
    }

    // 5. General Employee (Default) -> OWN
    req.dataScope = {
      type: 'OWN',
      userId,
      tenantId: tenantId ? Number(tenantId) : null,
      departmentId
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

export default dataScope;

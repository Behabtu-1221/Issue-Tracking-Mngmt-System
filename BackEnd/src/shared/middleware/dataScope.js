import userAccountRepository from '../../modules/identity-access/repositories/userAccount.repository.js';
import employeeAssignmentRepository from '../../modules/organization/repositories/employee-assignment.repository.js';

/**
 * Data Scope Middleware (Row-Level Security)
 * Evaluates the logged in actor's role, tenant, and organizational scope to enforce
 * strict row-level isolation on all database queries.
 *
 * Scope Hierarchy:
 * - PARK_ADMIN / SUPER_ADMIN -> ALL (Multi-Tenant Access)
 * - COMPANY_ADMIN / TENANT_ADMIN -> TENANT (Current Tenant Only)
 * - DEPARTMENT_MANAGER / DISPATCHER -> DEPARTMENT (Current Tenant & Department Only)
 * - TECHNICIAN -> ASSIGNED (Assigned Work Items Only)
 * - EMPLOYEE -> OWN (Created / Requested by Actor Only)
 */
const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  return ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN'].includes(code);
};

/**
 * Data Scope Middleware (Row-Level Security)
 * Evaluates the logged in actor's role, tenant, and organizational scope to enforce
 * strict row-level isolation on all database queries.
 */
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
    let typeCode = (userTypeCode || '').toUpperCase();

    // Check if user has an active assigned role that overrides default userTypeCode
    try {
      const userRoles = await userAccountRepository.findRolesByUserId(userId);
      if (userRoles && userRoles.length > 0 && userRoles[0].RoleCode) {
        typeCode = userRoles[0].RoleCode.toUpperCase();
      }
    } catch {
      // Fallback to typeCode from token
    }

    // 1. Business Park Admin -> ALL (Access across all tenants)
    if (isParkAdminActor(req.actor) || typeCode === 'SUPER_ADMIN' || typeCode === 'PARK_ADMIN' || typeCode === 'PARK_SUPER_ADMIN') {
      req.dataScope = {
        type: 'ALL',
        userId,
        tenantId: null, // Unrestricted
        departmentId: null
      };
      return next();
    }

    // 2. Tenant Representative / Tenant Admin -> TENANT (Restricted strictly to own TenantID)
    if (typeCode === 'TENANT_REPRESENTATIVE' || typeCode === 'TENANT_ADMIN' || typeCode === 'COMPANY_ADMIN' || typeCode === 'ADMIN') {
      req.dataScope = {
        type: 'TENANT',
        userId,
        tenantId: tenantId ? Number(tenantId) : null,
        departmentId: null
      };
      return next();
    }

    // Fetch primary employee assignment for department / team resolution if applicable
    let departmentId = null;
    try {
      if (employeeAssignmentRepository && typeof employeeAssignmentRepository.findAll === 'function') {
        const res = await employeeAssignmentRepository.findAll({ userId, limit: 1 });
        if (res && res.assignments && res.assignments.length > 0) {
          departmentId = res.assignments[0].DepartmentID;
        }
      }
    } catch {
      // Ignore fallback if assignment query fails
    }

    // 3. Department Manager / Dispatcher -> DEPARTMENT
    if (typeCode === 'DEPARTMENT_MANAGER' || typeCode === 'DISPATCHER' || typeCode === 'MANAGER') {
      req.dataScope = {
        type: 'DEPARTMENT',
        userId,
        tenantId,
        departmentId
      };
      return next();
    }

    // 4. Field Technician -> ASSIGNED
    if (typeCode === 'TECHNICIAN' || typeCode === 'PARK_TECHNICIAN') {
      req.dataScope = {
        type: 'ASSIGNED',
        userId,
        tenantId,
        departmentId
      };
      return next();
    }

    // 5. Employee (Default) -> OWN
    req.dataScope = {
      type: 'OWN',
      userId,
      tenantId,
      departmentId
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

export default dataScope;

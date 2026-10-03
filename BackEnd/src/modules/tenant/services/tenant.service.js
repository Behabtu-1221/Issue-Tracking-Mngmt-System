import tenantRepository from '../repositories/tenant.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { query } from '../../../database/connection.js';

/**
 * Valid tenant status transitions (state machine).
 * ONBOARDING → ACTIVE
 * ACTIVE → SUSPENDED | TERMINATED
 * SUSPENDED → ACTIVE | TERMINATED
 */
const VALID_STATUS_TRANSITIONS = {
  ONBOARDING: ['ACTIVE'],
  ACTIVE: ['SUSPENDED', 'TERMINATED'],
  SUSPENDED: ['ACTIVE', 'TERMINATED']
};

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  const role = (actor.role || actor.primaryRole || '').toUpperCase();
  const adminCodes = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN', 'ADMIN'];
  if (adminCodes.includes(code) || adminCodes.includes(role)) return true;
  if (Array.isArray(actor.roles) && actor.roles.some(r => adminCodes.includes(String(r).toUpperCase()))) return true;
  if (!actor.tenantId && (actor.userId === 1 || code.includes('ADMIN') || role.includes('ADMIN'))) return true;
  return false;
};

export const tenantService = {
  async getTenants(params, actor) {
    if (!isParkAdminActor(actor)) {
      if (!actor || !actor.tenantId) {
        throw new AppError('Permission denied: Missing tenant identity', 403);
      }
      const tenant = await tenantRepository.findById(actor.tenantId);
      return tenant ? [tenant] : [];
    }
    return tenantRepository.findAll(params);
  },

  async getTenantById(id, actor) {
    if (!isParkAdminActor(actor)) {
      if (!actor || Number(id) !== Number(actor.tenantId)) {
        throw new AppError(`Tenant with ID ${id} not found`, 404);
      }
    }

    const tenant = await tenantRepository.findById(id);
    if (!tenant) {
      throw new AppError(`Tenant with ID ${id} not found`, 404);
    }
    return tenant;
  },

  async createTenant(data, actor) {
    if (!isParkAdminActor(actor)) {
      throw new AppError('Permission denied: Only Business Park Administrators can register new tenant organizations', 403);
    }
    const actorId = actor?.userId || 1;

    // Default BusinessParkID from actor or DB if missing/empty
    let businessParkId = data.BusinessParkID ? Number(data.BusinessParkID) : (actor?.tenantId || null);
    if (!businessParkId || isNaN(businessParkId)) {
      const parks = await query(`SELECT BusinessParkID FROM BusinessPark WHERE IsActive = 1 AND IsDeleted = 0 ORDER BY BusinessParkID ASC LIMIT 1`);
      businessParkId = parks[0]?.BusinessParkID || 1;
    }

    // Auto-generate TenantCode if not provided
    let tenantCode = data.TenantCode ? data.TenantCode.trim() : '';
    if (!tenantCode) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      tenantCode = `TNT-${Date.now().toString().slice(-4)}${rand}`;
    }

    // Uniqueness: TenantCode
    const existingCode = await tenantRepository.findByCode(tenantCode);
    if (existingCode) {
      throw new AppError(`Tenant code '${tenantCode}' already exists`, 409);
    }

    // Uniqueness: RegistrationNumber (if provided)
    if (data.RegistrationNumber) {
      const existingReg = await tenantRepository.findByRegistrationNumber(data.RegistrationNumber);
      if (existingReg) {
        throw new AppError(`Registration number '${data.RegistrationNumber}' is already assigned to tenant '${existingReg.CompanyName}'`, 409);
      }
    }

    const payload = {
      ...data,
      TenantCode: tenantCode,
      BusinessParkID: businessParkId,
      TenantTypeID: data.TenantTypeID ? Number(data.TenantTypeID) : 1,
      IndustryID: data.IndustryID ? Number(data.IndustryID) : null,
      RegistrationNumber: data.RegistrationNumber || null,
      TaxIdentificationNo: data.TaxIdentificationNo || data.TaxIdentificationNumber || null,
      Website: data.Website || null,
      CreatedBy: actorId
    };

    const newId = await tenantRepository.create(payload);
    return tenantRepository.findById(newId);
  },

  async updateTenant(id, data, actor) {
    if (!isParkAdminActor(actor)) {
      if (!actor || Number(id) !== Number(actor.tenantId)) {
        throw new AppError('Permission denied: You can only manage your own tenant organization', 403);
      }
    }
    const actorId = actor?.userId || 1;

    const tenant = await tenantRepository.findById(id);
    if (!tenant) {
      throw new AppError(`Tenant with ID ${id} not found`, 404);
    }

    // If RegistrationNumber is being changed, check uniqueness
    if (data.RegistrationNumber && data.RegistrationNumber !== tenant.RegistrationNumber) {
      const existingReg = await tenantRepository.findByRegistrationNumber(data.RegistrationNumber);
      if (existingReg && existingReg.TenantID !== Number(id)) {
        throw new AppError(`Registration number '${data.RegistrationNumber}' is already assigned to another tenant`, 409);
      }
    }

    return tenantRepository.update(id, { ...data, ModifiedBy: actorId });
  },

  /**
   * Transition tenant status with strict state machine validation.
   */
  async updateTenantStatus(id, newStatus, actor) {
    if (!isParkAdminActor(actor)) {
      throw new AppError('Permission denied: Only Business Park Administrators can modify tenant status', 403);
    }
    const actorId = actor?.userId || 1;

    const tenant = await tenantRepository.findById(id);
    if (!tenant) {
      throw new AppError(`Tenant with ID ${id} not found`, 404);
    }

    const currentStatus = tenant.Status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions) {
      throw new AppError(`Tenant is in terminal status '${currentStatus}' and cannot be transitioned`, 400);
    }

    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ')}`,
        400
      );
    }

    return tenantRepository.updateStatus(id, newStatus, actorId);
  },

  async deleteTenant(id, actor) {
    if (!isParkAdminActor(actor)) {
      throw new AppError('Permission denied: Only Business Park Administrators can delete tenant organizations', 403);
    }
    const actorId = actor?.userId || 1;

    const tenant = await tenantRepository.findById(id);
    if (!tenant) {
      throw new AppError(`Tenant with ID ${id} not found`, 404);
    }

    // Safe deletion: Prevent deletion of tenants with active leases or active dependencies
    if (tenant.LeaseCount > 0) {
      throw new AppError(
        `Cannot delete active tenant '${tenant.CompanyName}' with ${tenant.LeaseCount} lease agreement(s). Terminate the tenant first.`,
        409
      );
    }
    if (tenant.ActiveAllocationCount > 0) {
      throw new AppError(
        `Cannot delete tenant '${tenant.CompanyName}' with ${tenant.ActiveAllocationCount} active office space allocation(s). Release allocations first.`,
        409
      );
    }
    if (tenant.SubTenantCount > 0) {
      throw new AppError(
        `Cannot delete tenant '${tenant.CompanyName}' with ${tenant.SubTenantCount} active sub-tenant(s). Remove sub-tenants first.`,
        409
      );
    }

    await tenantRepository.softDelete(id, actorId);
    return { message: `Tenant '${tenant.CompanyName}' deleted successfully` };
  },

  async getDashboardMetrics(businessParkId, actor) {
    const isParkAdmin = isParkAdminActor(actor);
    const tenantId = isParkAdmin ? null : actor?.tenantId;
    return tenantRepository.getDashboardMetrics(businessParkId, tenantId);
  }
};

export default tenantService;

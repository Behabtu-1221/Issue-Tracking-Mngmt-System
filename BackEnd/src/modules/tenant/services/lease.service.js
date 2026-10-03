import leaseRepository from '../repositories/lease.repository.js';
import tenantRepository from '../repositories/tenant.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { query } from '../../../database/connection.js';

/**
 * Valid lease status transitions (state machine).
 * DRAFT → ACTIVE
 * ACTIVE → EXPIRED | TERMINATED
 */
const VALID_LEASE_TRANSITIONS = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['EXPIRED', 'TERMINATED']
};

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  const role = (actor.role || actor.primaryRole || '').toUpperCase();
  const adminCodes = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN', 'ADMIN'];
  if (adminCodes.includes(code) || adminCodes.includes(role)) return true;
  if (Array.isArray(actor.roles) && actor.roles.some(r => adminCodes.includes(String(r).toUpperCase()))) return true;
  if (!actor.tenantId && (code.includes('ADMIN') || role.includes('ADMIN'))) return true;
  return false;
};

export const leaseService = {
  async getLeases(params = {}, actor) {
    const filters = { ...params };
    if (!isParkAdminActor(actor)) {
      filters.tenantId = actor?.tenantId || -1;
    }
    return leaseRepository.findAll(filters);
  },

  async getLeaseById(id, actor) {
    const lease = await leaseRepository.findById(id);
    if (!lease || (!isParkAdminActor(actor) && Number(lease.TenantID) !== Number(actor?.tenantId))) {
      throw new AppError(`Lease agreement with ID ${id} not found`, 404);
    }
    return lease;
  },

  async getExpiringSoon(days, actor) {
    const leases = await leaseRepository.findExpiringSoon(days || 30);
    if (!isParkAdminActor(actor)) {
      return (leases || []).filter(l => Number(l.TenantID) === Number(actor?.tenantId));
    }
    return leases;
  },

  async createLease(data, userId) {
    // Verify tenant exists
    const tenant = await tenantRepository.findById(data.TenantID);
    if (!tenant) {
      throw new AppError(`Tenant with ID ${data.TenantID} not found`, 404);
    }

    // Tenant must be ACTIVE or ONBOARDING to create a new lease
    if (!['ACTIVE', 'ONBOARDING'].includes(tenant.Status)) {
      throw new AppError(
        `Cannot create a lease for tenant '${tenant.CompanyName}' with status '${tenant.Status}'. Tenant must be ACTIVE or ONBOARDING.`,
        400
      );
    }

    // Uniqueness: AgreementNumber
    const existingAgreement = await leaseRepository.findByAgreementNumber(data.AgreementNumber);
    if (existingAgreement) {
      throw new AppError(`Lease agreement number '${data.AgreementNumber}' already exists`, 409);
    }

    // Date validation: EndDate must be after StartDate
    if (new Date(data.EndDate) <= new Date(data.StartDate)) {
      throw new AppError('Lease end date must be after start date', 400);
    }

    // Date validation: ExecutionDate must be on or before StartDate
    if (data.ExecutionDate && new Date(data.ExecutionDate) > new Date(data.StartDate)) {
      throw new AppError('Lease execution date must be on or before the start date', 400);
    }

    // Financial validation
    if (data.MonthlyRentAmount <= 0) {
      throw new AppError('Monthly rent amount must be greater than zero', 400);
    }
    if (data.SecurityDepositAmount < 0) {
      throw new AppError('Security deposit amount cannot be negative', 400);
    }

    const newId = await leaseRepository.create({ ...data, CreatedBy: userId });
    return leaseRepository.findById(newId);
  },

  async updateLease(id, data, userId, actor) {
    const lease = await this.getLeaseById(id, actor);

    // Only DRAFT leases can have their core terms modified
    if (lease.Status !== 'DRAFT') {
      throw new AppError(
        `Cannot modify lease '${lease.AgreementNumber}' because it is in '${lease.Status}' status. Only DRAFT leases can be edited.`,
        400
      );
    }

    // Date validation if dates are being updated
    const effectiveStart = data.StartDate || lease.StartDate;
    const effectiveEnd = data.EndDate || lease.EndDate;
    if (new Date(effectiveEnd) <= new Date(effectiveStart)) {
      throw new AppError('Lease end date must be after start date', 400);
    }

    if (data.ExecutionDate) {
      if (new Date(data.ExecutionDate) > new Date(effectiveStart)) {
        throw new AppError('Lease execution date must be on or before the start date', 400);
      }
    }

    if (data.MonthlyRentAmount !== undefined && data.MonthlyRentAmount <= 0) {
      throw new AppError('Monthly rent amount must be greater than zero', 400);
    }
    if (data.SecurityDepositAmount !== undefined && data.SecurityDepositAmount < 0) {
      throw new AppError('Security deposit amount cannot be negative', 400);
    }

    return leaseRepository.update(id, { ...data, ModifiedBy: userId });
  },

  /**
   * Transition lease status with strict state-machine validation.
   */
  async updateLeaseStatus(id, newStatus, terminationReason, userId, actor) {
    const lease = await this.getLeaseById(id, actor);

    const currentStatus = lease.Status;
    const allowed = VALID_LEASE_TRANSITIONS[currentStatus];

    if (!allowed) {
      throw new AppError(
        `Lease '${lease.AgreementNumber}' is in terminal status '${currentStatus}' and cannot be transitioned`,
        400
      );
    }

    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid lease status transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`,
        400
      );
    }

    // Activating a lease: verify tenant is ACTIVE
    if (newStatus === 'ACTIVE') {
      const tenant = await tenantRepository.findById(lease.TenantID);
      if (tenant && tenant.Status !== 'ACTIVE') {
        throw new AppError(
          `Cannot activate lease because tenant '${tenant.CompanyName}' status is '${tenant.Status}'. Tenant must be ACTIVE first.`,
          400
        );
      }

      // Check that tenant doesn't already have another ACTIVE lease
      const activeLeases = await leaseRepository.findActiveByTenant(lease.TenantID);
      const otherActive = activeLeases.filter(l => Number(l.LeaseAgreementID) !== Number(id));
      if (otherActive.length > 0) {
        throw new AppError(
          `Tenant already has an active lease (${otherActive[0].AgreementNumber}). Terminate or expire the existing lease first.`,
          409
        );
      }
    }

    // Termination requires a reason
    if (newStatus === 'TERMINATED' && (!terminationReason || !terminationReason.trim())) {
      throw new AppError('A termination reason is required when terminating a lease', 400);
    }

    return leaseRepository.updateStatus(id, newStatus, terminationReason, userId);
  },

  async deleteLease(id, userId, actor) {
    const lease = await this.getLeaseById(id, actor);

    // Only DRAFT leases can be deleted
    if (lease.Status !== 'DRAFT') {
      throw new AppError(
        `Cannot delete lease '${lease.AgreementNumber}' in '${lease.Status}' status. Only DRAFT leases can be deleted.`,
        400
      );
    }

    // Safe delete guard: check if allocations reference this lease
    const [alloc] = await query(
      `SELECT COUNT(*) as count FROM TenantOfficeAllocation WHERE LeaseAgreementID = ? AND IsDeleted = 0`,
      [id]
    );
    if (alloc?.count > 0) {
      throw new AppError(
        `Cannot delete lease '${lease.AgreementNumber}' because ${alloc.count} office space allocation(s) are attached to it.`,
        409
      );
    }

    await leaseRepository.softDelete(id, userId);
    return { message: `Lease '${lease.AgreementNumber}' deleted successfully` };
  }
};

export default leaseService;

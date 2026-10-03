import officeAllocationRepository from '../repositories/office-allocation.repository.js';
import tenantRepository from '../repositories/tenant.repository.js';
import leaseRepository from '../repositories/lease.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { query } from '../../../database/connection.js';

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

export const officeAllocationService = {
  async getAllocations(params = {}, actor) {
    const filters = { ...params };
    if (!isParkAdminActor(actor)) {
      filters.tenantId = actor?.tenantId || -1;
    }
    return officeAllocationRepository.findAll(filters);
  },

  async getAllocationById(id, actor) {
    const allocation = await officeAllocationRepository.findById(id);
    if (!allocation || (!isParkAdminActor(actor) && Number(allocation.TenantID) !== Number(actor?.tenantId))) {
      throw new AppError(`Office allocation with ID ${id} not found`, 404);
    }
    return allocation;
  },

  async getHistory(params = {}, actor) {
    const filters = { ...params };
    if (!isParkAdminActor(actor)) {
      filters.tenantId = actor?.tenantId || -1;
    }
    return officeAllocationRepository.getHistory(filters);
  },

  /**
   * Allocate office space to a tenant.
   * Supports scopes:
   * - 'OFFICE' (single unit)
   * - 'FLOOR' (all vacant units on a floor)
   * - 'BUILDING' (all vacant units in a building)
   */
  async allocateOffice(data, userId = 1) {
    // 1. Verify tenant exists and is ACTIVE or ONBOARDING
    const tenant = await tenantRepository.findById(data.TenantID);
    if (!tenant) {
      throw new AppError(`Tenant with ID ${data.TenantID} not found`, 404);
    }
    if (!['ACTIVE', 'ONBOARDING'].includes(tenant.Status)) {
      throw new AppError(
        `Cannot allocate office space to tenant '${tenant.CompanyName}' because its status is '${tenant.Status}'. Tenant must be ACTIVE or ONBOARDING.`,
        400
      );
    }

    // 2. If lease agreement specified, verify it exists and is ACTIVE
    if (data.LeaseAgreementID) {
      const lease = await leaseRepository.findById(data.LeaseAgreementID);
      if (!lease) {
        throw new AppError(`Lease agreement with ID ${data.LeaseAgreementID} not found`, 404);
      }
      if (Number(lease.TenantID) !== Number(data.TenantID)) {
        throw new AppError(
          `Lease agreement '${lease.AgreementNumber}' does not belong to tenant '${tenant.CompanyName}'`,
          400
        );
      }
      if (lease.Status !== 'ACTIVE') {
        throw new AppError(
          `Lease agreement '${lease.AgreementNumber}' is in '${lease.Status}' status. Must be ACTIVE to attach to an office allocation.`,
          400
        );
      }
    }

    const scope = data.AllocationScope || 'OFFICE';
    let targetOffices = [];

    if (scope === 'BUILDING') {
      if (!data.BuildingID) throw new AppError('BuildingID is required for ENTIRE BUILDING allocation', 400);
      const bldgOffices = await query(
        `SELECT os.* FROM OfficeSpace os
         JOIN Floor f ON os.FloorID = f.FloorID
         WHERE f.BuildingID = ? AND os.AvailabilityStatus = 'VACANT' AND os.IsActive = 1 AND os.IsDeleted = 0`,
        [Number(data.BuildingID)]
      );
      if (bldgOffices.length === 0) {
        throw new AppError('No vacant office units available in the selected building to allocate', 400);
      }
      targetOffices = bldgOffices;
    } else if (scope === 'FLOOR') {
      if (!data.FloorID) throw new AppError('FloorID is required for ENTIRE FLOOR allocation', 400);
      const floorOffices = await query(
        `SELECT * FROM OfficeSpace WHERE FloorID = ? AND AvailabilityStatus = 'VACANT' AND IsActive = 1 AND IsDeleted = 0`,
        [Number(data.FloorID)]
      );
      if (floorOffices.length === 0) {
        throw new AppError('No vacant office units available on the selected floor to allocate', 400);
      }
      targetOffices = floorOffices;
    } else {
      // Single office unit scope
      if (!data.OfficeSpaceID) throw new AppError('OfficeSpaceID is required for single unit allocation', 400);
      const singleOffice = await query(
        `SELECT * FROM OfficeSpace WHERE OfficeSpaceID = ? AND IsDeleted = 0`,
        [Number(data.OfficeSpaceID)]
      );
      if (singleOffice.length === 0) {
        throw new AppError(`Office unit with ID ${data.OfficeSpaceID} not found`, 404);
      }
      if (singleOffice[0].AvailabilityStatus !== 'VACANT') {
        throw new AppError(
          `Office '${singleOffice[0].OfficeName}' is currently '${singleOffice[0].AvailabilityStatus}'. Must be VACANT.`,
          400
        );
      }
      targetOffices = [singleOffice[0]];
    }

    const createdAllocations = [];
    let totalSquareMeters = 0;

    for (const office of targetOffices) {
      // Check no active allocation exists
      const existingAlloc = await officeAllocationRepository.findActiveByOffice(office.OfficeSpaceID);
      if (existingAlloc) continue;

      const allocId = await officeAllocationRepository.create({
        TenantID: data.TenantID,
        OfficeSpaceID: office.OfficeSpaceID,
        LeaseAgreementID: data.LeaseAgreementID || null,
        AllocatedDate: data.AllocatedDate || new Date().toISOString().slice(0, 10),
        Status: 'ACTIVE',
        CreatedBy: userId
      });

      // Update office status to OCCUPIED
      await query(
        `UPDATE OfficeSpace SET AvailabilityStatus = 'OCCUPIED', ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE OfficeSpaceID = ?`,
        [userId || 1, office.OfficeSpaceID]
      );

      // Record allocation history
      await officeAllocationRepository.createHistory({
        OfficeSpaceID: office.OfficeSpaceID,
        TenantID: data.TenantID,
        LeaseAgreementID: data.LeaseAgreementID || null,
        ActionType: 'ALLOCATED',
        Remarks: `Allocated to ${tenant.CompanyName} (${scope} Scope)`,
        CreatedBy: userId
      });

      const allocRecord = await officeAllocationRepository.findById(allocId);
      if (allocRecord) createdAllocations.push(allocRecord);
      totalSquareMeters += Number(office.SquareMeters || 0);
    }

    return {
      scope,
      tenantName: tenant.CompanyName,
      allocatedCount: createdAllocations.length,
      totalSquareMeters,
      allocations: createdAllocations
    };
  },

  /**
   * Release an office allocation.
   * Updates office status back to VACANT and records history.
   */
  async releaseAllocation(id, remarks, userId = 1, actor) {
    const allocation = await this.getAllocationById(id, actor);

    if (allocation.Status !== 'ACTIVE') {
      throw new AppError(
        `Allocation ${id} is already in '${allocation.Status}' status. Only ACTIVE allocations can be released.`,
        400
      );
    }

    await officeAllocationRepository.release(id, userId);

    // Update office availability status back to VACANT
    await query(
      `UPDATE OfficeSpace SET AvailabilityStatus = 'VACANT', ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE OfficeSpaceID = ?`,
      [userId || 1, allocation.OfficeSpaceID]
    );

    // Record allocation history
    await officeAllocationRepository.createHistory({
      OfficeSpaceID: allocation.OfficeSpaceID,
      TenantID: allocation.TenantID,
      LeaseAgreementID: allocation.LeaseAgreementID || null,
      ActionType: 'RELEASED',
      Remarks: remarks || 'Office allocation released',
      CreatedBy: userId
    });

    return officeAllocationRepository.findById(id);
  },

  /**
   * Delete an office allocation.
   * If ACTIVE, reverts office status back to VACANT and records history.
   */
  async deleteAllocation(id, userId = 1, actor) {
    const allocation = await this.getAllocationById(id, actor);

    // If allocation is ACTIVE, revert office availability back to VACANT
    if (allocation.Status === 'ACTIVE') {
      await query(
        `UPDATE OfficeSpace SET AvailabilityStatus = 'VACANT', ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE OfficeSpaceID = ?`,
        [userId || 1, allocation.OfficeSpaceID]
      );

      // Record allocation history
      await officeAllocationRepository.createHistory({
        OfficeSpaceID: allocation.OfficeSpaceID,
        TenantID: allocation.TenantID,
        LeaseAgreementID: allocation.LeaseAgreementID || null,
        ActionType: 'REVOKED',
        Remarks: 'Office allocation revoked / deleted',
        CreatedBy: userId
      });
    }

    await officeAllocationRepository.softDelete(id, userId);
    return { message: 'Office allocation deleted successfully' };
  }
};

export default officeAllocationService;

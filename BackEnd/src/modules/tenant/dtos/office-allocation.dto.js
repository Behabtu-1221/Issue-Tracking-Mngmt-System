import AppError from '../../../shared/errors/AppError.js';

function toDateString(val) {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return str;
}

export class CreateOfficeAllocationDTO {
  constructor(body = {}) {
    this.TenantID = (body.TenantID !== undefined && body.TenantID !== '' && body.TenantID !== null) ? Number(body.TenantID) : null;
    this.AllocationScope = typeof body.AllocationScope === 'string' && body.AllocationScope.trim() 
      ? body.AllocationScope.trim().toUpperCase() 
      : 'OFFICE';
    this.OfficeSpaceID = (body.OfficeSpaceID !== undefined && body.OfficeSpaceID !== '' && body.OfficeSpaceID !== null)
      ? Number(body.OfficeSpaceID) 
      : null;
    this.FloorID = (body.FloorID !== undefined && body.FloorID !== '' && body.FloorID !== null)
      ? Number(body.FloorID) 
      : null;
    this.BuildingID = (body.BuildingID !== undefined && body.BuildingID !== '' && body.BuildingID !== null)
      ? Number(body.BuildingID) 
      : null;
    this.LeaseAgreementID = (body.LeaseAgreementID !== undefined && body.LeaseAgreementID !== '' && body.LeaseAgreementID !== null)
      ? Number(body.LeaseAgreementID) 
      : null;
    this.AllocatedDate = toDateString(body.AllocatedDate) || new Date().toISOString().slice(0, 10);

    this.validate();
  }

  validate() {
    if (!this.TenantID || isNaN(this.TenantID) || this.TenantID <= 0) {
      throw new AppError('Valid TenantID is required', 400);
    }

    const validScopes = ['OFFICE', 'FLOOR', 'BUILDING'];
    if (!validScopes.includes(this.AllocationScope)) {
      throw new AppError(`Invalid AllocationScope '${this.AllocationScope}'. Allowed: ${validScopes.join(', ')}`, 400);
    }

    if (this.AllocationScope === 'OFFICE') {
      if (!this.OfficeSpaceID || isNaN(this.OfficeSpaceID) || this.OfficeSpaceID <= 0) {
        throw new AppError('OfficeSpaceID is required for single unit space allocation', 400);
      }
    } else if (this.AllocationScope === 'FLOOR') {
      if (!this.FloorID || isNaN(this.FloorID) || this.FloorID <= 0) {
        throw new AppError('FloorID is required for ENTIRE FLOOR space allocation', 400);
      }
    } else if (this.AllocationScope === 'BUILDING') {
      if (!this.BuildingID || isNaN(this.BuildingID) || this.BuildingID <= 0) {
        throw new AppError('BuildingID is required for ENTIRE BUILDING space allocation', 400);
      }
    }

    if (this.LeaseAgreementID !== null && (isNaN(this.LeaseAgreementID) || this.LeaseAgreementID <= 0)) {
      throw new AppError('LeaseAgreementID must be a valid positive integer if provided', 400);
    }

    if (this.AllocatedDate) {
      const date = new Date(this.AllocatedDate);
      if (isNaN(date.getTime())) {
        throw new AppError('Invalid allocated date format', 400);
      }
    }
  }
}

export class ReleaseAllocationDTO {
  constructor(body = {}) {
    this.Remarks = typeof body.Remarks === 'string' ? body.Remarks.trim() : 'Office allocation released';
  }
}

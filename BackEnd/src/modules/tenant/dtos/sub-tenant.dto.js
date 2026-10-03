import AppError from '../../../shared/errors/AppError.js';

export class CreateSubTenantDTO {
  constructor(body = {}) {
    this.ParentTenantID = body.ParentTenantID !== undefined && body.ParentTenantID !== '' 
      ? Number(body.ParentTenantID) 
      : null;
    this.CompanyName = typeof body.CompanyName === 'string' ? body.CompanyName.trim() : '';
    this.RegistrationNumber = typeof body.RegistrationNumber === 'string' ? body.RegistrationNumber.trim() : null;
    this.RelationshipType = typeof body.RelationshipType === 'string' && body.RelationshipType.trim() 
      ? body.RelationshipType.trim() 
      : 'SUBSIDIARY';
    this.Status = typeof body.Status === 'string' ? body.Status.trim().toUpperCase() : 'ACTIVE';
    this.Description = typeof body.Description === 'string' ? body.Description.trim() : null;

    this.validate();
  }

  validate() {
    if (!this.ParentTenantID || isNaN(this.ParentTenantID) || this.ParentTenantID <= 0) {
      throw new AppError('Valid ParentTenantID is required', 400);
    }
    if (!this.CompanyName) {
      throw new AppError('Sub-tenant company name is required', 400);
    }
    if (this.CompanyName.length < 2 || this.CompanyName.length > 250) {
      throw new AppError('Sub-tenant company name must be between 2 and 250 characters', 400);
    }
    if (!this.RelationshipType) {
      throw new AppError('Relationship type is required', 400);
    }
  }
}

export class UpdateSubTenantDTO {
  constructor(body = {}) {
    this.CompanyName = typeof body.CompanyName === 'string' ? body.CompanyName.trim() : undefined;
    this.RegistrationNumber = typeof body.RegistrationNumber === 'string' ? body.RegistrationNumber.trim() : undefined;
    this.RelationshipType = typeof body.RelationshipType === 'string' ? body.RelationshipType.trim() : undefined;
    this.Status = typeof body.Status === 'string' ? body.Status.trim().toUpperCase() : undefined;
    this.Description = typeof body.Description === 'string' ? body.Description.trim() : undefined;

    this.validate();
  }

  validate() {
    if (this.CompanyName !== undefined) {
      if (!this.CompanyName) throw new AppError('Sub-tenant company name cannot be empty', 400);
      if (this.CompanyName.length < 2 || this.CompanyName.length > 250) {
        throw new AppError('Sub-tenant company name must be between 2 and 250 characters', 400);
      }
    }
  }
}

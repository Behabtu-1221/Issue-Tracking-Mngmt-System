import AppError from '../../../shared/errors/AppError.js';

export class CreateTenantDTO {
  constructor(body = {}) {
    this.BusinessParkID = body.BusinessParkID !== undefined && body.BusinessParkID !== '' 
      ? Number(body.BusinessParkID) 
      : null;
    this.TenantTypeID = body.TenantTypeID !== undefined && body.TenantTypeID !== '' 
      ? Number(body.TenantTypeID) 
      : 1;
    this.IndustryID = body.IndustryID !== undefined && body.IndustryID !== '' 
      ? Number(body.IndustryID) 
      : null;
    this.TenantCode = typeof body.TenantCode === 'string' ? body.TenantCode.trim() : '';
    this.CompanyName = typeof body.CompanyName === 'string' ? body.CompanyName.trim() : '';
    this.RegistrationNumber = typeof body.RegistrationNumber === 'string' ? body.RegistrationNumber.trim() : null;
    this.TaxIdentificationNo = typeof body.TaxIdentificationNo === 'string' 
      ? body.TaxIdentificationNo.trim() 
      : (typeof body.TaxIdentificationNumber === 'string' ? body.TaxIdentificationNumber.trim() : null);
    this.Status = typeof body.Status === 'string' ? body.Status.trim().toUpperCase() : 'ONBOARDING';
    this.Website = typeof body.Website === 'string' ? body.Website.trim() : null;
    this.LogoPath = typeof body.LogoPath === 'string' ? body.LogoPath.trim() : null;

    this.validate();
  }

  validate() {
    if (!this.CompanyName) {
      throw new AppError('Tenant company name is required', 400);
    }
    if (this.CompanyName.length < 2 || this.CompanyName.length > 250) {
      throw new AppError('Tenant company name must be between 2 and 250 characters', 400);
    }
    if (this.TenantCode && !/^[A-Za-z0-9_-]{2,30}$/.test(this.TenantCode)) {
      throw new AppError('Tenant code must be 2-30 alphanumeric characters with optional hyphens/underscores', 400);
    }
    if (this.BusinessParkID !== null && (isNaN(this.BusinessParkID) || this.BusinessParkID <= 0)) {
      throw new AppError('BusinessParkID must be a valid positive integer', 400);
    }
    if (isNaN(this.TenantTypeID) || this.TenantTypeID <= 0) {
      throw new AppError('TenantTypeID must be a valid positive integer', 400);
    }
    const validStatuses = ['ONBOARDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED'];
    if (!validStatuses.includes(this.Status)) {
      throw new AppError(`Invalid status '${this.Status}'. Allowed: ${validStatuses.join(', ')}`, 400);
    }
  }
}

export class UpdateTenantDTO {
  constructor(body = {}) {
    this.BusinessParkID = body.BusinessParkID !== undefined && body.BusinessParkID !== '' 
      ? Number(body.BusinessParkID) 
      : undefined;
    this.TenantTypeID = body.TenantTypeID !== undefined && body.TenantTypeID !== '' 
      ? Number(body.TenantTypeID) 
      : undefined;
    this.IndustryID = body.IndustryID !== undefined && body.IndustryID !== '' 
      ? Number(body.IndustryID) 
      : undefined;
    this.CompanyName = typeof body.CompanyName === 'string' ? body.CompanyName.trim() : undefined;
    this.RegistrationNumber = typeof body.RegistrationNumber === 'string' ? body.RegistrationNumber.trim() : undefined;
    this.TaxIdentificationNo = typeof body.TaxIdentificationNo === 'string' 
      ? body.TaxIdentificationNo.trim() 
      : (typeof body.TaxIdentificationNumber === 'string' ? body.TaxIdentificationNumber.trim() : undefined);
    this.Website = typeof body.Website === 'string' ? body.Website.trim() : undefined;
    this.LogoPath = typeof body.LogoPath === 'string' ? body.LogoPath.trim() : undefined;

    this.validate();
  }

  validate() {
    if (this.CompanyName !== undefined) {
      if (!this.CompanyName) {
        throw new AppError('Tenant company name cannot be empty', 400);
      }
      if (this.CompanyName.length < 2 || this.CompanyName.length > 250) {
        throw new AppError('Tenant company name must be between 2 and 250 characters', 400);
      }
    }
    if (this.BusinessParkID !== undefined && (isNaN(this.BusinessParkID) || this.BusinessParkID <= 0)) {
      throw new AppError('BusinessParkID must be a valid positive integer', 400);
    }
    if (this.TenantTypeID !== undefined && (isNaN(this.TenantTypeID) || this.TenantTypeID <= 0)) {
      throw new AppError('TenantTypeID must be a valid positive integer', 400);
    }
  }
}

export class UpdateTenantStatusDTO {
  constructor(body = {}) {
    this.Status = typeof body.Status === 'string' ? body.Status.trim().toUpperCase() : '';
    this.validate();
  }

  validate() {
    const validStatuses = ['ONBOARDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED'];
    if (!this.Status || !validStatuses.includes(this.Status)) {
      throw new AppError(`Invalid status '${this.Status}'. Allowed: ${validStatuses.join(', ')}`, 400);
    }
  }
}

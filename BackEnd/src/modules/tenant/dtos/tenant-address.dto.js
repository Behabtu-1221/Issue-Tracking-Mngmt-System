import AppError from '../../../shared/errors/AppError.js';

export class CreateTenantAddressDTO {
  constructor(body = {}) {
    this.TenantID = body.TenantID !== undefined && body.TenantID !== '' ? Number(body.TenantID) : null;
    this.AddressType = typeof body.AddressType === 'string' ? body.AddressType.trim().toUpperCase() : 'PHYSICAL';
    this.Country = typeof body.Country === 'string' ? body.Country.trim() : 'Ethiopia';
    this.Region = typeof body.Region === 'string' ? body.Region.trim() : null;
    this.City = typeof body.City === 'string' ? body.City.trim() : 'Addis Ababa';
    this.SubCity = typeof body.SubCity === 'string' ? body.SubCity.trim() : null;
    this.Woreda = typeof body.Woreda === 'string' ? body.Woreda.trim() : null;
    this.PostalCode = typeof body.PostalCode === 'string' ? body.PostalCode.trim() : null;
    this.AddressLine1 = typeof body.AddressLine1 === 'string' ? body.AddressLine1.trim() : '';
    this.AddressLine2 = typeof body.AddressLine2 === 'string' ? body.AddressLine2.trim() : null;

    this.validate();
  }

  validate() {
    if (!this.TenantID || isNaN(this.TenantID) || this.TenantID <= 0) {
      throw new AppError('Valid TenantID is required', 400);
    }
    const validTypes = ['LEGAL', 'BILLING', 'BRANCH', 'PHYSICAL'];
    if (!validTypes.includes(this.AddressType)) {
      throw new AppError(`Invalid address type '${this.AddressType}'. Allowed: ${validTypes.join(', ')}`, 400);
    }
    if (!this.Country) {
      throw new AppError('Country is required', 400);
    }
    if (!this.City) {
      throw new AppError('City is required', 400);
    }
    if (!this.AddressLine1) {
      throw new AppError('Address line 1 is required', 400);
    }
  }
}

export class UpdateTenantAddressDTO {
  constructor(body = {}) {
    this.AddressType = typeof body.AddressType === 'string' ? body.AddressType.trim().toUpperCase() : undefined;
    this.Country = typeof body.Country === 'string' ? body.Country.trim() : undefined;
    this.Region = typeof body.Region === 'string' ? body.Region.trim() : undefined;
    this.City = typeof body.City === 'string' ? body.City.trim() : undefined;
    this.SubCity = typeof body.SubCity === 'string' ? body.SubCity.trim() : undefined;
    this.Woreda = typeof body.Woreda === 'string' ? body.Woreda.trim() : undefined;
    this.PostalCode = typeof body.PostalCode === 'string' ? body.PostalCode.trim() : undefined;
    this.AddressLine1 = typeof body.AddressLine1 === 'string' ? body.AddressLine1.trim() : undefined;
    this.AddressLine2 = typeof body.AddressLine2 === 'string' ? body.AddressLine2.trim() : undefined;

    this.validate();
  }

  validate() {
    if (this.AddressType !== undefined) {
      const validTypes = ['LEGAL', 'BILLING', 'BRANCH', 'PHYSICAL'];
      if (!validTypes.includes(this.AddressType)) {
        throw new AppError(`Invalid address type '${this.AddressType}'. Allowed: ${validTypes.join(', ')}`, 400);
      }
    }
    if (this.AddressLine1 !== undefined && !this.AddressLine1) {
      throw new AppError('Address line 1 cannot be empty', 400);
    }
  }
}

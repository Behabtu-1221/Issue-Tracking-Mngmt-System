import AppError from '../../../shared/errors/AppError.js';

export class CreateTenantContactDTO {
  constructor(body = {}) {
    this.TenantID = body.TenantID !== undefined && body.TenantID !== '' ? Number(body.TenantID) : null;
    this.ContactType = typeof body.ContactType === 'string' ? body.ContactType.trim().toUpperCase() : 'EMAIL';
    this.Label = typeof body.Label === 'string' ? body.Label.trim() : 'Primary Contact';
    this.ContactValue = typeof body.ContactValue === 'string' ? body.ContactValue.trim() : '';
    this.IsPrimary = body.IsPrimary ? 1 : 0;

    this.validate();
  }

  validate() {
    if (!this.TenantID || isNaN(this.TenantID) || this.TenantID <= 0) {
      throw new AppError('Valid TenantID is required', 400);
    }
    const validTypes = ['EMAIL', 'PHONE', 'MOBILE', 'FAX', 'OTHER'];
    if (!validTypes.includes(this.ContactType)) {
      throw new AppError(`Invalid contact type '${this.ContactType}'. Allowed: ${validTypes.join(', ')}`, 400);
    }
    if (!this.Label) {
      throw new AppError('Contact label is required', 400);
    }
    if (!this.ContactValue) {
      throw new AppError('Contact value is required', 400);
    }
    if (this.ContactType === 'EMAIL') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.ContactValue)) {
        throw new AppError(`Invalid email address format: '${this.ContactValue}'`, 400);
      }
    }
  }
}

export class UpdateTenantContactDTO {
  constructor(body = {}) {
    this.ContactType = typeof body.ContactType === 'string' ? body.ContactType.trim().toUpperCase() : undefined;
    this.Label = typeof body.Label === 'string' ? body.Label.trim() : undefined;
    this.ContactValue = typeof body.ContactValue === 'string' ? body.ContactValue.trim() : undefined;
    this.IsPrimary = body.IsPrimary !== undefined ? (body.IsPrimary ? 1 : 0) : undefined;

    this.validate();
  }

  validate() {
    if (this.ContactType !== undefined) {
      const validTypes = ['EMAIL', 'PHONE', 'MOBILE', 'FAX', 'OTHER'];
      if (!validTypes.includes(this.ContactType)) {
        throw new AppError(`Invalid contact type '${this.ContactType}'. Allowed: ${validTypes.join(', ')}`, 400);
      }
    }
    if (this.ContactValue !== undefined) {
      if (!this.ContactValue) throw new AppError('Contact value cannot be empty', 400);
      if (this.ContactType === 'EMAIL') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.ContactValue)) {
          throw new AppError(`Invalid email address format: '${this.ContactValue}'`, 400);
        }
      }
    }
  }
}

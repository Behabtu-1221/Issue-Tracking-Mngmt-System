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

export class CreateLeaseDTO {
  constructor(body = {}) {
    this.TenantID = body.TenantID !== undefined && body.TenantID !== '' ? Number(body.TenantID) : null;
    this.AgreementNumber = typeof body.AgreementNumber === 'string' 
      ? body.AgreementNumber.trim() 
      : (typeof body.LeaseAgreementNumber === 'string' ? body.LeaseAgreementNumber.trim() : '');
    this.StartDate = toDateString(body.StartDate);
    this.EndDate = toDateString(body.EndDate);
    this.ExecutionDate = toDateString(body.ExecutionDate) || (this.StartDate || '');
    this.MonthlyRentAmount = body.MonthlyRentAmount !== undefined && body.MonthlyRentAmount !== '' 
      ? Number(body.MonthlyRentAmount) 
      : NaN;
    this.SecurityDepositAmount = body.SecurityDepositAmount !== undefined && body.SecurityDepositAmount !== '' 
      ? Number(body.SecurityDepositAmount) 
      : 0;
    this.CurrencyCode = typeof body.CurrencyCode === 'string' && body.CurrencyCode.trim() 
      ? body.CurrencyCode.trim().toUpperCase() 
      : 'ETB';
    this.GracePeriodDays = body.GracePeriodDays !== undefined && body.GracePeriodDays !== '' 
      ? Number(body.GracePeriodDays) 
      : 0;
    this.Status = typeof body.Status === 'string' ? body.Status.trim().toUpperCase() : 'DRAFT';
    this.TerminationReason = typeof body.TerminationReason === 'string' ? body.TerminationReason.trim() : null;

    this.validate();
  }

  validate() {
    if (!this.TenantID || isNaN(this.TenantID) || this.TenantID <= 0) {
      throw new AppError('Valid TenantID is required', 400);
    }
    if (!this.AgreementNumber) {
      throw new AppError('Lease agreement number is required', 400);
    }
    if (this.AgreementNumber.length < 3 || this.AgreementNumber.length > 100) {
      throw new AppError('Lease agreement number must be between 3 and 100 characters', 400);
    }
    if (!this.StartDate) {
      throw new AppError('Lease start date is required', 400);
    }
    if (!this.EndDate) {
      throw new AppError('Lease end date is required', 400);
    }

    const start = new Date(this.StartDate);
    const end = new Date(this.EndDate);
    if (isNaN(start.getTime())) {
      throw new AppError('Invalid lease start date format', 400);
    }
    if (isNaN(end.getTime())) {
      throw new AppError('Invalid lease end date format', 400);
    }
    if (end <= start) {
      throw new AppError('Lease end date must be after start date', 400);
    }

    if (this.ExecutionDate) {
      const exec = new Date(this.ExecutionDate);
      if (isNaN(exec.getTime())) {
        throw new AppError('Invalid lease execution date format', 400);
      }
      if (exec > start) {
        throw new AppError('Lease execution date must be on or before the start date', 400);
      }
    }

    if (isNaN(this.MonthlyRentAmount) || this.MonthlyRentAmount <= 0) {
      throw new AppError('Monthly rent amount must be greater than zero', 400);
    }
    if (isNaN(this.SecurityDepositAmount) || this.SecurityDepositAmount < 0) {
      throw new AppError('Security deposit amount cannot be negative', 400);
    }
    if (isNaN(this.GracePeriodDays) || this.GracePeriodDays < 0 || !Number.isInteger(this.GracePeriodDays)) {
      throw new AppError('Grace period days must be a non-negative integer', 400);
    }
    if (this.GracePeriodDays > 365) {
      throw new AppError('Grace period days cannot exceed 365 days', 400);
    }
  }
}

export class UpdateLeaseDTO {
  constructor(body = {}) {
    this.StartDate = body.StartDate ? toDateString(body.StartDate) : undefined;
    this.EndDate = body.EndDate ? toDateString(body.EndDate) : undefined;
    this.ExecutionDate = body.ExecutionDate ? toDateString(body.ExecutionDate) : undefined;
    this.MonthlyRentAmount = body.MonthlyRentAmount !== undefined && body.MonthlyRentAmount !== '' 
      ? Number(body.MonthlyRentAmount) 
      : undefined;
    this.SecurityDepositAmount = body.SecurityDepositAmount !== undefined && body.SecurityDepositAmount !== '' 
      ? Number(body.SecurityDepositAmount) 
      : undefined;
    this.CurrencyCode = typeof body.CurrencyCode === 'string' && body.CurrencyCode.trim() 
      ? body.CurrencyCode.trim().toUpperCase() 
      : undefined;
    this.GracePeriodDays = body.GracePeriodDays !== undefined && body.GracePeriodDays !== '' 
      ? Number(body.GracePeriodDays) 
      : undefined;

    this.validate();
  }

  validate() {
    if (this.StartDate) {
      const start = new Date(this.StartDate);
      if (isNaN(start.getTime())) throw new AppError('Invalid start date format', 400);
    }
    if (this.EndDate) {
      const end = new Date(this.EndDate);
      if (isNaN(end.getTime())) throw new AppError('Invalid end date format', 400);
    }
    if (this.StartDate && this.EndDate) {
      if (new Date(this.EndDate) <= new Date(this.StartDate)) {
        throw new AppError('Lease end date must be after start date', 400);
      }
    }
    if (this.ExecutionDate && this.StartDate) {
      if (new Date(this.ExecutionDate) > new Date(this.StartDate)) {
        throw new AppError('Lease execution date must be on or before the start date', 400);
      }
    }
    if (this.MonthlyRentAmount !== undefined && (isNaN(this.MonthlyRentAmount) || this.MonthlyRentAmount <= 0)) {
      throw new AppError('Monthly rent amount must be greater than zero', 400);
    }
    if (this.SecurityDepositAmount !== undefined && (isNaN(this.SecurityDepositAmount) || this.SecurityDepositAmount < 0)) {
      throw new AppError('Security deposit amount cannot be negative', 400);
    }
    if (this.GracePeriodDays !== undefined && (isNaN(this.GracePeriodDays) || this.GracePeriodDays < 0 || !Number.isInteger(this.GracePeriodDays))) {
      throw new AppError('Grace period days must be a non-negative integer', 400);
    }
  }
}

export class UpdateLeaseStatusDTO {
  constructor(body = {}) {
    this.Status = typeof body.Status === 'string' ? body.Status.trim().toUpperCase() : '';
    this.TerminationReason = typeof body.TerminationReason === 'string' ? body.TerminationReason.trim() : null;

    this.validate();
  }

  validate() {
    const validStatuses = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'];
    if (!this.Status || !validStatuses.includes(this.Status)) {
      throw new AppError(`Invalid lease status '${this.Status}'. Allowed: ${validStatuses.join(', ')}`, 400);
    }
    if (this.Status === 'TERMINATED' && (!this.TerminationReason || this.TerminationReason.length < 3)) {
      throw new AppError('A termination reason is required when terminating a lease', 400);
    }
  }
}

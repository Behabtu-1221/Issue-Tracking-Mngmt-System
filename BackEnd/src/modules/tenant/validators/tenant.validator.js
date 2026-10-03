import Joi from 'joi';

// ═══════════════════════════════════════════════════════════════
// TENANT VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createTenantSchema = Joi.object({
  BusinessParkID: Joi.number().integer().positive().allow(null, '').optional(),
  TenantTypeID: Joi.number().integer().positive().allow(null, '').optional().default(1),
  IndustryID: Joi.number().integer().positive().allow(null, '').optional(),
  TenantCode: Joi.string().max(30).required(),
  CompanyName: Joi.string().max(250).required(),
  RegistrationNumber: Joi.string().max(100).allow('', null),
  TaxIdentificationNo: Joi.string().max(100).allow('', null),
  Status: Joi.string().valid('ONBOARDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED').default('ONBOARDING'),
  OnboardedDate: Joi.date().iso().allow(null, ''),
  Website: Joi.string().max(250).allow('', null),
  LogoPath: Joi.string().max(500).allow('', null),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateTenantSchema = createTenantSchema.fork(
  ['BusinessParkID', 'TenantTypeID', 'TenantCode', 'CompanyName'],
  (schema) => schema.optional()
);

export const updateTenantStatusSchema = Joi.object({
  Status: Joi.string().valid('ONBOARDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED').required()
});

// ═══════════════════════════════════════════════════════════════
// SUB-TENANT VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createSubTenantSchema = Joi.object({
  ParentTenantID: Joi.number().integer().positive().required(),
  CompanyName: Joi.string().max(250).required(),
  RegistrationNumber: Joi.string().max(100).allow('', null),
  RelationshipType: Joi.string().max(100).required(),
  Status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
  Description: Joi.string().max(500).allow('', null),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateSubTenantSchema = createSubTenantSchema.fork(
  ['ParentTenantID', 'CompanyName', 'RelationshipType'],
  (schema) => schema.optional()
);

// ═══════════════════════════════════════════════════════════════
// TENANT CONTACT VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createContactSchema = Joi.object({
  TenantID: Joi.number().integer().positive().required(),
  ContactType: Joi.string().valid('EMAIL', 'PHONE', 'MOBILE', 'FAX', 'CHAT').required(),
  Label: Joi.string().max(100).required(),
  ContactValue: Joi.string().max(255).required(),
  IsPrimary: Joi.number().valid(0, 1).default(0),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateContactSchema = createContactSchema.fork(
  ['TenantID', 'ContactType', 'Label', 'ContactValue'],
  (schema) => schema.optional()
);

// ═══════════════════════════════════════════════════════════════
// TENANT ADDRESS VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createAddressSchema = Joi.object({
  TenantID: Joi.number().integer().positive().required(),
  AddressType: Joi.string().valid('LEGAL', 'BILLING', 'MAILING', 'PHYSICAL').required(),
  Country: Joi.string().max(100).required(),
  Region: Joi.string().max(100).allow('', null),
  City: Joi.string().max(100).required(),
  SubCity: Joi.string().max(100).allow('', null),
  Woreda: Joi.string().max(100).allow('', null),
  PostalCode: Joi.string().max(20).allow('', null),
  AddressLine1: Joi.string().max(250).required(),
  AddressLine2: Joi.string().max(250).allow('', null),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateAddressSchema = createAddressSchema.fork(
  ['TenantID', 'AddressType', 'Country', 'City', 'AddressLine1'],
  (schema) => schema.optional()
);

// ═══════════════════════════════════════════════════════════════
// LEASE AGREEMENT VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createLeaseSchema = Joi.object({
  TenantID: Joi.number().integer().positive().required(),
  AgreementNumber: Joi.string().max(100).required(),
  StartDate: Joi.date().iso().required(),
  EndDate: Joi.date().iso().required(),
  ExecutionDate: Joi.date().iso().required(),
  MonthlyRentAmount: Joi.number().positive().precision(2).required(),
  SecurityDepositAmount: Joi.number().min(0).precision(2).required(),
  CurrencyCode: Joi.string().max(10).default('ETB'),
  GracePeriodDays: Joi.number().integer().min(0).default(0),
  Status: Joi.string().valid('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED').default('DRAFT'),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateLeaseSchema = createLeaseSchema.fork(
  ['TenantID', 'AgreementNumber', 'StartDate', 'EndDate', 'ExecutionDate', 'MonthlyRentAmount', 'SecurityDepositAmount'],
  (schema) => schema.optional()
);

export const updateLeaseStatusSchema = Joi.object({
  Status: Joi.string().valid('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED').required(),
  TerminationReason: Joi.string().max(1000).when('Status', {
    is: 'TERMINATED',
    then: Joi.required(),
    otherwise: Joi.allow('', null)
  })
});

// ═══════════════════════════════════════════════════════════════
// OFFICE ALLOCATION VALIDATORS
// ═══════════════════════════════════════════════════════════════

export const createAllocationSchema = Joi.object({
  TenantID: Joi.number().integer().positive().required(),
  AllocationScope: Joi.string().valid('OFFICE', 'FLOOR', 'BUILDING').default('OFFICE'),
  OfficeSpaceID: Joi.number().integer().positive().when('AllocationScope', {
    is: 'OFFICE',
    then: Joi.required(),
    otherwise: Joi.allow(null, '').empty('').optional()
  }),
  FloorID: Joi.number().integer().positive().when('AllocationScope', {
    is: 'FLOOR',
    then: Joi.required(),
    otherwise: Joi.allow(null, '').empty('').optional()
  }),
  BuildingID: Joi.number().integer().positive().when('AllocationScope', {
    is: 'BUILDING',
    then: Joi.required(),
    otherwise: Joi.allow(null, '').empty('').optional()
  }),
  LeaseAgreementID: Joi.number().integer().positive().allow(null, '').empty('').optional(),
  AllocatedDate: Joi.date().iso().required(),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const releaseAllocationSchema = Joi.object({
  Remarks: Joi.string().max(1000).allow('', null)
});

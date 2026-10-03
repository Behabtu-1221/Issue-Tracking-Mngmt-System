import Joi from 'joi';

// ── Service Category ──
export const createServiceCategorySchema = Joi.object({
  TenantID: Joi.number().integer().allow(null, ''),
  CategoryCode: Joi.string().trim().max(50).required(),
  CategoryName: Joi.string().trim().max(150).required(),
  Description: Joi.string().trim().max(1000).allow(null, ''),
  IsActive: Joi.number().integer().valid(0, 1).default(1),
  DepartmentID: Joi.number().integer().allow(null, '')
});

export const updateServiceCategorySchema = Joi.object({
  TenantID: Joi.number().integer().allow(null, ''),
  CategoryName: Joi.string().trim().max(150),
  Description: Joi.string().trim().max(1000).allow(null, ''),
  IsActive: Joi.number().integer().valid(0, 1),
  DepartmentID: Joi.number().integer().allow(null, '')
});

// ── Core Service ──
export const createServiceSchema = Joi.object({
  ServiceCategoryID: Joi.number().integer().required(),
  ServiceTypeID: Joi.number().integer().allow(null, '').default(1),
  ServiceLevelID: Joi.number().integer().allow(null, '').default(1),
  ServiceCode: Joi.string().trim().max(50).required(),
  ServiceName: Joi.string().trim().max(150).required(),
  Description: Joi.string().trim().max(1000).allow(null, ''),
  EstimatedCost: Joi.number().precision(2).min(0).default(0),
  CurrencyCode: Joi.string().trim().max(10).default('ETB'),
  IsActive: Joi.number().integer().valid(0, 1).default(1)
});

export const updateServiceSchema = Joi.object({
  ServiceCategoryID: Joi.number().integer(),
  ServiceTypeID: Joi.number().integer(),
  ServiceLevelID: Joi.number().integer(),
  ServiceName: Joi.string().trim().max(150),
  Description: Joi.string().trim().max(1000).allow(null, ''),
  EstimatedCost: Joi.number().precision(2).min(0),
  CurrencyCode: Joi.string().trim().max(10),
  IsActive: Joi.number().integer().valid(0, 1)
});

// ── Service Pricing ──
export const upsertServicePricingSchema = Joi.object({
  ServiceID: Joi.number().integer().required(),
  PricingModel: Joi.string().trim().valid('FREE', 'FLAT_RATE', 'LABOR_HOURS', 'UNIT_PRICE').required(),
  UnitPrice: Joi.number().precision(2).min(0).default(0),
  CurrencyCode: Joi.string().trim().max(10).default('ETB'),
  BillingType: Joi.string().trim().valid('BILLABLE', 'NON_BILLABLE', 'INTERNAL_CHARGE').required(),
  IsActive: Joi.number().integer().valid(0, 1).default(1)
});

// ── Service Requirement ──
export const createServiceRequirementSchema = Joi.object({
  ServiceID: Joi.number().integer().required(),
  FieldName: Joi.string().trim().max(100).required(),
  FieldLabel: Joi.string().trim().max(100).required(),
  FieldType: Joi.string().trim().valid('TEXT', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX').required(),
  IsRequired: Joi.number().integer().valid(0, 1).default(0),
  ValidationRegex: Joi.string().trim().max(255).allow(null, ''),
  DataSourceJson: Joi.any().allow(null),
  DisplayOrder: Joi.number().integer().default(0),
  IsActive: Joi.number().integer().valid(0, 1).default(1)
});

export const updateServiceRequirementSchema = Joi.object({
  FieldLabel: Joi.string().trim().max(100),
  FieldType: Joi.string().trim().valid('TEXT', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX'),
  IsRequired: Joi.number().integer().valid(0, 1),
  ValidationRegex: Joi.string().trim().max(255).allow(null, ''),
  DataSourceJson: Joi.any().allow(null),
  DisplayOrder: Joi.number().integer(),
  IsActive: Joi.number().integer().valid(0, 1)
});

// ── Attachment Requirement ──
export const createServiceAttachmentSchema = Joi.object({
  ServiceID: Joi.number().integer().required(),
  AttachmentName: Joi.string().trim().max(100).required(),
  Description: Joi.string().trim().max(500).allow(null, ''),
  IsRequired: Joi.number().integer().valid(0, 1).default(0),
  AllowedExtensions: Joi.string().trim().max(100).default('pdf,jpg,png,docx'),
  MaxFileSizeMB: Joi.number().integer().min(1).max(100).default(10),
  IsActive: Joi.number().integer().valid(0, 1).default(1)
});

export const updateServiceAttachmentSchema = Joi.object({
  AttachmentName: Joi.string().trim().max(100),
  Description: Joi.string().trim().max(500).allow(null, ''),
  IsRequired: Joi.number().integer().valid(0, 1),
  AllowedExtensions: Joi.string().trim().max(100),
  MaxFileSizeMB: Joi.number().integer().min(1).max(100),
  IsActive: Joi.number().integer().valid(0, 1)
});

// ── Service Governance ──
export const createServiceVisibilitySchema = Joi.object({
  ServiceID: Joi.number().integer().required(),
  TenantTypeID: Joi.number().integer().allow(null, ''),
  TenantID: Joi.number().integer().allow(null, ''),
  RoleID: Joi.number().integer().allow(null, ''),
  IsActive: Joi.number().integer().valid(0, 1).default(1)
});

export const createServiceDepartmentSchema = Joi.object({
  ServiceID: Joi.number().integer().required(),
  DepartmentID: Joi.number().integer().required(),
  IsPrimary: Joi.number().integer().valid(0, 1).default(1),
  IsActive: Joi.number().integer().valid(0, 1).default(1)
});

export const upsertServiceSLASchema = Joi.object({
  ServiceID: Joi.number().integer().required(),
  SLAPolicyID: Joi.number().integer().required(),
  IsActive: Joi.number().integer().valid(0, 1).default(1)
});

export const createServiceApprovalRuleSchema = Joi.object({
  ServiceID: Joi.number().integer().required(),
  ApprovalRuleName: Joi.string().trim().max(150).required(),
  RequiredStagesCount: Joi.number().integer().min(1).default(1),
  AutoApproveLimit: Joi.number().precision(2).min(0).allow(null),
  IsActive: Joi.number().integer().valid(0, 1).default(1)
});

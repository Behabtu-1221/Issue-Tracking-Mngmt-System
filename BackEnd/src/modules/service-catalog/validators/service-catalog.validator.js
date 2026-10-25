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


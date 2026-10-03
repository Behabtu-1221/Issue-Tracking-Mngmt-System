import Joi from 'joi';

export const createUserSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().max(200).required(),
  username: Joi.string().trim().min(3).max(150).allow(null, '').optional(),
  tenantId: Joi.number().integer().positive().allow(null).optional(),
  userTypeCode: Joi.string().trim().valid('SUPER_ADMIN', 'ADMIN', 'STAFF', 'TECHNICIAN', 'MANAGER', 'TENANT_ADMIN', 'TENANT_REPRESENTATIVE', 'CONTRACTOR', 'VISITOR', 'EMPLOYEE').optional(),
  phoneNumber: Joi.string().trim().max(50).allow(null, '').optional(),
  mobileNumber: Joi.string().trim().max(50).allow(null, '').optional(),
  jobTitle: Joi.string().trim().max(100).allow(null, '').optional(),
  preferredLanguage: Joi.string().trim().max(10).default('en').optional(),
  accountStatusCode: Joi.string().trim().valid('ACTIVE', 'LOCKED', 'SUSPENDED', 'PENDING_MFA', 'MUST_CHANGE_PASSWORD', 'DEACTIVATED', 'PENDING_ACTIVATION').default('MUST_CHANGE_PASSWORD').optional(),
  roleIds: Joi.array().items(Joi.number().integer().positive()).optional()
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).optional(),
  lastName: Joi.string().trim().min(1).max(100).optional(),
  email: Joi.string().trim().email().max(200).optional(),
  phoneNumber: Joi.string().trim().max(50).allow(null, '').optional(),
  mobileNumber: Joi.string().trim().max(50).allow(null, '').optional(),
  jobTitle: Joi.string().trim().max(100).allow(null, '').optional(),
  preferredLanguage: Joi.string().trim().max(10).optional()
}).min(1);

export const updateUserStatusSchema = Joi.object({
  status: Joi.string().trim().valid('ACTIVE', 'LOCKED', 'SUSPENDED', 'PENDING_MFA', 'DEACTIVATED', 'INACTIVE', 'MUST_CHANGE_PASSWORD', 'PENDING', 'PENDING_ACTIVATION').required()
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const getUsersQuerySchema = Joi.object({
  tenantId: Joi.number().integer().positive().optional(),
  userTypeCode: Joi.string().trim().optional(),
  status: Joi.string().trim().optional(),
  search: Joi.string().trim().allow('').optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  offset: Joi.number().integer().min(0).default(0).optional()
});

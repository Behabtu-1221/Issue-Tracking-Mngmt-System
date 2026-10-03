import Joi from 'joi';

export const createRoleSchema = Joi.object({
  roleCode: Joi.string().trim().uppercase().min(2).max(50).required(),
  roleName: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().max(500).allow(null, '').optional(),
  tenantId: Joi.number().integer().positive().allow(null).optional(),
  isSystemRole: Joi.boolean().default(false).optional(),
  permissionIds: Joi.array().items(Joi.number().integer().positive()).optional()
});

export const updateRoleSchema = Joi.object({
  roleName: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().max(500).allow(null, '').optional()
}).min(1);

export const syncPermissionsSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.number().integer().positive()).required()
});

export const assignRolesSchema = Joi.object({
  roleIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const userRoleParamsSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  roleId: Joi.number().integer().positive().required()
});

export const getRolesQuerySchema = Joi.object({
  tenantId: Joi.number().integer().positive().optional(),
  search: Joi.string().trim().allow('').optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  offset: Joi.number().integer().min(0).default(0).optional()
});

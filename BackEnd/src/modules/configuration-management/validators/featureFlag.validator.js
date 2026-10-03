import Joi from 'joi';

export const featureFlagCreateSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(100).required(),
  name: Joi.string().trim().max(150).required(),
  isEnabled: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true)
});

export const featureFlagUpdateSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(100),
  name: Joi.string().trim().max(150),
  isEnabled: Joi.boolean(),
  isActive: Joi.boolean()
}).min(1);

export const featureFlagToggleSchema = Joi.object({
  isEnabled: Joi.boolean().required()
});

export const featureFlagListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  search: Joi.string().trim().max(100).allow(''),
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false),
  enabledOnly: Joi.boolean().truthy('true').falsy('false').default(false)
});

export const featureFlagIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const featureFlagCodeParamSchema = Joi.object({
  code: Joi.string().trim().required()
});

import Joi from 'joi';

export const localizationCreateSchema = Joi.object({
  languageCode: Joi.string().trim().lowercase().max(10).required(),
  countryCode: Joi.string().trim().uppercase().max(10).required(),
  localeName: Joi.string().trim().max(100).required(),
  isActive: Joi.boolean().default(true)
});

export const localizationUpdateSchema = Joi.object({
  languageCode: Joi.string().trim().lowercase().max(10),
  countryCode: Joi.string().trim().uppercase().max(10),
  localeName: Joi.string().trim().max(100),
  isActive: Joi.boolean()
}).min(1);

export const languageResourceCreateSchema = Joi.object({
  resourceKey: Joi.string().trim().max(250).required(),
  resourceValue: Joi.string().required(),
  isActive: Joi.boolean().default(true)
});

export const languageResourceUpdateSchema = Joi.object({
  resourceKey: Joi.string().trim().max(250),
  resourceValue: Joi.string(),
  isActive: Joi.boolean()
}).min(1);

export const localizationListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false)
});

export const localizationIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const languageResourceIdParamSchema = Joi.object({
  localizationId: Joi.number().integer().positive().required(),
  resourceId: Joi.number().integer().positive().required()
});

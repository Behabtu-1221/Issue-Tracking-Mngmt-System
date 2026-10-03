import Joi from 'joi';

export const numberSequenceCreateSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(50).required(),
  prefix: Joi.string().trim().max(10).allow(null, ''),
  suffix: Joi.string().trim().max(10).allow(null, ''),
  nextNumber: Joi.number().integer().min(1).default(1),
  incrementValue: Joi.number().integer().min(1).default(1),
  numberWidth: Joi.number().integer().min(1).max(20).default(6),
  isActive: Joi.boolean().default(true)
});

export const numberSequenceUpdateSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(50),
  prefix: Joi.string().trim().max(10).allow(null, ''),
  suffix: Joi.string().trim().max(10).allow(null, ''),
  nextNumber: Joi.number().integer().min(1),
  incrementValue: Joi.number().integer().min(1),
  numberWidth: Joi.number().integer().min(1).max(20),
  isActive: Joi.boolean()
}).min(1);

export const numberSequenceListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  search: Joi.string().trim().max(100).allow(''),
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false)
});

export const numberSequenceIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const numberSequenceCodeParamSchema = Joi.object({
  code: Joi.string().trim().required()
});

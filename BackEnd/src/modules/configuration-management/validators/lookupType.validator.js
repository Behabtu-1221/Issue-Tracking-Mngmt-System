import Joi from 'joi';

export const lookupTypeCreateSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(50).required(),
  name: Joi.string().trim().max(150).required(),
  isActive: Joi.boolean().default(true)
});

export const lookupTypeUpdateSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(50),
  name: Joi.string().trim().max(150),
  isActive: Joi.boolean()
}).min(1);

export const lookupValueCreateSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(50).required(),
  name: Joi.string().trim().max(255).required(),
  displayOrder: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true)
});

export const lookupValueUpdateSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(50),
  name: Joi.string().trim().max(255),
  displayOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean()
}).min(1);

export const lookupTypeIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const lookupValueIdParamSchema = Joi.object({
  lookupTypeId: Joi.number().integer().positive().required(),
  valueId: Joi.number().integer().positive().required()
});

export const lookupTypeCodeParamSchema = Joi.object({
  code: Joi.string().trim().required()
});

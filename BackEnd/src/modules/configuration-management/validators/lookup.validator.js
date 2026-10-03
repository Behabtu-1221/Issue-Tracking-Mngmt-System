import Joi from 'joi';
import { getEntityConfig } from '../constants/lookupEntities.js';

const baseLookupSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(50).required(),
  name: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(1000).allow(null, ''),
  isActive: Joi.boolean().optional()
});

const entityFieldSchemas = {
  timezones: Joi.object({
    utcOffsetMinutes: Joi.number().integer().min(-720).max(840).required()
  }),
  currencies: Joi.object({
    symbol: Joi.string().trim().max(15).required()
  }),
  statuses: Joi.object({
    entityName: Joi.string().trim().max(100).required()
  }),
  priorities: Joi.object({
    weight: Joi.number().integer().min(0).max(100).required()
  })
};

export const buildCreateSchema = (entityKey) => {
  const extra = entityFieldSchemas[entityKey] || Joi.object({});
  return baseLookupSchema.concat(extra);
};

const entityUpdateFieldSchemas = {
  timezones: Joi.object({
    utcOffsetMinutes: Joi.number().integer().min(-720).max(840)
  }),
  currencies: Joi.object({
    symbol: Joi.string().trim().max(15)
  }),
  statuses: Joi.object({
    entityName: Joi.string().trim().max(100)
  }),
  priorities: Joi.object({
    weight: Joi.number().integer().min(0).max(100)
  })
};

export const buildUpdateSchema = (entityKey) => {
  const config = getEntityConfig(entityKey);
  const extra = entityUpdateFieldSchemas[entityKey] || Joi.object({});

  return Joi.object({
    code: Joi.string().trim().uppercase().max(50),
    name: Joi.string().trim().max(200),
    description: Joi.string().trim().max(1000).allow(null, ''),
    isActive: Joi.boolean()
  })
    .concat(extra)
    .min(1)
    .messages({ 'object.min': `At least one field is required to update ${config?.label || 'record'}` });
};

export const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  search: Joi.string().trim().max(100).allow(''),
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false)
});

export const entityKeyParamSchema = Joi.object({
  entityKey: Joi.string().required()
});

export const idParamSchema = Joi.object({
  entityKey: Joi.string().required(),
  id: Joi.number().integer().positive().required()
});

export const codeParamSchema = Joi.object({
  entityKey: Joi.string().required(),
  code: Joi.string().trim().required()
});

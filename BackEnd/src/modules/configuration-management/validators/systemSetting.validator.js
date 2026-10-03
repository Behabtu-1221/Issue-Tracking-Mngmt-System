import Joi from 'joi';
import { DATA_TYPES } from '../constants/configuration.constants.js';

export const systemSettingCreateSchema = Joi.object({
  configurationCategoryId: Joi.number().integer().positive().required(),
  settingKey: Joi.string().trim().uppercase().max(100).required(),
  settingValue: Joi.string().trim().max(1000).required(),
  dataType: Joi.string().valid(...DATA_TYPES).default('STRING'),
  isActive: Joi.boolean().default(true)
});

export const systemSettingUpdateSchema = Joi.object({
  configurationCategoryId: Joi.number().integer().positive(),
  settingKey: Joi.string().trim().uppercase().max(100),
  settingValue: Joi.string().trim().max(1000),
  dataType: Joi.string().valid(...DATA_TYPES),
  isActive: Joi.boolean()
}).min(1);

export const systemSettingListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  search: Joi.string().trim().max(100).allow(''),
  categoryId: Joi.number().integer().positive(),
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false)
});

export const settingKeyParamSchema = Joi.object({
  key: Joi.string().trim().required()
});

export const settingIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

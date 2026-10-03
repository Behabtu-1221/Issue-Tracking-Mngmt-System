import Joi from 'joi';

export const createCategoryMappingSchema = Joi.object({
  ServiceCategoryID: Joi.number().integer().positive().required(),
  DepartmentID: Joi.number().integer().positive().required(),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateCategoryMappingSchema = Joi.object({
  DepartmentID: Joi.number().integer().positive().optional(),
  IsActive: Joi.number().valid(0, 1).optional()
});

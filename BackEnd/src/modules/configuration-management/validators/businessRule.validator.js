import Joi from 'joi';

export const businessRuleCreateSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(50).required(),
  name: Joi.string().trim().max(150).required(),
  ruleExpression: Joi.string().trim().max(2000).required(),
  isActive: Joi.boolean().default(true)
});

export const businessRuleUpdateSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(50),
  name: Joi.string().trim().max(150),
  ruleExpression: Joi.string().trim().max(2000),
  isActive: Joi.boolean()
}).min(1);

export const businessRuleListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  search: Joi.string().trim().max(100).allow(''),
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false)
});

export const businessRuleIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const businessRuleCodeParamSchema = Joi.object({
  code: Joi.string().trim().required()
});

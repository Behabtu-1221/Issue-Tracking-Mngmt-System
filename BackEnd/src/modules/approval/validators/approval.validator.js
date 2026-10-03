import Joi from 'joi';

export const createApprovalSchema = Joi.object({
  RequestID: Joi.number().integer().positive().required(),
  ApprovalRuleID: Joi.number().integer().positive().optional().allow(null),
  Title: Joi.string().max(250).optional(),
  Description: Joi.string().max(1000).optional().allow(null, ''),
  ApproverUserID: Joi.number().integer().positive().optional().allow(null),
  ApproverGroupID: Joi.number().integer().positive().optional().allow(null),
  stages: Joi.array().items(
    Joi.object({
      StageNumber: Joi.number().integer().positive().required(),
      ApproverUserID: Joi.number().integer().positive().optional().allow(null),
      ApproverGroupID: Joi.number().integer().positive().optional().allow(null)
    })
  ).optional()
});

export const submitDecisionSchema = Joi.object({
  ApprovalID: Joi.number().integer().positive().required(),
  DecisionUserID: Joi.number().integer().positive().optional(),
  DecisionCode: Joi.string().valid('APPROVED', 'REJECTED', 'RETURNED_FOR_CORRECTION').required(),
  Comments: Joi.string().max(1000).optional().allow(null, '')
});

export const createDelegationSchema = Joi.object({
  DelegatorUserID: Joi.number().integer().positive().required(),
  DelegateeUserID: Joi.number().integer().positive().required(),
  StartDateTime: Joi.date().iso().required(),
  EndDateTime: Joi.date().iso().greater(Joi.ref('StartDateTime')).required(),
  Reason: Joi.string().max(500).optional().allow(null, '')
});

export const updateDelegationSchema = Joi.object({
  DelegateeUserID: Joi.number().integer().positive().optional(),
  StartDateTime: Joi.date().iso().optional(),
  EndDateTime: Joi.date().iso().optional(),
  Reason: Joi.string().max(500).optional().allow(null, ''),
  IsActive: Joi.number().integer().valid(0, 1).optional()
});

export const createApprovalRuleSchema = Joi.object({
  TenantID: Joi.number().integer().positive().optional().allow(null),
  RuleName: Joi.string().max(150).required(),
  Description: Joi.string().max(1000).optional().allow(null, ''),
  MinCost: Joi.number().precision(2).min(0).optional(),
  MaxCost: Joi.number().precision(2).min(0).optional().allow(null),
  CurrencyCode: Joi.string().max(10).optional()
});

export const createApprovalGroupSchema = Joi.object({
  TenantID: Joi.number().integer().positive().optional().allow(null),
  GroupName: Joi.string().max(150).required(),
  Description: Joi.string().max(500).optional().allow(null, '')
});

import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import businessRuleService from '../services/businessRule.service.js';

const businessRuleController = {
  list: asyncHandler(async (req, res) => {
    const result = await businessRuleService.list(getQuery(req));
    sendSuccess(res, result.items, 200, result.meta);
  }),

  getById: asyncHandler(async (req, res) => {
    sendSuccess(res, await businessRuleService.getById(getParams(req).id));
  }),

  getByCode: asyncHandler(async (req, res) => {
    sendSuccess(res, await businessRuleService.getByCode(getParams(req).code));
  }),

  create: asyncHandler(async (req, res) => {
    sendCreated(res, await businessRuleService.create(req.body, req.actor.userId));
  }),

  update: asyncHandler(async (req, res) => {
    sendSuccess(res, await businessRuleService.update(getParams(req).id, req.body, req.actor.userId));
  }),

  remove: asyncHandler(async (req, res) => {
    sendSuccess(res, await businessRuleService.remove(getParams(req).id, req.actor.userId));
  })
};

export default businessRuleController;

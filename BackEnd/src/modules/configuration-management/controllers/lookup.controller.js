import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import lookupService from '../services/lookup.service.js';

const lookupController = {
  list: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const result = await lookupService.list(params.entityKey, getQuery(req));
    sendSuccess(res, result.items, 200, result.meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const record = await lookupService.getById(params.entityKey, params.id);
    sendSuccess(res, record);
  }),

  getByCode: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const record = await lookupService.getByCode(params.entityKey, params.code);
    sendSuccess(res, record);
  }),

  create: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const record = await lookupService.create(params.entityKey, req.body, req.actor.userId);
    sendCreated(res, record);
  }),

  update: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const record = await lookupService.update(
      params.entityKey,
      params.id,
      req.body,
      req.actor.userId
    );
    sendSuccess(res, record);
  }),

  remove: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const result = await lookupService.remove(params.entityKey, params.id, req.actor.userId);
    sendSuccess(res, result);
  })
};

export default lookupController;

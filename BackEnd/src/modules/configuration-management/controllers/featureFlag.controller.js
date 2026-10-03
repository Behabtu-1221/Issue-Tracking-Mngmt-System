import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import featureFlagService from '../services/featureFlag.service.js';

const featureFlagController = {
  list: asyncHandler(async (req, res) => {
    const result = await featureFlagService.list(getQuery(req));
    sendSuccess(res, result.items, 200, result.meta);
  }),

  getById: asyncHandler(async (req, res) => {
    sendSuccess(res, await featureFlagService.getById(getParams(req).id));
  }),

  getByCode: asyncHandler(async (req, res) => {
    sendSuccess(res, await featureFlagService.getByCode(getParams(req).code));
  }),

  checkEnabled: asyncHandler(async (req, res) => {
    sendSuccess(res, await featureFlagService.isEnabled(getParams(req).code));
  }),

  create: asyncHandler(async (req, res) => {
    sendCreated(res, await featureFlagService.create(req.body, req.actor.userId));
  }),

  update: asyncHandler(async (req, res) => {
    sendSuccess(res, await featureFlagService.update(getParams(req).id, req.body, req.actor.userId));
  }),

  toggle: asyncHandler(async (req, res) => {
    sendSuccess(res, await featureFlagService.toggle(getParams(req).id, req.body.isEnabled, req.actor.userId));
  }),

  remove: asyncHandler(async (req, res) => {
    sendSuccess(res, await featureFlagService.remove(getParams(req).id, req.actor.userId));
  })
};

export default featureFlagController;

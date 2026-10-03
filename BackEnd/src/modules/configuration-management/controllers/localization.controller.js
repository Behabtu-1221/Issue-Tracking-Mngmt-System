import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import localizationService from '../services/localization.service.js';

const isTruthy = (value) => value === true || value === 'true';

const localizationController = {
  list: asyncHandler(async (req, res) => {
    const result = await localizationService.list(getQuery(req));
    sendSuccess(res, result.items, 200, result.meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const includeResources = isTruthy(getQuery(req).includeResources);
    sendSuccess(res, await localizationService.getById(getParams(req).id, includeResources));
  }),

  create: asyncHandler(async (req, res) => {
    sendCreated(res, await localizationService.create(req.body, req.actor.userId));
  }),

  update: asyncHandler(async (req, res) => {
    sendSuccess(res, await localizationService.update(getParams(req).id, req.body, req.actor.userId));
  }),

  remove: asyncHandler(async (req, res) => {
    sendSuccess(res, await localizationService.remove(getParams(req).id, req.actor.userId));
  }),

  listResources: asyncHandler(async (req, res) => {
    sendSuccess(res, await localizationService.listResources(getParams(req).id));
  }),

  createResource: asyncHandler(async (req, res) => {
    sendCreated(res, await localizationService.createResource(getParams(req).id, req.body, req.actor.userId));
  }),

  updateResource: asyncHandler(async (req, res) => {
    sendSuccess(res, await localizationService.updateResource(getParams(req).resourceId, req.body, req.actor.userId));
  }),

  removeResource: asyncHandler(async (req, res) => {
    sendSuccess(res, await localizationService.removeResource(getParams(req).resourceId, req.actor.userId));
  })
};

export default localizationController;

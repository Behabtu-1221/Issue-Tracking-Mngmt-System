import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import numberSequenceService from '../services/numberSequence.service.js';

const numberSequenceController = {
  list: asyncHandler(async (req, res) => {
    const result = await numberSequenceService.list(getQuery(req));
    sendSuccess(res, result.items, 200, result.meta);
  }),

  getById: asyncHandler(async (req, res) => {
    sendSuccess(res, await numberSequenceService.getById(getParams(req).id));
  }),

  getByCode: asyncHandler(async (req, res) => {
    sendSuccess(res, await numberSequenceService.getByCode(getParams(req).code));
  }),

  create: asyncHandler(async (req, res) => {
    sendCreated(res, await numberSequenceService.create(req.body, req.actor.userId));
  }),

  update: asyncHandler(async (req, res) => {
    sendSuccess(res, await numberSequenceService.update(getParams(req).id, req.body, req.actor.userId));
  }),

  generateNext: asyncHandler(async (req, res) => {
    sendSuccess(res, await numberSequenceService.generateNext(getParams(req).code));
  }),

  remove: asyncHandler(async (req, res) => {
    sendSuccess(res, await numberSequenceService.remove(getParams(req).id, req.actor.userId));
  })
};

export default numberSequenceController;

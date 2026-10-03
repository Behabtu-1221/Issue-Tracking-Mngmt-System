import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import lookupTypeService from '../services/lookupType.service.js';

const isTruthy = (value) => value === true || value === 'true';

const lookupTypeController = {
  list: asyncHandler(async (req, res) => {
    const result = await lookupTypeService.list(getQuery(req));
    sendSuccess(res, result.items, 200, result.meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const includeValues = isTruthy(getQuery(req).includeValues);
    const record = await lookupTypeService.getById(getParams(req).id, includeValues);
    sendSuccess(res, record);
  }),

  getByCode: asyncHandler(async (req, res) => {
    const record = await lookupTypeService.getByCode(getParams(req).code, true);
    sendSuccess(res, record);
  }),

  create: asyncHandler(async (req, res) => {
    const record = await lookupTypeService.create(req.body, req.actor.userId);
    sendCreated(res, record);
  }),

  update: asyncHandler(async (req, res) => {
    const record = await lookupTypeService.update(getParams(req).id, req.body, req.actor.userId);
    sendSuccess(res, record);
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await lookupTypeService.remove(getParams(req).id, req.actor.userId);
    sendSuccess(res, result);
  }),

  listValues: asyncHandler(async (req, res) => {
    const values = await lookupTypeService.listValues(
      getParams(req).id,
      isTruthy(getQuery(req).activeOnly)
    );
    sendSuccess(res, values);
  }),

  createValue: asyncHandler(async (req, res) => {
    const value = await lookupTypeService.createValue(getParams(req).id, req.body, req.actor.userId);
    sendCreated(res, value);
  }),

  updateValue: asyncHandler(async (req, res) => {
    const value = await lookupTypeService.updateValue(getParams(req).valueId, req.body, req.actor.userId);
    sendSuccess(res, value);
  }),

  removeValue: asyncHandler(async (req, res) => {
    const result = await lookupTypeService.removeValue(getParams(req).valueId, req.actor.userId);
    sendSuccess(res, result);
  })
};

export default lookupTypeController;

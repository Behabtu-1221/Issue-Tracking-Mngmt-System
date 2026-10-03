import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import systemSettingService from '../services/systemSetting.service.js';

const systemSettingController = {
  list: asyncHandler(async (req, res) => {
    const result = await systemSettingService.list(getQuery(req));
    sendSuccess(res, result.items, 200, result.meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const record = await systemSettingService.getById(getParams(req).id);
    sendSuccess(res, record);
  }),

  getByKey: asyncHandler(async (req, res) => {
    const record = await systemSettingService.getByKey(getParams(req).key);
    sendSuccess(res, record);
  }),

  create: asyncHandler(async (req, res) => {
    const record = await systemSettingService.create(req.body, req.actor.userId);
    sendCreated(res, record);
  }),

  update: asyncHandler(async (req, res) => {
    const record = await systemSettingService.update(getParams(req).id, req.body, req.actor.userId);
    sendSuccess(res, record);
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await systemSettingService.remove(getParams(req).id, req.actor.userId);
    sendSuccess(res, result);
  })
};

export default systemSettingController;

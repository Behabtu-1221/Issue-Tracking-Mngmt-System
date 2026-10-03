import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import calendarService from '../services/calendar.service.js';

const isTruthy = (value) => value === true || value === 'true';

const calendarController = {
  list: asyncHandler(async (req, res) => {
    const result = await calendarService.list(getQuery(req));
    sendSuccess(res, result.items, 200, result.meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const includeDetails = isTruthy(getQuery(req).includeDetails);
    sendSuccess(res, await calendarService.getById(getParams(req).id, includeDetails));
  }),

  create: asyncHandler(async (req, res) => {
    sendCreated(res, await calendarService.create(req.body, req.actor.userId));
  }),

  update: asyncHandler(async (req, res) => {
    sendSuccess(res, await calendarService.update(getParams(req).id, req.body, req.actor.userId));
  }),

  remove: asyncHandler(async (req, res) => {
    sendSuccess(res, await calendarService.remove(getParams(req).id, req.actor.userId));
  }),

  listWorkingHours: asyncHandler(async (req, res) => {
    sendSuccess(res, await calendarService.listWorkingHours(getParams(req).id));
  }),

  createWorkingHour: asyncHandler(async (req, res) => {
    sendCreated(res, await calendarService.createWorkingHour(getParams(req).id, req.body, req.actor.userId));
  }),

  updateWorkingHour: asyncHandler(async (req, res) => {
    sendSuccess(res, await calendarService.updateWorkingHour(getParams(req).workingHourId, req.body, req.actor.userId));
  }),

  removeWorkingHour: asyncHandler(async (req, res) => {
    sendSuccess(res, await calendarService.removeWorkingHour(getParams(req).workingHourId, req.actor.userId));
  }),

  listHolidays: asyncHandler(async (req, res) => {
    sendSuccess(res, await calendarService.listHolidays(getParams(req).id));
  }),

  createHoliday: asyncHandler(async (req, res) => {
    sendCreated(res, await calendarService.createHoliday(getParams(req).id, req.body, req.actor.userId));
  }),

  updateHoliday: asyncHandler(async (req, res) => {
    sendSuccess(res, await calendarService.updateHoliday(getParams(req).holidayId, req.body, req.actor.userId));
  }),

  removeHoliday: asyncHandler(async (req, res) => {
    sendSuccess(res, await calendarService.removeHoliday(getParams(req).holidayId, req.actor.userId));
  })
};

export default calendarController;

import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import userService from '../services/user.service.js';

const userController = {
  getUsers: asyncHandler(async (req, res) => {
    const query = getQuery(req);
    const result = await userService.getUsers(query, req.actor);
    sendSuccess(res, result.users, 200, {
      total: result.total,
      limit: Number(query.limit || 10),
      offset: Number(query.offset || 0)
    });
  }),

  getUserById: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const user = await userService.getUserById(params.id, req.actor);
    sendSuccess(res, user);
  }),

  createUser: asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body, req.actor);
    sendCreated(res, user);
  }),

  updateUser: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const user = await userService.updateUser(params.id, req.body, req.actor);
    sendSuccess(res, user);
  }),

  updateUserStatus: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const result = await userService.updateUserStatus(params.id, req.body.status, req.actor);
    sendSuccess(res, result);
  }),

  deleteUser: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const result = await userService.deleteUser(params.id, req.actor);
    sendSuccess(res, result);
  }),

  getUserSessions: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const sessions = await userService.getUserSessions(params.id, req.actor);
    sendSuccess(res, sessions);
  }),

  terminateUserSessions: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const result = await userService.terminateUserSessions(params.id, req.actor);
    sendSuccess(res, result);
  }),

  getUserLoginHistory: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const query = getQuery(req);
    const result = await userService.getUserLoginHistory(params.id, query, req.actor);
    sendSuccess(res, result.history, 200, {
      total: result.total,
      limit: Number(query.limit || 20),
      offset: Number(query.offset || 0)
    });
  })
};

export default userController;

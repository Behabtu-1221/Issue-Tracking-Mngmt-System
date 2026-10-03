import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import authService from '../services/auth.service.js';

const authController = {
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, req);
    sendSuccess(res, result);
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, result);
  }),

  logout: asyncHandler(async (req, res) => {
    const result = await authService.logout(req.actor);
    sendSuccess(res, result);
  }),

  me: asyncHandler(async (req, res) => {
    const profile = await authService.getCurrentUser(req.actor.userId);
    sendSuccess(res, profile);
  }),

  changePassword: asyncHandler(async (req, res) => {
    const result = await authService.changePassword(
      req.actor.userAccountId,
      req.actor.userId,
      req.body.currentPassword,
      req.body.newPassword
    );
    sendSuccess(res, result);
  }),

  sessions: asyncHandler(async (req, res) => {
    const sessions = await authService.listSessions(req.actor.userAccountId);
    sendSuccess(res, sessions);
  }),

  revokeSession: asyncHandler(async (req, res) => {
    const result = await authService.revokeSession(req.params.sessionId, req.actor.userId);
    sendSuccess(res, result);
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const identifier = req.body.username || req.body.email;
    const result = await authService.forgotPassword(identifier);
    sendSuccess(res, result);
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body.token, req.body.newPassword);
    sendSuccess(res, result);
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const updatedProfile = await authService.updateProfile(req.actor.userId, req.body);
    sendSuccess(res, updatedProfile);
  }),

  updateNotificationPreferences: asyncHandler(async (req, res) => {
    const result = await authService.updateNotificationPreferences(req.actor.userId, req.body);
    sendSuccess(res, result);
  })
};

export default authController;

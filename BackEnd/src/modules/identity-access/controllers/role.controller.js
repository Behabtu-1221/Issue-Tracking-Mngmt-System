import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';
import roleService from '../services/role.service.js';

const roleController = {
  getRoles: asyncHandler(async (req, res) => {
    const query = getQuery(req);
    const result = await roleService.getRoles(query, req.actor);
    sendSuccess(res, result.roles, 200, {
      total: result.total,
      limit: Number(query.limit || 20),
      offset: Number(query.offset || 0)
    });
  }),

  getRoleById: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const role = await roleService.getRoleById(params.id, req.actor);
    sendSuccess(res, role);
  }),

  createRole: asyncHandler(async (req, res) => {
    const role = await roleService.createRole(req.body, req.actor);
    sendCreated(res, role);
  }),

  updateRole: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const role = await roleService.updateRole(params.id, req.body, req.actor);
    sendSuccess(res, role);
  }),

  deleteRole: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const result = await roleService.deleteRole(params.id, req.actor);
    sendSuccess(res, result);
  }),

  getAllPermissions: asyncHandler(async (req, res) => {
    const permissions = await roleService.getAllPermissions();
    sendSuccess(res, permissions);
  }),

  updateRolePermissions: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const role = await roleService.updateRolePermissions(params.id, req.body.permissionIds, req.actor);
    sendSuccess(res, role);
  }),

  assignRolesToUser: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const targetUserId = params.id || req.body.userId;
    const roleIds = req.body.roleIds || (req.body.roleId ? [req.body.roleId] : []);
    const user = await roleService.assignRolesToUser(targetUserId, roleIds, req.actor);
    sendSuccess(res, user);
  }),

  removeRoleFromUser: asyncHandler(async (req, res) => {
    const params = getParams(req);
    const user = await roleService.removeRoleFromUser(params.id, params.roleId, req.actor);
    sendSuccess(res, user);
  }),

  getRbacAuditLogs: asyncHandler(async (req, res) => {
    const query = getQuery(req);
    const logs = await roleService.getRbacAuditLogs(query, req.actor);
    sendSuccess(res, logs);
  })
};

export default roleController;

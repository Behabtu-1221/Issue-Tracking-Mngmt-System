import approvalGroupService from '../services/approval-group.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { getQuery, getParams } from '../../../shared/utils/requestData.js';

export const approvalGroupController = {
  async getGroups(req, res, next) {
    try {
      const params = getQuery(req);
      const result = await approvalGroupService.getGroups(params);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getGroupById(req, res, next) {
    try {
      const { id } = getParams(req);
      const group = await approvalGroupService.getGroupById(id);
      return sendSuccess(res, group);
    } catch (err) {
      next(err);
    }
  },

  async createGroup(req, res, next) {
    try {
      const group = await approvalGroupService.createGroup(req.body, req.user?.id);
      return sendSuccess(res, group, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateGroup(req, res, next) {
    try {
      const { id } = getParams(req);
      const updated = await approvalGroupService.updateGroup(id, req.body, req.user?.id);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async addMember(req, res, next) {
    try {
      const { id } = getParams(req);
      const { userId } = req.body;
      const updated = await approvalGroupService.addMember(id, userId, req.user?.id);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      const { id, userId } = getParams(req);
      const result = await approvalGroupService.removeMember(id, userId, req.user?.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default approvalGroupController;

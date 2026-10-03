import teamService from '../services/team.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const teamController = {
  async getTeams(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await teamService.getTeams(queryParams, req.dataScope);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getTeamById(req, res, next) {
    try {
      const { id } = getParams(req);
      const team = await teamService.getTeamById(id, req.dataScope);
      sendSuccess(res, team);
    } catch (err) {
      next(err);
    }
  },

  async createTeam(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const team = await teamService.createTeam(req.body, actorId, req.dataScope);
      sendCreated(res, team);
    } catch (err) {
      next(err);
    }
  },

  async updateTeam(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const team = await teamService.updateTeam(id, req.body, actorId, req.dataScope);
      sendSuccess(res, team);
    } catch (err) {
      next(err);
    }
  },

  async deleteTeam(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await teamService.deleteTeam(id, actorId, req.dataScope);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getTeamMembers(req, res, next) {
    try {
      const { id } = getParams(req);
      const members = await teamService.getTeamMembers(id, req.dataScope);
      sendSuccess(res, members);
    } catch (err) {
      next(err);
    }
  },

  async addTeamMember(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      await teamService.addTeamMember(id, req.body, actorId, req.dataScope);
      const members = await teamService.getTeamMembers(id, req.dataScope);
      sendSuccess(res, members);
    } catch (err) {
      next(err);
    }
  },

  async removeTeamMember(req, res, next) {
    try {
      const { id, userId } = getParams(req);
      const actorId = req.actor?.userId || 1;
      await teamService.removeTeamMember(id, userId, actorId, req.dataScope);
      const members = await teamService.getTeamMembers(id, req.dataScope);
      sendSuccess(res, members);
    } catch (err) {
      next(err);
    }
  },

  async getEligibleTechnicians(req, res, next) {
    try {
      const techs = await teamService.getEligibleTechnicians(req.dataScope);
      sendSuccess(res, techs);
    } catch (err) {
      next(err);
    }
  },

  async getTeamWorkloadSummary(req, res, next) {
    try {
      const workload = await teamService.getTeamWorkloadSummary(req.dataScope);
      sendSuccess(res, workload);
    } catch (err) {
      next(err);
    }
  }
};

export default teamController;

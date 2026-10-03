import knownIssueService from '../services/known-issue.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const knownIssueController = {
  async getKnownIssues(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await knownIssueService.getKnownIssues(queryParams);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getKnownIssueById(req, res, next) {
    try {
      const { id } = getParams(req);
      const issue = await knownIssueService.getKnownIssueById(id);
      return sendSuccess(res, issue);
    } catch (err) {
      next(err);
    }
  },

  async createKnownIssue(req, res, next) {
    try {
      const newArticle = await knownIssueService.createKnownIssue(req.body, req.user?.id);
      return sendCreated(res, newArticle);
    } catch (err) {
      next(err);
    }
  },

  async updateKnownIssue(req, res, next) {
    try {
      const { id } = getParams(req);
      const updated = await knownIssueService.updateKnownIssue(id, req.body, req.user?.id);
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteKnownIssue(req, res, next) {
    try {
      const { id } = getParams(req);
      const result = await knownIssueService.deleteKnownIssue(id, req.user?.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default knownIssueController;

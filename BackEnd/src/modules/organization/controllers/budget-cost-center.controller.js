import budgetCostCenterService from '../services/budget-cost-center.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const budgetCostCenterController = {
  // Cost Centers
  async getCostCenters(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await budgetCostCenterService.getCostCenters(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getCostCenterById(req, res, next) {
    try {
      const { id } = getParams(req);
      const cc = await budgetCostCenterService.getCostCenterById(id);
      sendSuccess(res, cc);
    } catch (err) {
      next(err);
    }
  },

  async createCostCenter(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const cc = await budgetCostCenterService.createCostCenter(req.body, actorId);
      sendCreated(res, cc);
    } catch (err) {
      next(err);
    }
  },

  async updateCostCenter(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const cc = await budgetCostCenterService.updateCostCenter(id, req.body, actorId);
      sendSuccess(res, cc);
    } catch (err) {
      next(err);
    }
  },

  async deleteCostCenter(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await budgetCostCenterService.deleteCostCenter(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  // Department Budgets
  async getBudgets(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await budgetCostCenterService.getBudgets(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getBudgetById(req, res, next) {
    try {
      const { id } = getParams(req);
      const budget = await budgetCostCenterService.getBudgetById(id);
      sendSuccess(res, budget);
    } catch (err) {
      next(err);
    }
  },

  async createBudget(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const budget = await budgetCostCenterService.createBudget(req.body, actorId);
      sendCreated(res, budget);
    } catch (err) {
      next(err);
    }
  },

  async updateBudget(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const budget = await budgetCostCenterService.updateBudget(id, req.body, actorId);
      sendSuccess(res, budget);
    } catch (err) {
      next(err);
    }
  },

  async deleteBudget(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await budgetCostCenterService.deleteBudget(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default budgetCostCenterController;

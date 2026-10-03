import serviceCategoryService from '../services/service-category.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getParams, getQuery } from '../../../shared/utils/requestData.js';

export const serviceCategoryController = {
  async getCategories(req, res, next) {
    try {
      const queryParams = getQuery(req);
      const result = await serviceCategoryService.getCategories(queryParams);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getCategoryById(req, res, next) {
    try {
      const { id } = getParams(req);
      const category = await serviceCategoryService.getCategoryById(id);
      sendSuccess(res, category);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req, res, next) {
    try {
      const actorId = req.actor?.userId || 1;
      const category = await serviceCategoryService.createCategory(req.body, actorId);
      sendCreated(res, category);
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const category = await serviceCategoryService.updateCategory(id, req.body, actorId);
      sendSuccess(res, category);
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = getParams(req);
      const actorId = req.actor?.userId || 1;
      const result = await serviceCategoryService.deleteCategory(id, actorId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};

export default serviceCategoryController;

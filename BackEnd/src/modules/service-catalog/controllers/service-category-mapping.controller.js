import serviceCategoryMappingService from '../services/service-category-mapping.service.js';
import asyncHandler from '../../../shared/utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';

export const serviceCategoryMappingController = {
  getMappings: asyncHandler(async (req, res) => {
    const result = await serviceCategoryMappingService.getMappings(req.query, req.actor);
    sendSuccess(res, result);
  }),

  getMappingById: asyncHandler(async (req, res) => {
    const result = await serviceCategoryMappingService.getMappingById(req.params.id, req.actor);
    sendSuccess(res, result);
  }),

  createMapping: asyncHandler(async (req, res) => {
    const result = await serviceCategoryMappingService.createMapping(req.body, req.actor);
    sendCreated(res, result);
  }),

  updateMapping: asyncHandler(async (req, res) => {
    const result = await serviceCategoryMappingService.updateMapping(req.params.id, req.body, req.actor);
    sendSuccess(res, result);
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const isActive = req.body.IsActive !== undefined ? req.body.IsActive : (req.body.isActive !== undefined ? req.body.isActive : 1);
    const result = await serviceCategoryMappingService.updateStatus(req.params.id, isActive, req.actor);
    sendSuccess(res, result);
  }),

  deleteMapping: asyncHandler(async (req, res) => {
    const result = await serviceCategoryMappingService.deleteMapping(req.params.id, req.actor);
    sendSuccess(res, result);
  })
};

export default serviceCategoryMappingController;

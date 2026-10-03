import { Router } from 'express';
import serviceCategoryMappingController from '../controllers/service-category-mapping.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { authorizePermissions } from '../../../shared/middleware/authorize.js';
import { createCategoryMappingSchema, updateCategoryMappingSchema } from '../validators/service-category-mapping.validator.js';

const router = Router();

// GET /api/category-mappings
router.get('/', authorizePermissions('Service.Read', 'Department.Read', 'Catalog.Config', 'Issue.Create'), serviceCategoryMappingController.getMappings);

// GET /api/category-mappings/:id
router.get('/:id', authorizePermissions('Service.Read', 'Department.Read', 'Catalog.Config'), serviceCategoryMappingController.getMappingById);

// POST /api/category-mappings
router.post('/', authorizePermissions('Service.Update', 'Department.Update', 'Department.Manage', 'Catalog.Config', 'Tenant.Update'), validate(createCategoryMappingSchema), serviceCategoryMappingController.createMapping);

// PUT /api/category-mappings/:id
router.put('/:id', authorizePermissions('Service.Update', 'Department.Update', 'Department.Manage', 'Catalog.Config', 'Tenant.Update'), validate(updateCategoryMappingSchema), serviceCategoryMappingController.updateMapping);

// PATCH /api/category-mappings/:id/status
router.patch('/:id/status', authorizePermissions('Service.Update', 'Department.Update', 'Department.Manage', 'Catalog.Config', 'Tenant.Update'), serviceCategoryMappingController.updateStatus);

// DELETE /api/category-mappings/:id
router.delete('/:id', authorizePermissions('Service.Update', 'Department.Update', 'Department.Manage', 'Catalog.Config', 'Tenant.Update'), serviceCategoryMappingController.deleteMapping);

export default router;

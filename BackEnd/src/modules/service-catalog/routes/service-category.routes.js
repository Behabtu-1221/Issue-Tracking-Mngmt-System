import { Router } from 'express';
import serviceCategoryController from '../controllers/service-category.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';
import { createServiceCategorySchema, updateServiceCategorySchema } from '../validators/service-catalog.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', serviceCategoryController.getCategories);
router.get('/:id', serviceCategoryController.getCategoryById);

// Admin / Manager category management
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  validate(createServiceCategorySchema),
  serviceCategoryController.createCategory
);
router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  validate(updateServiceCategorySchema),
  serviceCategoryController.updateCategory
);
router.delete(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  serviceCategoryController.deleteCategory
);

export default router;

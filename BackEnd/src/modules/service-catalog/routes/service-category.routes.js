import { Router } from 'express';
import serviceCategoryController from '../controllers/service-category.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createServiceCategorySchema, updateServiceCategorySchema } from '../validators/service-catalog.validator.js';

const router = Router();

router.get('/', serviceCategoryController.getCategories);
router.get('/:id', serviceCategoryController.getCategoryById);
router.post('/', validate(createServiceCategorySchema), serviceCategoryController.createCategory);
router.put('/:id', validate(updateServiceCategorySchema), serviceCategoryController.updateCategory);
router.delete('/:id', serviceCategoryController.deleteCategory);

export default router;

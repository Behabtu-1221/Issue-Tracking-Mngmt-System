import { Router } from 'express';
import reportingHierarchyController from '../controllers/reporting-hierarchy.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createReportingHierarchySchema, updateReportingHierarchySchema } from '../validators/organization.validator.js';

const router = Router();

router.get('/', reportingHierarchyController.getHierarchies);
router.get('/:id', reportingHierarchyController.getHierarchyById);
router.post('/', validate(createReportingHierarchySchema), reportingHierarchyController.createHierarchy);
router.put('/:id', validate(updateReportingHierarchySchema), reportingHierarchyController.updateHierarchy);
router.delete('/:id', reportingHierarchyController.deleteHierarchy);

export default router;

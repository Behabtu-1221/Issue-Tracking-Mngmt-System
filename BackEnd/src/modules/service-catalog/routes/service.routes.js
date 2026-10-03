import { Router } from 'express';
import serviceController from '../controllers/service.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';
import { createServiceSchema, updateServiceSchema } from '../validators/service-catalog.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', serviceController.getServices);
router.get('/metrics', serviceController.getOverviewMetrics);
router.get('/:id', serviceController.getServiceById);

// Admin / Manager catalog management
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  validate(createServiceSchema),
  serviceController.createService
);
router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  validate(updateServiceSchema),
  serviceController.updateService
);
router.delete(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  serviceController.deleteService
);

export default router;

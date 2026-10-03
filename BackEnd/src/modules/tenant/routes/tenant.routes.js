import { Router } from 'express';
import tenantController from '../controllers/tenant.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createTenantSchema, updateTenantSchema, updateTenantStatusSchema } from '../validators/tenant.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', tenantController.getTenants);
router.get('/metrics', tenantController.getDashboardMetrics);
router.get('/:id', tenantController.getTenantById);
router.post('/', validate(createTenantSchema), tenantController.createTenant);
router.put('/:id', validate(updateTenantSchema), tenantController.updateTenant);
router.patch('/:id/status', validate(updateTenantStatusSchema), tenantController.updateTenantStatus);
router.delete('/:id', tenantController.deleteTenant);

export default router;

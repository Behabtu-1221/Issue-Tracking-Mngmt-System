import { Router } from 'express';
import servicePricingController from '../controllers/service-pricing.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';
import { upsertServicePricingSchema } from '../validators/service-catalog.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/service/:serviceId', servicePricingController.getPricingByServiceId);

// Administrative only
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  validate(upsertServicePricingSchema),
  servicePricingController.upsertPricing
);
router.delete(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  servicePricingController.deletePricing
);

export default router;

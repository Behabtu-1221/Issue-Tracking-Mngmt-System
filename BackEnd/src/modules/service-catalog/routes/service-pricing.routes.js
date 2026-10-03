import { Router } from 'express';
import servicePricingController from '../controllers/service-pricing.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { upsertServicePricingSchema } from '../validators/service-catalog.validator.js';

const router = Router();

router.get('/service/:serviceId', servicePricingController.getPricingByServiceId);
router.post('/', validate(upsertServicePricingSchema), servicePricingController.upsertPricing);
router.delete('/:id', servicePricingController.deletePricing);

export default router;

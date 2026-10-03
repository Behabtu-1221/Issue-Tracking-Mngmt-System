import { Router } from 'express';
import serviceController from '../controllers/service.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createServiceSchema, updateServiceSchema } from '../validators/service-catalog.validator.js';

const router = Router();

router.get('/', serviceController.getServices);
router.get('/metrics', serviceController.getOverviewMetrics);
router.get('/:id', serviceController.getServiceById);
router.post('/', validate(createServiceSchema), serviceController.createService);
router.put('/:id', validate(updateServiceSchema), serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

export default router;

import { Router } from 'express';
import parkController from '../controllers/park.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createParkSchema, updateParkSchema } from '../validators/park.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/', parkController.getParks);
router.get('/metrics', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), parkController.getOverviewMetrics);
router.get('/:id', parkController.getParkById);
router.post('/', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), validate(createParkSchema), parkController.createPark);
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), validate(updateParkSchema), parkController.updatePark);
router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), parkController.deletePark);

export default router;

import { Router } from 'express';
import floorPlanController from '../controllers/floor-plan.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createFloorPlanSchema, updateFloorPlanSchema } from '../validators/park.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'));

router.get('/floor/:floorId', floorPlanController.getFloorPlanByFloorId);
router.post('/', validate(createFloorPlanSchema), floorPlanController.createFloorPlan);
router.put('/:id', validate(updateFloorPlanSchema), floorPlanController.updateFloorPlan);
router.delete('/:id', floorPlanController.deleteFloorPlan);

export default router;

import { Router } from 'express';
import floorController from '../controllers/floor.controller.js';
import officeController from '../controllers/office.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createFloorSchema, updateFloorSchema } from '../validators/park.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'));

router.get('/', floorController.getFloors);
router.get('/:id', floorController.getFloorById);
router.get('/:floorId/offices', officeController.getOffices);
router.post('/', validate(createFloorSchema), floorController.createFloor);
router.put('/:id', validate(updateFloorSchema), floorController.updateFloor);
router.delete('/:id', floorController.deleteFloor);

export default router;

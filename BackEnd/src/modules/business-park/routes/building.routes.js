import { Router } from 'express';
import buildingController from '../controllers/building.controller.js';
import floorController from '../controllers/floor.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createBuildingSchema, updateBuildingSchema } from '../validators/park.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'));

router.get('/', buildingController.getBuildings);
router.get('/:id', buildingController.getBuildingById);
router.get('/:buildingId/floors', floorController.getFloors);
router.post('/', validate(createBuildingSchema), buildingController.createBuilding);
router.put('/:id', validate(updateBuildingSchema), buildingController.updateBuilding);
router.delete('/:id', buildingController.deleteBuilding);

export default router;

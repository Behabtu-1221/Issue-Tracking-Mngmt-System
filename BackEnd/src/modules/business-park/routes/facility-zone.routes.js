import { Router } from 'express';
import facilityZoneController from '../controllers/facility-zone.controller.js';
import buildingController from '../controllers/building.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createFacilityZoneSchema, updateFacilityZoneSchema } from '../validators/park.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'));

router.get('/', facilityZoneController.getFacilityZones);
router.get('/:id', facilityZoneController.getFacilityZoneById);
router.get('/:zoneId/buildings', buildingController.getBuildings);
router.post('/', validate(createFacilityZoneSchema), facilityZoneController.createFacilityZone);
router.put('/:id', validate(updateFacilityZoneSchema), facilityZoneController.updateFacilityZone);
router.delete('/:id', facilityZoneController.deleteFacilityZone);

export default router;

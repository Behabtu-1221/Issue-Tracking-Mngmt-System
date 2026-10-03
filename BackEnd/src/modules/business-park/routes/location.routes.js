import { Router } from 'express';
import locationController from '../controllers/location.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createLocationSchema, updateLocationSchema } from '../validators/park.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'));

router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocationById);
router.post('/', validate(createLocationSchema), locationController.createLocation);
router.put('/:id', validate(updateLocationSchema), locationController.updateLocation);
router.delete('/:id', locationController.deleteLocation);

export default router;

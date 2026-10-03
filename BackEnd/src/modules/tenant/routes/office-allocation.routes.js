import { Router } from 'express';
import officeAllocationController from '../controllers/office-allocation.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createAllocationSchema, releaseAllocationSchema } from '../validators/tenant.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', officeAllocationController.getAllocations);
router.get('/history', officeAllocationController.getHistory);
router.get('/:id', officeAllocationController.getAllocationById);

// Administrative mutations restricted to Business Park Admins
router.post('/', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), validate(createAllocationSchema), officeAllocationController.allocateOffice);
router.patch('/:id/release', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), validate(releaseAllocationSchema), officeAllocationController.releaseAllocation);
router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), officeAllocationController.deleteAllocation);

export default router;

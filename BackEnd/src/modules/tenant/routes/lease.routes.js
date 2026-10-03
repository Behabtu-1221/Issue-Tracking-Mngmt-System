import { Router } from 'express';
import leaseController from '../controllers/lease.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createLeaseSchema, updateLeaseSchema, updateLeaseStatusSchema } from '../validators/tenant.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', leaseController.getLeases);
router.get('/expiring-soon', leaseController.getExpiringSoon);
router.get('/:id', leaseController.getLeaseById);

// Administrative mutations restricted to Business Park Admins
router.post('/', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), validate(createLeaseSchema), leaseController.createLease);
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), validate(updateLeaseSchema), leaseController.updateLease);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), validate(updateLeaseStatusSchema), leaseController.updateLeaseStatus);
router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'), leaseController.deleteLease);

export default router;

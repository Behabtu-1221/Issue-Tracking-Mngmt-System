import { Router } from 'express';
import approvalGroupController from '../controllers/approval-group.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';
import { createApprovalGroupSchema } from '../validators/approval.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', approvalGroupController.getGroups);
router.get('/:id', approvalGroupController.getGroupById);

// Administrative only
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  validate(createApprovalGroupSchema),
  approvalGroupController.createGroup
);
router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  approvalGroupController.updateGroup
);
router.post(
  '/:id/members',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  approvalGroupController.addMember
);
router.delete(
  '/:id/members/:userId',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  approvalGroupController.removeMember
);

export default router;

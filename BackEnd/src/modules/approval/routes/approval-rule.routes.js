import { Router } from 'express';
import approvalRuleController from '../controllers/approval-rule.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';
import { createApprovalRuleSchema } from '../validators/approval.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', approvalRuleController.getRules);
router.get('/thresholds', approvalRuleController.getThresholds);
router.get('/:id', approvalRuleController.getRuleById);

// Admin / Manager configuration only
router.post(
  '/thresholds',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  approvalRuleController.createThreshold
);
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  validate(createApprovalRuleSchema),
  approvalRuleController.createRule
);
router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  approvalRuleController.updateRule
);
router.delete(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'),
  approvalRuleController.deleteRule
);

export default router;

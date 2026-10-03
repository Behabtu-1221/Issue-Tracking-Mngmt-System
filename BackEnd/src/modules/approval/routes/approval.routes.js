import { Router } from 'express';
import approvalController from '../controllers/approval.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles, authorizePermissions } from '../../../shared/middleware/authorize.js';
import { createApprovalSchema, submitDecisionSchema } from '../validators/approval.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', approvalController.getApprovals);
router.get('/metrics', approvalController.getMetrics);
router.get('/pending', approvalController.getPendingApprovals);
router.get('/by-request/:requestId', approvalController.getApprovalByRequestId);
router.get('/:id', approvalController.getApprovalById);
router.post(
  '/',
  authorizePermissions('Issue.Create', 'Issue.Update', 'Approval.Manage'),
  validate(createApprovalSchema),
  approvalController.createApproval
);
router.post(
  '/decision',
  authorizePermissions('Issue.Approve', 'Approval.Decide', 'issue:approve'),
  validate(submitDecisionSchema),
  approvalController.submitDecision
);

export default router;

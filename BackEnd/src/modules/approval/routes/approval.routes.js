import { Router } from 'express';
import approvalController from '../controllers/approval.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createApprovalSchema, submitDecisionSchema } from '../validators/approval.validator.js';

const router = Router();

router.get('/', approvalController.getApprovals);
router.get('/metrics', approvalController.getMetrics);
router.get('/pending', approvalController.getPendingApprovals);
router.get('/by-request/:requestId', approvalController.getApprovalByRequestId);
router.get('/:id', approvalController.getApprovalById);
router.post('/', validate(createApprovalSchema), approvalController.createApproval);
router.post('/decision', validate(submitDecisionSchema), approvalController.submitDecision);

export default router;

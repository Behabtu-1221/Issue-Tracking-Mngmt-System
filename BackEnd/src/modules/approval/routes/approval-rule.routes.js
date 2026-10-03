import { Router } from 'express';
import approvalRuleController from '../controllers/approval-rule.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createApprovalRuleSchema } from '../validators/approval.validator.js';

const router = Router();

router.get('/', approvalRuleController.getRules);
router.get('/thresholds', approvalRuleController.getThresholds);
router.post('/thresholds', approvalRuleController.createThreshold);
router.get('/:id', approvalRuleController.getRuleById);
router.post('/', validate(createApprovalRuleSchema), approvalRuleController.createRule);
router.put('/:id', approvalRuleController.updateRule);
router.delete('/:id', approvalRuleController.deleteRule);

export default router;

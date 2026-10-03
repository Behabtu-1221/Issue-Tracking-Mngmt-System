import { Router } from 'express';
import approvalDelegationController from '../controllers/approval-delegation.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createDelegationSchema, updateDelegationSchema } from '../validators/approval.validator.js';

const router = Router();

router.get('/', approvalDelegationController.getDelegations);
router.get('/:id', approvalDelegationController.getDelegationById);
router.post('/', validate(createDelegationSchema), approvalDelegationController.createDelegation);
router.put('/:id', validate(updateDelegationSchema), approvalDelegationController.updateDelegation);
router.delete('/:id', approvalDelegationController.deleteDelegation);

export default router;

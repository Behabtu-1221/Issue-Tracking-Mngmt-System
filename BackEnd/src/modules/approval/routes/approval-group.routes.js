import { Router } from 'express';
import approvalGroupController from '../controllers/approval-group.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createApprovalGroupSchema } from '../validators/approval.validator.js';

const router = Router();

router.get('/', approvalGroupController.getGroups);
router.get('/:id', approvalGroupController.getGroupById);
router.post('/', validate(createApprovalGroupSchema), approvalGroupController.createGroup);
router.put('/:id', approvalGroupController.updateGroup);
router.post('/:id/members', approvalGroupController.addMember);
router.delete('/:id/members/:userId', approvalGroupController.removeMember);

export default router;

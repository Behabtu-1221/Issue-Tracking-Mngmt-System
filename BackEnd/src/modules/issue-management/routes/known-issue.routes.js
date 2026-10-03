import { Router } from 'express';
import knownIssueController from '../controllers/known-issue.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createKnownIssueSchema, updateKnownIssueSchema } from '../validators/issue-management.validator.js';

const router = Router();

router.get('/', knownIssueController.getKnownIssues);
router.get('/:id', knownIssueController.getKnownIssueById);
router.post('/', validate(createKnownIssueSchema), knownIssueController.createKnownIssue);
router.put('/:id', validate(updateKnownIssueSchema), knownIssueController.updateKnownIssue);
router.delete('/:id', knownIssueController.deleteKnownIssue);

export default router;

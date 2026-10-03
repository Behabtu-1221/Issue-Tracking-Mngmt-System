import { Router } from 'express';
import issueInvestigationController from '../controllers/issue-investigation.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { saveInvestigationSchema } from '../validators/issue-management.validator.js';

const router = Router();

router.get('/issue/:issueRequestId', issueInvestigationController.getInvestigation);
router.post('/', validate(saveInvestigationSchema), issueInvestigationController.saveInvestigation);
router.delete('/:id', issueInvestigationController.deleteInvestigation);

export default router;

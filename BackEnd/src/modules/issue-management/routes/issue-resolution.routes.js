import { Router } from 'express';
import issueResolutionController from '../controllers/issue-resolution.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { saveResolutionSchema } from '../validators/issue-management.validator.js';

const router = Router();

router.get('/issue/:issueRequestId', issueResolutionController.getResolution);
router.post('/', validate(saveResolutionSchema), issueResolutionController.saveResolution);
router.delete('/:id', issueResolutionController.deleteResolution);

export default router;

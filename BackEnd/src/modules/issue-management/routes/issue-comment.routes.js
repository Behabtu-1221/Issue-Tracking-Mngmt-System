import { Router } from 'express';
import issueCommentController from '../controllers/issue-comment.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createCommentSchema } from '../validators/issue-management.validator.js';

const router = Router();

router.get('/issue/:issueRequestId', issueCommentController.getComments);
router.post('/', validate(createCommentSchema), issueCommentController.addComment);
router.delete('/:id', issueCommentController.deleteComment);

export default router;

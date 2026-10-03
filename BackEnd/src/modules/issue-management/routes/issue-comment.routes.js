import { Router } from 'express';
import issueCommentController from '../controllers/issue-comment.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizePermissions } from '../../../shared/middleware/authorize.js';
import { createCommentSchema } from '../validators/issue-management.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get(
  '/issue/:issueRequestId',
  authorizePermissions('Issue.Read.Own', 'Issue.Read.Department', 'Issue.Read.Company', 'Issue.Read.All', 'issue:read', 'Request.Read'),
  issueCommentController.getComments
);

router.post(
  '/',
  authorizePermissions('Issue.Update', 'Issue.Create', 'issue:update', 'issue:create', 'Request.Update'),
  validate(createCommentSchema),
  issueCommentController.addComment
);

router.delete(
  '/:id',
  authorizePermissions('Issue.Update', 'Issue.Delete', 'issue:update', 'issue:delete', 'Request.Update'),
  issueCommentController.deleteComment
);

export default router;

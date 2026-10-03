import { Router } from 'express';
import issueRequestController from '../controllers/issue-request.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizePermissions } from '../../../shared/middleware/authorize.js';
import {
  createIssueRequestSchema,
  updateIssueRequestSchema,
  assignIssueSchema,
  updateStatusSchema,
  cancelIssueSchema
} from '../validators/issue-management.validator.js';

const router = Router();

// Require Authentication & Row-Level Data Scope evaluation for all issue endpoints
router.use(authenticate);
router.use(dataScope);

router.get(
  '/',
  authorizePermissions('Issue.Read.Own', 'Issue.Read.Department', 'Issue.Read.Company', 'Issue.Read.All', 'issue:read', 'Request.Read'),
  issueRequestController.getIssues
);

router.get(
  '/metrics',
  authorizePermissions('Report.View', 'Issue.Read.Company', 'Issue.Read.All', 'issue:read', 'Request.Read'),
  issueRequestController.getOverviewMetrics
);

router.get(
  '/:id',
  authorizePermissions('Issue.Read.Own', 'Issue.Read.Department', 'Issue.Read.Company', 'Issue.Read.All', 'issue:read', 'Request.Read'),
  issueRequestController.getIssueById
);

router.post(
  '/',
  authorizePermissions('Issue.Create', 'issue:create', 'Request.Create'),
  validate(createIssueRequestSchema),
  issueRequestController.createIssue
);

router.put(
  '/:id',
  authorizePermissions('Issue.Update', 'issue:update', 'Request.Update'),
  validate(updateIssueRequestSchema),
  issueRequestController.updateIssue
);

router.post(
  '/:id/assign',
  authorizePermissions('Issue.Assign', 'issue:update', 'Request.Assign'),
  validate(assignIssueSchema),
  issueRequestController.assignIssue
);

router.post(
  '/:id/status',
  authorizePermissions('Issue.Resolve', 'Issue.Update', 'issue:update', 'Request.Resolve'),
  validate(updateStatusSchema),
  issueRequestController.updateStatus
);

router.post(
  '/:id/cancel',
  authorizePermissions('Issue.Cancel', 'Issue.Delete', 'issue:delete', 'Request.Close'),
  validate(cancelIssueSchema),
  issueRequestController.cancelIssue
);

router.post(
  '/:id/reopen',
  authorizePermissions('Issue.Update', 'issue:update', 'Request.Update'),
  issueRequestController.reopenIssue
);

router.post(
  '/:id/feedback',
  authorizePermissions('Request.Read', 'Issue.Read.Own', 'Issue.Read.Company', 'issue:read'),
  issueRequestController.submitFeedback
);

router.get(
  '/:id/feedback',
  authorizePermissions('Request.Read', 'Issue.Read.Own', 'Issue.Read.Company', 'issue:read'),
  issueRequestController.getFeedback
);

router.delete(
  '/:id',
  authorizePermissions('Issue.Delete', 'issue:delete', 'Request.Close'),
  issueRequestController.deleteIssue
);

export default router;

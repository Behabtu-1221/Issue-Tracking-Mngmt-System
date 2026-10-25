import { Router } from 'express';
import issueRequestRoutes from './routes/issue-request.routes.js';
import issueInvestigationRoutes from './routes/issue-investigation.routes.js';
import issueResolutionRoutes from './routes/issue-resolution.routes.js';
import issueCommentRoutes from './routes/issue-comment.routes.js';

const router = Router();

router.use('/issues', issueRequestRoutes);
router.use('/issue-investigations', issueInvestigationRoutes);
router.use('/issue-resolutions', issueResolutionRoutes);
router.use('/issue-comments', issueCommentRoutes);

export default {
  name: 'IssueManagementModule',
  basePath: '/api',
  router
};

import { Router } from 'express';
import approvalRoutes from './routes/approval.routes.js';
import approvalDelegationRoutes from './routes/approval-delegation.routes.js';
import approvalRuleRoutes from './routes/approval-rule.routes.js';
import approvalGroupRoutes from './routes/approval-group.routes.js';

const router = Router();

router.use('/approvals', approvalRoutes);
router.use('/approval-delegations', approvalDelegationRoutes);
router.use('/approval-rules', approvalRuleRoutes);
router.use('/approval-groups', approvalGroupRoutes);

export default {
  name: 'ApprovalModule',
  basePath: '/api',
  router
};

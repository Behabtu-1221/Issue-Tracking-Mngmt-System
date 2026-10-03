import { Router } from 'express';
import authenticate from '../../shared/middleware/authenticate.js';
import dataScope from '../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../shared/middleware/authorize.js';
import departmentRoutes from './routes/department.routes.js';
import teamRoutes from './routes/team.routes.js';
import positionRoutes from './routes/position.routes.js';
import employeeAssignmentRoutes from './routes/employee-assignment.routes.js';
import reportingHierarchyRoutes from './routes/reporting-hierarchy.routes.js';
import budgetCostCenterRoutes from './routes/budget-cost-center.routes.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

const orgMutationGuard = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER')(req, res, next);
  }
  next();
};

router.use('/departments', orgMutationGuard, departmentRoutes);
router.use('/teams', orgMutationGuard, teamRoutes);
router.use('/positions', orgMutationGuard, positionRoutes);
router.use('/employee-assignments', orgMutationGuard, employeeAssignmentRoutes);
router.use('/reporting-hierarchies', orgMutationGuard, reportingHierarchyRoutes);
router.use('/financials', orgMutationGuard, budgetCostCenterRoutes);

export default {
  name: 'OrganizationalStructureModule',
  basePath: '/api',
  router
};

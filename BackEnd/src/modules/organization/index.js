import { Router } from 'express';
import departmentRoutes from './routes/department.routes.js';
import teamRoutes from './routes/team.routes.js';
import positionRoutes from './routes/position.routes.js';
import employeeAssignmentRoutes from './routes/employee-assignment.routes.js';
import reportingHierarchyRoutes from './routes/reporting-hierarchy.routes.js';
import budgetCostCenterRoutes from './routes/budget-cost-center.routes.js';

const router = Router();

router.use('/departments', departmentRoutes);
router.use('/teams', teamRoutes);
router.use('/positions', positionRoutes);
router.use('/employee-assignments', employeeAssignmentRoutes);
router.use('/reporting-hierarchies', reportingHierarchyRoutes);
router.use('/financials', budgetCostCenterRoutes);

export default {
  name: 'OrganizationalStructureModule',
  basePath: '/api',
  router
};

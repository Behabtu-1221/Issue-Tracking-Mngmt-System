import { Router } from 'express';
import slaClockController from '../controllers/sla-clock.controller.js';
import slaPolicyController from '../controllers/sla-policy.controller.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

const adminRoles = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER'];
const staffRoles = ['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER', 'TECHNICIAN', 'DISPATCHER'];

// Metrics & Clocks
router.get('/overview', slaClockController.getOverviewMetrics);
router.get('/clocks', slaClockController.findAllClocks);
router.get('/clocks/:id', slaClockController.findClockById);
router.post('/clocks', authorizeRoles(...staffRoles), slaClockController.startClock);
router.post('/clocks/:id/pause', authorizeRoles(...staffRoles), slaClockController.pauseClock);
router.post('/clocks/:id/resume', authorizeRoles(...staffRoles), slaClockController.resumeClock);

// Policies
router.get('/policies', slaPolicyController.getPolicies);
router.get('/policies/:id', slaPolicyController.getPolicyById);
router.post('/policies', authorizeRoles(...adminRoles), slaPolicyController.createPolicy);

// Breaches
router.get('/breaches', slaClockController.findAllBreaches);
router.post('/breaches/:id/acknowledge', authorizeRoles(...staffRoles), slaClockController.acknowledgeBreach);

export default router;

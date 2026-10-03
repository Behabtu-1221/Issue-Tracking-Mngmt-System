import { Router } from 'express';
import slaClockController from '../controllers/sla-clock.controller.js';
import slaPolicyController from '../controllers/sla-policy.controller.js';

const router = Router();

// Metrics & Clocks
router.get('/overview', slaClockController.getOverviewMetrics);
router.get('/clocks', slaClockController.findAllClocks);
router.get('/clocks/:id', slaClockController.findClockById);
router.post('/clocks', slaClockController.startClock);
router.post('/clocks/:id/pause', slaClockController.pauseClock);
router.post('/clocks/:id/resume', slaClockController.resumeClock);

// Policies
router.get('/policies', slaPolicyController.getPolicies);
router.get('/policies/:id', slaPolicyController.getPolicyById);
router.post('/policies', slaPolicyController.createPolicy);

// Breaches
router.get('/breaches', slaClockController.findAllBreaches);
router.post('/breaches/:id/acknowledge', slaClockController.acknowledgeBreach);

export default router;

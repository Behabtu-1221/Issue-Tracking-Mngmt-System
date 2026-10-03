import { Router } from 'express';
import assignmentController from '../controllers/assignment.controller.js';
import technicianController from '../controllers/technician.controller.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizePermissions } from '../../../shared/middleware/authorize.js';

const router = Router();

// Enforce Authentication & Row-Level Data Scope evaluation for all dispatch endpoints
router.use(authenticate);
router.use(dataScope);

// Metrics & Queue
router.get('/overview', authorizePermissions('Issue.Assign', 'Report.View'), assignmentController.getOverviewMetrics);
router.get('/unassigned', authorizePermissions('Issue.Assign', 'Issue.Dispatch'), assignmentController.getUnassignedQueue);

// Assignments
router.get('/assignments', authorizePermissions('Issue.Assign', 'Issue.Read.Assigned', 'Issue.Read.Company', 'Issue.Read.All'), assignmentController.getAssignments);
router.get('/assignments/:id', authorizePermissions('Issue.Assign', 'Issue.Read.Assigned', 'Issue.Read.Company', 'Issue.Read.All'), assignmentController.getAssignmentById);
router.post('/assign/manual', authorizePermissions('Issue.Assign', 'Issue.Dispatch'), assignmentController.manualAssign);
router.post('/assign/auto', authorizePermissions('Issue.Assign', 'Issue.Dispatch'), assignmentController.autoAssign);

// Technician Field Execution Actions
router.post('/assignments/:id/accept', authorizePermissions('Issue.AcceptAssignment', 'Issue.Read.Assigned', 'Issue.Resolve'), assignmentController.acceptAssignment);
router.post('/assignments/:id/reject', authorizePermissions('Issue.AcceptAssignment', 'Issue.Read.Assigned', 'Issue.Resolve'), assignmentController.rejectAssignment);
router.post('/assignments/:id/start', authorizePermissions('Issue.Update.Assigned', 'Issue.Read.Assigned', 'Issue.Resolve'), assignmentController.startWork);
router.post('/assignments/:id/pause', authorizePermissions('Issue.Update.Assigned', 'Issue.Read.Assigned', 'Issue.Resolve'), assignmentController.pauseWork);
router.post('/assignments/:id/complete', authorizePermissions('Issue.Resolve', 'Issue.Update.Assigned'), assignmentController.completeWork);
router.post('/assignments/:id/escalate', authorizePermissions('Issue.Escalate.Assigned', 'Issue.Read.Assigned', 'Issue.Resolve'), assignmentController.escalateWork);
router.get('/my-workbench', authorizePermissions('Issue.Read.Assigned', 'Issue.Resolve'), assignmentController.getMyAssignedRequests);

// Technicians & Roster
router.get('/technicians', authorizePermissions('Issue.Assign', 'Department.Read', 'User.Read.Company'), technicianController.getTechnicians);
router.post('/technicians/availability', authorizePermissions('Issue.Read.Assigned', 'Issue.Assign'), technicianController.updateAvailability);
router.post('/technicians/location', authorizePermissions('Issue.Read.Assigned', 'Issue.Assign'), technicianController.updateLocation);

export default router;

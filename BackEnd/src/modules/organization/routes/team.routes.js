import { Router } from 'express';
import teamController from '../controllers/team.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizePermissions } from '../../../shared/middleware/authorize.js';
import { createTeamSchema, updateTeamSchema } from '../validators/organization.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/eligible-technicians', authorizePermissions('Department.Read', 'Issue.Assign'), teamController.getEligibleTechnicians);
router.get('/workload-summary', authorizePermissions('Department.Read', 'Issue.Assign'), teamController.getTeamWorkloadSummary);

router.get('/', authorizePermissions('Department.Read', 'Issue.Assign'), teamController.getTeams);
router.get('/:id', authorizePermissions('Department.Read', 'Issue.Assign'), teamController.getTeamById);
router.post('/', authorizePermissions('Department.Read', 'Issue.Assign'), validate(createTeamSchema), teamController.createTeam);
router.put('/:id', authorizePermissions('Department.Read', 'Issue.Assign'), validate(updateTeamSchema), teamController.updateTeam);
router.delete('/:id', authorizePermissions('Department.Read', 'Issue.Assign'), teamController.deleteTeam);

router.get('/:id/members', authorizePermissions('Department.Read', 'Issue.Assign'), teamController.getTeamMembers);
router.post('/:id/members', authorizePermissions('Department.Read', 'Issue.Assign'), teamController.addTeamMember);
router.delete('/:id/members/:userId', authorizePermissions('Department.Read', 'Issue.Assign'), teamController.removeTeamMember);

export default router;

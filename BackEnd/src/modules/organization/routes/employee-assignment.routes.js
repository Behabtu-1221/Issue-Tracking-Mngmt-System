import { Router } from 'express';
import employeeAssignmentController from '../controllers/employee-assignment.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createEmployeeAssignmentSchema, updateEmployeeAssignmentSchema } from '../validators/organization.validator.js';

const router = Router();

router.get('/', employeeAssignmentController.getAssignments);
router.get('/:id', employeeAssignmentController.getAssignmentById);
router.post('/', validate(createEmployeeAssignmentSchema), employeeAssignmentController.createAssignment);
router.put('/:id', validate(updateEmployeeAssignmentSchema), employeeAssignmentController.updateAssignment);
router.delete('/:id', employeeAssignmentController.deleteAssignment);

export default router;

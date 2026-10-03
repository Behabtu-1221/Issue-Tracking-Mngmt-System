import { Router } from 'express';
import departmentController from '../controllers/department.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/organization.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', validate(createDepartmentSchema), departmentController.createDepartment);
router.put('/:id', validate(updateDepartmentSchema), departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

// Department Location Mappings
router.get('/:id/locations', departmentController.getLocations);
router.post('/:id/locations', departmentController.addLocation);
router.delete('/locations/:locId', departmentController.removeLocation);

export default router;

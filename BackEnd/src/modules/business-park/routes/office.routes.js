import { Router } from 'express';
import officeController from '../controllers/office.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createOfficeSchema, updateOfficeSchema, updateOfficeStatusSchema } from '../validators/park.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN'));

router.get('/', officeController.getOffices);
router.get('/:id', officeController.getOfficeById);
router.post('/', validate(createOfficeSchema), officeController.createOffice);
router.put('/:id', validate(updateOfficeSchema), officeController.updateOffice);
router.patch('/:id/status', validate(updateOfficeStatusSchema), officeController.updateStatus);
router.delete('/:id', officeController.deleteOffice);

export default router;

import { Router } from 'express';
import tenantContactController from '../controllers/tenant-contact.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createContactSchema, updateContactSchema } from '../validators/tenant.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', tenantContactController.getContacts);
router.get('/:id', tenantContactController.getContactById);
router.post('/', validate(createContactSchema), tenantContactController.createContact);
router.put('/:id', validate(updateContactSchema), tenantContactController.updateContact);
router.delete('/:id', tenantContactController.deleteContact);

export default router;

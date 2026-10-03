import { Router } from 'express';
import subTenantController from '../controllers/sub-tenant.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createSubTenantSchema, updateSubTenantSchema } from '../validators/tenant.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', subTenantController.getSubTenants);
router.get('/:id', subTenantController.getSubTenantById);
router.post('/', validate(createSubTenantSchema), subTenantController.createSubTenant);
router.put('/:id', validate(updateSubTenantSchema), subTenantController.updateSubTenant);
router.delete('/:id', subTenantController.deleteSubTenant);

export default router;

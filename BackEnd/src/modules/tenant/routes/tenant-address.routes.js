import { Router } from 'express';
import tenantAddressController from '../controllers/tenant-address.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { createAddressSchema, updateAddressSchema } from '../validators/tenant.validator.js';

import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', tenantAddressController.getAddresses);
router.get('/:id', tenantAddressController.getAddressById);
router.post('/', validate(createAddressSchema), tenantAddressController.createAddress);
router.put('/:id', validate(updateAddressSchema), tenantAddressController.updateAddress);
router.delete('/:id', tenantAddressController.deleteAddress);

export default router;

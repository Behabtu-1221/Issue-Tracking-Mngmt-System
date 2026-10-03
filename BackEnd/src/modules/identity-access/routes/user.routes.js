import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';
import userController from '../controllers/user.controller.js';
import {
  createUserSchema,
  getUsersQuerySchema,
  idParamSchema,
  updateUserSchema,
  updateUserStatusSchema
} from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

router.get('/', validate(getUsersQuerySchema, 'query'), userController.getUsers);
router.post('/', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'TENANT_ADMIN', 'COMPANY_ADMIN'), validate(createUserSchema), userController.createUser);

router.get('/:id', validate(idParamSchema, 'params'), userController.getUserById);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), userController.updateUser);
router.patch('/:id/status', validate(idParamSchema, 'params'), authorizeRoles('SUPER_ADMIN', 'ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'TENANT_ADMIN', 'COMPANY_ADMIN'), validate(updateUserStatusSchema), userController.updateUserStatus);
router.delete('/:id', validate(idParamSchema, 'params'), authorizeRoles('SUPER_ADMIN', 'ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'TENANT_ADMIN', 'COMPANY_ADMIN'), userController.deleteUser);

router.get('/:id/sessions', validate(idParamSchema, 'params'), userController.getUserSessions);
router.delete('/:id/sessions', validate(idParamSchema, 'params'), authorizeRoles('SUPER_ADMIN', 'ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'TENANT_ADMIN', 'COMPANY_ADMIN'), userController.terminateUserSessions);
router.get('/:id/login-history', validate(idParamSchema, 'params'), validate(getUsersQuerySchema, 'query'), userController.getUserLoginHistory);

export default router;

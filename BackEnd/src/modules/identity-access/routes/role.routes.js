import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';
import roleController from '../controllers/role.controller.js';
import {
  assignRolesSchema,
  createRoleSchema,
  getRolesQuerySchema,
  idParamSchema,
  syncPermissionsSchema,
  updateRoleSchema,
  userRoleParamsSchema
} from '../validators/role.validator.js';

const router = Router();

router.use(authenticate);

router.get('/permissions', roleController.getAllPermissions);
router.get('/audit-logs', roleController.getRbacAuditLogs);
router.get('/', validate(getRolesQuerySchema, 'query'), roleController.getRoles);
router.post('/', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'PARK_ADMIN'), validate(createRoleSchema), roleController.createRole);

router.post('/assign', authorizeRoles('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'PARK_ADMIN'), roleController.assignRolesToUser);
router.get('/:id', validate(idParamSchema, 'params'), roleController.getRoleById);
router.put('/:id', validate(idParamSchema, 'params'), authorizeRoles('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'PARK_ADMIN'), validate(updateRoleSchema), roleController.updateRole);
router.delete('/:id', validate(idParamSchema, 'params'), authorizeRoles('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'PARK_ADMIN'), roleController.deleteRole);
router.put('/:id/permissions', validate(idParamSchema, 'params'), authorizeRoles('SUPER_ADMIN', 'ADMIN', 'PARK_ADMIN'), roleController.updateRolePermissions);

router.post('/users/:id/assign', validate(idParamSchema, 'params'), authorizeRoles('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'PARK_ADMIN'), validate(assignRolesSchema), roleController.assignRolesToUser);
router.delete('/users/:id/roles/:roleId', validate(userRoleParamsSchema, 'params'), authorizeRoles('SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'PARK_ADMIN'), roleController.removeRoleFromUser);

export default router;

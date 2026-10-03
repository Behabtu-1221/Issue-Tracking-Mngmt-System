import { Router } from 'express';
import serviceGovernanceController from '../controllers/service-governance.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles } from '../../../shared/middleware/authorize.js';
import {
  createServiceVisibilitySchema,
  createServiceDepartmentSchema,
  upsertServiceSLASchema,
  createServiceApprovalRuleSchema
} from '../validators/service-catalog.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

const adminOnly = authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'DEPARTMENT_MANAGER');

// Visibility
router.get('/visibility/service/:serviceId', serviceGovernanceController.getVisibilityByServiceId);
router.post('/visibility', adminOnly, validate(createServiceVisibilitySchema), serviceGovernanceController.createVisibility);
router.delete('/visibility/:id', adminOnly, serviceGovernanceController.deleteVisibility);

// Department Mapping
router.get('/departments/service/:serviceId', serviceGovernanceController.getDepartmentsByServiceId);
router.post('/departments', adminOnly, validate(createServiceDepartmentSchema), serviceGovernanceController.createServiceDepartment);
router.delete('/departments/:id', adminOnly, serviceGovernanceController.deleteServiceDepartment);

// SLA Mapping
router.get('/sla/service/:serviceId', serviceGovernanceController.getSLAByServiceId);
router.post('/sla', adminOnly, validate(upsertServiceSLASchema), serviceGovernanceController.upsertSLA);
router.delete('/sla/:id', adminOnly, serviceGovernanceController.deleteSLA);

// Approval Rules
router.get('/approval-rules/service/:serviceId', serviceGovernanceController.getApprovalRulesByServiceId);
router.post('/approval-rules', adminOnly, validate(createServiceApprovalRuleSchema), serviceGovernanceController.createApprovalRule);
router.delete('/approval-rules/:id', adminOnly, serviceGovernanceController.deleteApprovalRule);

export default router;

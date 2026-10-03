import { Router } from 'express';
import serviceGovernanceController from '../controllers/service-governance.controller.js';
import validate from '../../../shared/middleware/validate.js';
import {
  createServiceVisibilitySchema,
  createServiceDepartmentSchema,
  upsertServiceSLASchema,
  createServiceApprovalRuleSchema
} from '../validators/service-catalog.validator.js';

const router = Router();

// Visibility
router.get('/visibility/service/:serviceId', serviceGovernanceController.getVisibilityByServiceId);
router.post('/visibility', validate(createServiceVisibilitySchema), serviceGovernanceController.createVisibility);
router.delete('/visibility/:id', serviceGovernanceController.deleteVisibility);

// Department Mapping
router.get('/departments/service/:serviceId', serviceGovernanceController.getDepartmentsByServiceId);
router.post('/departments', validate(createServiceDepartmentSchema), serviceGovernanceController.createServiceDepartment);
router.delete('/departments/:id', serviceGovernanceController.deleteServiceDepartment);

// SLA Mapping
router.get('/sla/service/:serviceId', serviceGovernanceController.getSLAByServiceId);
router.post('/sla', validate(upsertServiceSLASchema), serviceGovernanceController.upsertSLA);
router.delete('/sla/:id', serviceGovernanceController.deleteSLA);

// Approval Rules
router.get('/approval-rules/service/:serviceId', serviceGovernanceController.getApprovalRulesByServiceId);
router.post('/approval-rules', validate(createServiceApprovalRuleSchema), serviceGovernanceController.createApprovalRule);
router.delete('/approval-rules/:id', serviceGovernanceController.deleteApprovalRule);

export default router;

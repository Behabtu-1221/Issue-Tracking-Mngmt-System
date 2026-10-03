import { Router } from 'express';
import reportingController from '../controllers/reporting.controller.js';
import validate from '../../../shared/middleware/validate.js';
import { authorizePermissions } from '../../../shared/middleware/authorize.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import {
  reportFilterSchema,
  createSavedReportSchema,
  updateSavedReportSchema,
  createReportScheduleSchema,
  updateReportScheduleSchema
} from '../validators/reporting.validator.js';

const router = Router();

router.use(authenticate);
router.use(dataScope);

// ── Analytics & Overview Dashboards ──
router.get(
  '/dashboard/executive',
  authorizePermissions('Report.View', 'Issue.Read.Own', 'Issue.Read.Company', 'Issue.Read'),
  validate(reportFilterSchema, 'query'),
  reportingController.getExecutiveOverview
);

router.get(
  '/requests',
  authorizePermissions('Report.View', 'Issue.Read.Own', 'Issue.Read.Company', 'Issue.Read'),
  validate(reportFilterSchema, 'query'),
  reportingController.getRequestAnalytics
);

router.get(
  '/assignments',
  authorizePermissions('Report.View', 'Issue.Assign', 'Issue.Read.Assigned'),
  validate(reportFilterSchema, 'query'),
  reportingController.getAssignmentAnalytics
);

router.get(
  '/sla',
  authorizePermissions('Report.View', 'Issue.Read'),
  validate(reportFilterSchema, 'query'),
  reportingController.getSLAAnalytics
);

router.get(
  '/tenants',
  authorizePermissions('Report.View', 'Tenant.Read'),
  validate(reportFilterSchema, 'query'),
  reportingController.getTenantPerformance
);

router.get(
  '/departments',
  authorizePermissions('Report.View', 'Department.Read'),
  validate(reportFilterSchema, 'query'),
  reportingController.getDepartmentPerformance
);

router.get(
  '/approvals',
  authorizePermissions('Report.View', 'Issue.Approve'),
  validate(reportFilterSchema, 'query'),
  reportingController.getApprovalAnalytics
);

router.get(
  '/audit',
  authorizePermissions('Report.View', 'Audit.Read'),
  validate(reportFilterSchema, 'query'),
  reportingController.getAuditAnalytics
);

router.get(
  '/knowledge',
  authorizePermissions('Report.View', 'Knowledge.Read'),
  reportingController.getKnowledgeAnalytics
);

// ── Universal Export Endpoint ──
router.get(
  '/export/:reportType',
  authorizePermissions('Report.Export', 'Report.View'),
  reportingController.exportReport
);

// ── Saved Reports CRUD ──
router.get(
  '/saved',
  authorizePermissions('Report.View'),
  reportingController.getSavedReports
);

router.post(
  '/saved',
  authorizePermissions('Report.Create', 'Report.View'),
  validate(createSavedReportSchema),
  reportingController.createSavedReport
);

router.put(
  '/saved/:id',
  authorizePermissions('Report.Create', 'Report.View'),
  validate(updateSavedReportSchema),
  reportingController.updateSavedReport
);

router.delete(
  '/saved/:id',
  authorizePermissions('Report.Create', 'Report.View'),
  reportingController.deleteSavedReport
);

// ── Report Schedules CRUD & Execution ──
router.get(
  '/schedules',
  authorizePermissions('Report.Schedule', 'Report.View'),
  reportingController.getReportSchedules
);

router.post(
  '/schedules',
  authorizePermissions('Report.Schedule', 'Report.View'),
  validate(createReportScheduleSchema),
  reportingController.createReportSchedule
);

router.put(
  '/schedules/:id',
  authorizePermissions('Report.Schedule', 'Report.View'),
  validate(updateReportScheduleSchema),
  reportingController.updateReportSchedule
);

router.delete(
  '/schedules/:id',
  authorizePermissions('Report.Schedule', 'Report.View'),
  reportingController.deleteReportSchedule
);

router.post(
  '/schedules/:id/trigger',
  authorizePermissions('Report.Schedule', 'Report.View'),
  reportingController.triggerScheduleExecution
);

router.get(
  '/executions',
  authorizePermissions('Report.View', 'Audit.Read'),
  reportingController.getExecutionHistory
);

export default router;

import Joi from 'joi';

// ── Standard Report Query Filters ──
export const reportFilterSchema = Joi.object({
  dateRange: Joi.string().valid('TODAY', '7D', '30D', '90D', 'YTD', '1Y', 'CUSTOM').optional(),
  startDate: Joi.string().isoDate().optional().allow('', null),
  endDate: Joi.string().isoDate().optional().allow('', null),
  tenantId: Joi.number().integer().positive().optional().allow('', null),
  departmentId: Joi.number().integer().positive().optional().allow('', null),
  teamId: Joi.number().integer().positive().optional().allow('', null),
  assignedUserId: Joi.number().integer().positive().optional().allow('', null),
  requesterUserId: Joi.number().integer().positive().optional().allow('', null),
  priority: Joi.string().valid('P1', 'P2', 'P3', 'P4', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW').optional().allow('', null),
  status: Joi.string().optional().allow('', null),
  serviceCategoryId: Joi.number().integer().positive().optional().allow('', null),
  serviceId: Joi.number().integer().positive().optional().allow('', null),
  search: Joi.string().max(200).optional().allow('', null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(50),
  sortBy: Joi.string().max(50).default('CreatedDate'),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
  format: Joi.string().valid('JSON', 'CSV', 'EXCEL', 'PDF').default('JSON')
});

// ── Saved Report Definition ──
export const createSavedReportSchema = Joi.object({
  TenantID: Joi.number().integer().positive().optional().allow(null),
  ReportName: Joi.string().trim().max(150).required(),
  Description: Joi.string().trim().max(500).optional().allow('', null),
  ReportTypeCode: Joi.string().trim().max(50).valid(
    'EXECUTIVE_SUMMARY',
    'REQUEST_ANALYTICS',
    'WORKLOAD_ANALYTICS',
    'SLA_ANALYTICS',
    'ESCALATION_ANALYTICS',
    'TENANT_ANALYTICS',
    'DEPARTMENT_ANALYTICS',
    'APPROVAL_ANALYTICS',
    'AUDIT_ANALYTICS',
    'KB_ANALYTICS',
    'CUSTOM'
  ).required(),
  ConfigJson: Joi.object().optional().allow(null),
  VisibilityCode: Joi.string().valid('PRIVATE', 'TEAM', 'DEPARTMENT', 'COMPANY', 'BUSINESS_PARK').default('PRIVATE')
});

export const updateSavedReportSchema = Joi.object({
  ReportName: Joi.string().trim().max(150).optional(),
  Description: Joi.string().trim().max(500).optional().allow('', null),
  ReportTypeCode: Joi.string().trim().max(50).optional(),
  ConfigJson: Joi.object().optional().allow(null),
  VisibilityCode: Joi.string().valid('PRIVATE', 'TEAM', 'DEPARTMENT', 'COMPANY', 'BUSINESS_PARK').optional(),
  IsActive: Joi.number().valid(0, 1).optional()
});

// ── Report Schedule Definition ──
export const createReportScheduleSchema = Joi.object({
  SavedReportID: Joi.number().integer().positive().optional().allow(null),
  TenantID: Joi.number().integer().positive().optional().allow(null),
  ScheduleName: Joi.string().trim().max(150).required(),
  ReportTypeCode: Joi.string().trim().max(50).default('EXECUTIVE_SUMMARY'),
  FrequencyCode: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY').default('WEEKLY'),
  CronExpression: Joi.string().trim().max(50).optional().allow('', null),
  RecipientsJson: Joi.array().items(Joi.string().email()).min(1).required(),
  ExportFormat: Joi.string().valid('CSV', 'EXCEL', 'PDF').default('CSV'),
  Status: Joi.string().valid('ACTIVE', 'PAUSED', 'DISABLED').default('ACTIVE')
});

export const updateReportScheduleSchema = Joi.object({
  SavedReportID: Joi.number().integer().positive().optional().allow(null),
  ScheduleName: Joi.string().trim().max(150).optional(),
  ReportTypeCode: Joi.string().trim().max(50).optional(),
  FrequencyCode: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY').optional(),
  CronExpression: Joi.string().trim().max(50).optional().allow('', null),
  RecipientsJson: Joi.array().items(Joi.string().email()).min(1).optional(),
  ExportFormat: Joi.string().valid('CSV', 'EXCEL', 'PDF').optional(),
  Status: Joi.string().valid('ACTIVE', 'PAUSED', 'DISABLED').optional(),
  IsActive: Joi.number().valid(0, 1).optional()
});

export default {
  reportFilterSchema,
  createSavedReportSchema,
  updateSavedReportSchema,
  createReportScheduleSchema,
  updateReportScheduleSchema
};

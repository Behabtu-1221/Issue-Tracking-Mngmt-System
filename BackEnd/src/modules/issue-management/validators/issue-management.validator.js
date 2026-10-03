import Joi from 'joi';

// ── Issue Request Submission & Updates ──
export const createIssueRequestSchema = Joi.object({
  TenantID: Joi.number().integer().allow(null, ''),
  ServiceCategoryID: Joi.number().integer().allow(null, ''),
  ServiceID: Joi.number().integer().allow(null, ''),
  Title: Joi.string().trim().max(255).required(),
  Description: Joi.string().trim().max(2000).required(),
  RequestTypeCode: Joi.string().trim().valid('COMPLAINT', 'MAINTENANCE', 'INCIDENT', 'DISRUPTION', 'SERVICE_REQUEST', 'GENERAL').default('INCIDENT'),
  PriorityCode: Joi.string().trim().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL').default('MEDIUM'),
  StatusCode: Joi.string().trim().valid('NEW', 'PENDING_APPROVAL', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'CANCELLED').default('NEW'),
  RequestChannelCode: Joi.string().trim().valid('WEB', 'MOBILE', 'EMAIL', 'QR').default('WEB'),
  CategoryCode: Joi.string().trim().max(50).allow(null, '').default('GENERAL'),
  SubCategoryCode: Joi.string().trim().max(50).allow(null, ''),
  RequestSourceCode: Joi.string().trim().valid('TENANT', 'EMPLOYEE', 'GUEST').default('EMPLOYEE'),
  RequesterUserID: Joi.number().integer().required(),
  BuildingID: Joi.number().integer().allow(null, ''),
  OfficeSpaceID: Joi.number().integer().allow(null, ''),
  AssignedDepartmentID: Joi.number().integer().allow(null, ''),
  TargetResolutionDateTime: Joi.date().iso().allow(null, ''),
  IsMajorIncident: Joi.number().integer().valid(0, 1).default(0),
  EstimatedCost: Joi.number().allow(null, '', 0).default(0),
  CustomFieldsDataJson: Joi.any().allow(null)
});

export const updateIssueRequestSchema = Joi.object({
  Title: Joi.string().trim().max(255),
  Description: Joi.string().trim().max(2000),
  PriorityCode: Joi.string().trim().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
  StatusCode: Joi.string().trim().valid('NEW', 'PENDING_APPROVAL', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'CANCELLED'),
  BuildingID: Joi.number().integer().allow(null, ''),
  OfficeSpaceID: Joi.number().integer().allow(null, ''),
  AssignedDepartmentID: Joi.number().integer().allow(null, ''),
  IsMajorIncident: Joi.number().integer().valid(0, 1),
  CancellationReason: Joi.string().trim().max(1000).allow(null, ''),
  CustomFieldsDataJson: Joi.any().allow(null)
});

export const assignIssueSchema = Joi.object({
  assignedDepartmentId: Joi.number().integer().required(),
  remarks: Joi.string().trim().max(1000).allow(null, '')
});

export const updateStatusSchema = Joi.object({
  statusCode: Joi.string().trim().valid('NEW', 'PENDING_APPROVAL', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'CANCELLED').required(),
  remarks: Joi.string().trim().max(1000).allow(null, '')
});

export const cancelIssueSchema = Joi.object({
  cancellationReason: Joi.string().trim().max(1000).required()
});

// ── Root Cause & Investigation ──
export const saveInvestigationSchema = Joi.object({
  IssueRequestID: Joi.number().integer().required(),
  InvestigatorUserID: Joi.number().integer().allow(null, ''),
  RootCauseSummary: Joi.string().trim().max(1000).required(),
  RootCauseDetails: Joi.string().trim().max(5000).allow(null, ''),
  CorrectiveActionsTaken: Joi.string().trim().max(2000).allow(null, ''),
  PreventiveActionsProposed: Joi.string().trim().max(2000).allow(null, '')
});

// ── Resolution ──
export const saveResolutionSchema = Joi.object({
  IssueRequestID: Joi.number().integer().required(),
  ResolverUserID: Joi.number().integer().allow(null, ''),
  ResolutionTypeCode: Joi.string().trim().valid('WORKAROUND', 'PERMANENT_FIX', 'REPLACEMENT').default('PERMANENT_FIX'),
  ResolutionSummary: Joi.string().trim().max(1000).required(),
  ActionStepsTaken: Joi.string().trim().max(5000).allow(null, ''),
  VerificationNotes: Joi.string().trim().max(1000).allow(null, '')
});

// ── Comments ──
export const createCommentSchema = Joi.object({
  IssueRequestID: Joi.number().integer().required(),
  UserID: Joi.number().integer().allow(null, ''),
  CommentText: Joi.string().trim().max(2000).required(),
  IsInternal: Joi.number().integer().valid(0, 1).default(0)
});

// ── Known Issues ──
export const createKnownIssueSchema = Joi.object({
  Title: Joi.string().trim().max(250).required(),
  Symptoms: Joi.string().trim().max(2000).required(),
  Workaround: Joi.string().trim().max(2000).allow(null, ''),
  PermanentSolution: Joi.string().trim().max(2000).allow(null, ''),
  CategoryCode: Joi.string().trim().max(50).default('GENERAL'),
  SearchKeywords: Joi.string().trim().max(500).allow(null, '')
});

export const updateKnownIssueSchema = Joi.object({
  Title: Joi.string().trim().max(250),
  Symptoms: Joi.string().trim().max(2000),
  Workaround: Joi.string().trim().max(2000).allow(null, ''),
  PermanentSolution: Joi.string().trim().max(2000).allow(null, ''),
  CategoryCode: Joi.string().trim().max(50),
  SearchKeywords: Joi.string().trim().max(500).allow(null, '')
});

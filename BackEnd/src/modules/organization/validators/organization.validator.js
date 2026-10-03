import Joi from 'joi';

// Department
export const createDepartmentSchema = Joi.object({
  OrganizationUnitID: Joi.number().integer().positive().allow(null, ''),
  DepartmentCode: Joi.string().max(30).required(),
  DepartmentName: Joi.string().max(150).required(),
  ManagerUserID: Joi.number().integer().positive().allow(null, ''),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateDepartmentSchema = createDepartmentSchema.fork(
  ['DepartmentCode', 'DepartmentName'],
  (schema) => schema.optional()
);

// Team
export const createTeamSchema = Joi.object({
  DepartmentID: Joi.number().integer().positive().required(),
  TeamCode: Joi.string().max(30).required(),
  TeamName: Joi.string().max(150).required(),
  LeaderUserID: Joi.number().integer().positive().allow(null, ''),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateTeamSchema = createTeamSchema.fork(
  ['DepartmentID', 'TeamCode', 'TeamName'],
  (schema) => schema.optional()
);

// Position
export const createPositionSchema = Joi.object({
  OrganizationUnitID: Joi.number().integer().positive().allow(null, ''),
  DepartmentID: Joi.number().integer().positive().allow(null, ''),
  PositionCode: Joi.string().max(30).required(),
  PositionTitle: Joi.string().max(150).required(),
  Description: Joi.string().max(500).allow('', null),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updatePositionSchema = createPositionSchema.fork(
  ['PositionCode', 'PositionTitle'],
  (schema) => schema.optional()
);

// Employee Assignment
export const createEmployeeAssignmentSchema = Joi.object({
  UserID: Joi.number().integer().positive().required(),
  DepartmentID: Joi.number().integer().positive().required(),
  TeamID: Joi.number().integer().positive().allow(null),
  PositionID: Joi.number().integer().positive().allow(null),
  IsPrimary: Joi.number().valid(0, 1).default(1),
  JoinedDate: Joi.date().iso().required(),
  LeftDate: Joi.date().iso().allow(null),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateEmployeeAssignmentSchema = createEmployeeAssignmentSchema.fork(
  ['UserID', 'DepartmentID', 'JoinedDate'],
  (schema) => schema.optional()
);

// Reporting Hierarchy
export const createReportingHierarchySchema = Joi.object({
  EmployeeUserID: Joi.number().integer().positive().required(),
  SupervisorUserID: Joi.number().integer().positive().required(),
  ReportingTypeCode: Joi.string().valid('DIRECT', 'MATRIX').default('DIRECT'),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateReportingHierarchySchema = createReportingHierarchySchema.fork(
  ['EmployeeUserID', 'SupervisorUserID'],
  (schema) => schema.optional()
);

// Cost Center
export const createCostCenterSchema = Joi.object({
  TenantID: Joi.number().integer().positive().allow(null),
  CostCenterCode: Joi.string().max(50).required(),
  CostCenterName: Joi.string().max(150).required(),
  Description: Joi.string().max(500).allow('', null),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateCostCenterSchema = createCostCenterSchema.fork(
  ['CostCenterCode', 'CostCenterName'],
  (schema) => schema.optional()
);

// Department Budget
export const createDepartmentBudgetSchema = Joi.object({
  DepartmentID: Joi.number().integer().positive().required(),
  CostCenterID: Joi.number().integer().positive().allow(null),
  FiscalYear: Joi.number().integer().min(2000).max(2100).required(),
  AllocatedAmount: Joi.number().positive().precision(2).required(),
  RemainingAmount: Joi.number().min(0).precision(2).allow(null),
  CurrencyCode: Joi.string().max(10).default('ETB'),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateDepartmentBudgetSchema = createDepartmentBudgetSchema.fork(
  ['DepartmentID', 'FiscalYear', 'AllocatedAmount'],
  (schema) => schema.optional()
);

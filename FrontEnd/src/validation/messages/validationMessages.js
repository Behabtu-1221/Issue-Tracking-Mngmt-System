/**
 * Centralized Validation Messages (i18n-ready)
 * Messages are decoupled from validation logic for internationalization support.
 */

export const VALIDATION_MESSAGES = {
  required: (field) => `${field} is required.`,
  selectRequired: (field) => `Please select a ${field}.`,
  minLength: (field, min) => `${field} must be at least ${min} characters.`,
  maxLength: (field, max) => `${field} cannot exceed ${max} characters.`,
  invalidFormat: (field) => `Please enter a valid ${field}.`,
  invalidEmail: 'Please enter a valid email address (e.g., user@domain.com).',
  invalidUsername: 'Username can only contain letters, numbers, dots, underscores, and hyphens.',
  invalidPhone: 'Please enter a valid international phone number.',
  invalidUrl: 'Please enter a valid web URL starting with http:// or https://.',
  passwordMismatch: 'New password and confirm password do not match.',
  passwordMinLength: (min = 8) => `Password must be at least ${min} characters long.`,
  fileTooLarge: (maxMB = 10) => `File size exceeds the maximum limit of ${maxMB} MB.`,
  fileTypeNotAllowed: 'File format is not supported. Allowed formats: PDF, PNG, JPG, DOCX, XLSX, TXT, CSV.',
  fileCountExceeded: (maxCount = 5) => `You can upload a maximum of ${maxCount} files at once.`,
  filenameTooLong: (maxLen = 150) => `Filename exceeds maximum allowed length of ${maxLen} characters.`,
  rangeMin: (field, min) => `${field} must be greater than or equal to ${min}.`,
  rangeMax: (field, max) => `${field} cannot exceed ${max}.`,
  numberRequired: (field) => `${field} must be a valid number.`,
  integerRequired: (field) => `${field} must be a whole integer.`
};

/**
 * Internationally Professional & Contextually Customized Validation Messages
 * Specially tailored for Business Park Topology Subitems:
 * - Facility Zones
 * - Buildings
 * - Floors
 * - Office Spaces / Suites
 * - Campus Locations
 */
export const BUSINESS_PARK_MESSAGES = {
  zone: {
    parkRequired: 'Business park is required.',
    nameRequired: 'Facility zone name is required.',
    nameMinLength: (min = 2) => `Zone name must be at least ${min} characters.`,
    nameMaxLength: (max = 100) => `Zone name cannot exceed ${max} characters.`,
    codeRequired: 'Facility zone code is required.',
    codeFormat: 'Zone code format is invalid (e.g. ZN-01).',
    zoneTypeInvalid: 'Please select a valid zone type.',
    capacityLimitPositive: 'Capacity limit must be at least 1.',
    descriptionMaxLength: (max = 2000) => `Description cannot exceed ${max} characters.`
  },
  building: {
    parkRequired: 'Business park is required.',
    zoneRequired: 'Facility zone is required.',
    zoneMismatch: 'Selected zone does not belong to this business park.',
    nameRequired: 'Building name is required.',
    nameMinLength: (min = 2) => `Building name must be at least ${min} characters.`,
    nameMaxLength: (max = 100) => `Building name cannot exceed ${max} characters.`,
    codeRequired: 'Building code is required.',
    codeFormat: 'Building code format is invalid (e.g. BLD-A1).',
    floorsRequired: 'Number of floors is required.',
    floorsRange: (min = 1, max = 200) => `Number of floors must be between ${min} and ${max}.`,
    areaPositive: 'Building area must be a positive number.',
    descriptionMaxLength: (max = 2000) => `Description cannot exceed ${max} characters.`
  },
  floor: {
    buildingRequired: 'Building is required.',
    nameRequired: 'Floor level name is required.',
    nameMinLength: (min = 2) => `Floor name must be at least ${min} characters.`,
    nameMaxLength: (max = 100) => `Floor name cannot exceed ${max} characters.`,
    numberRequired: 'Floor level number is required.',
    numberPositive: 'Floor level number must be at least 1.',
    numberExceedsCapacity: (floorNum, maxFloors, bldgName = 'the building') =>
      `Floor ${floorNum} exceeds building capacity of ${maxFloors} floors.`,
    codeFormat: 'Floor code format is invalid (e.g. FLR-1).',
    codeMaxLength: (max = 20) => `Floor code cannot exceed ${max} characters.`,
    officeSpacesPositive: 'Office capacity must be 0 or greater.',
    areaPositive: 'Floor area must be a positive number.',
    descriptionMaxLength: (max = 2000) => `Description cannot exceed ${max} characters.`
  },
  office: {
    floorRequired: 'Floor level is required.',
    numberRequired: 'Office number is required.',
    numberFormat: 'Office number format is invalid (e.g. OF-101).',
    nameMinLength: (min = 2) => `Office name must be at least ${min} characters.`,
    nameMaxLength: (max = 100) => `Office name cannot exceed ${max} characters.`,
    areaPositive: 'Office area must be greater than 0.',
    rentRateNonNegative: 'Monthly rent must be 0 or greater.',
    occupancyPositive: 'Max occupancy must be at least 1 person.',
    statusInvalid: 'Please select a valid availability status.',
    capacityReached: (floorName, maxOffices) =>
      `Floor has reached its maximum capacity of ${maxOffices} office spaces.`,
    descriptionMaxLength: (max = 2000) => `Description cannot exceed ${max} characters.`
  },
  campusLocation: {
    parkRequired: 'Business park is required.',
    nameRequired: 'Location name is required.',
    nameMinLength: (min = 2) => `Location name must be at least ${min} characters.`,
    nameMaxLength: (max = 100) => `Location name cannot exceed ${max} characters.`,
    codeRequired: 'Location code is required.',
    codeFormat: 'Location code format is invalid.',
    gpsFormat: 'GPS format must be latitude, longitude (e.g. 9.0123, 38.7654).',
    categoryInvalid: 'Please select a valid location type.',
    descriptionMaxLength: (max = 2000) => `Description cannot exceed ${max} characters.`
  }
};

/**
 * Qualified & Internationally Accepted Short, Precise Validation Messages
 * Specially tailored for Tenant & Leasing Submodules:
 * - Tenants (Company profile, legal info)
 * - Leases (Contracts, terms, financial values)
 * - Space Allocations (Scope, office assignments)
 * - Tenant Contacts & Addresses
 * - Sub-Tenants
 */
export const TENANT_LEASING_MESSAGES = {
  tenant: {
    companyNameRequired: 'Company name is required.',
    companyNameLength: (min = 2, max = 150) => `Company name must be between ${min} and ${max} characters.`,
    tenantCodeRequired: 'Tenant code is required.',
    tenantCodeFormat: 'Tenant code must be 2-30 characters (letters, numbers, hyphens, underscores).',
    parkRequired: 'Business park is required.',
    tenantTypeRequired: 'Tenant type is required.',
    registrationNumberLength: (min = 3, max = 50) => `Registration number must be between ${min} and ${max} characters.`,
    taxIdLength: (min = 5, max = 30) => `Tax ID (TIN) must be between ${min} and ${max} characters.`,
    emailFormat: 'Please enter a valid email address.',
    phoneFormat: 'Please enter a valid phone number.',
    websiteFormat: 'Please enter a valid URL (e.g. https://example.com).',
    statusInvalid: 'Please select a valid tenant status.',
    descriptionMaxLength: (max = 1000) => `Description cannot exceed ${max} characters.`
  },
  lease: {
    tenantRequired: 'Tenant is required.',
    agreementNumberRequired: 'Agreement number is required.',
    agreementNumberLength: (min = 3, max = 50) => `Agreement number must be between ${min} and ${max} characters.`,
    startDateRequired: 'Start date is required.',
    endDateRequired: 'End date is required.',
    endDateAfterStart: 'End date must be after start date.',
    executionDateRequired: 'Execution date is required.',
    executionDateBeforeStart: 'Execution date cannot be after the lease start date.',
    monthlyRentRequired: 'Monthly rent amount is required.',
    monthlyRentPositive: 'Monthly rent must be greater than 0.',
    securityDepositNonNegative: 'Security deposit must be 0 or greater.',
    gracePeriodNonNegative: 'Grace period must be 0 or greater.',
    gracePeriodLimit: 'Grace period cannot exceed 365 days.',
    terminationReasonRequired: 'Termination reason is required.',
    terminationReasonMin: (min = 5) => `Termination reason must be at least ${min} characters.`,
    statusInvalid: 'Please select a valid lease status.'
  },
  allocation: {
    tenantRequired: 'Target tenant is required.',
    scopeRequired: 'Allocation scope is required.',
    officeRequired: 'Please select a vacant office space unit.',
    floorRequired: 'Please select a floor level.',
    buildingRequired: 'Please select a building block.',
    allocatedDateRequired: 'Allocation date is required.',
    noVacantOffices: 'The selected space has no vacant office units available for allocation.',
    releaseRemarksRequired: 'Release reason / remarks is required.',
    releaseRemarksMin: (min = 3) => `Remarks must be at least ${min} characters.`,
    releaseRemarksMaxLength: (max = 1000) => `Remarks cannot exceed ${max} characters.`
  },
  contact: {
    tenantRequired: 'Tenant is required.',
    typeRequired: 'Contact channel type is required.',
    labelRequired: 'Contact label / title is required.',
    labelLength: (min = 2, max = 100) => `Contact label must be between ${min} and ${max} characters.`,
    valueRequired: 'Contact value is required.',
    emailInvalid: 'Please enter a valid email address (e.g. name@domain.com).',
    phoneInvalid: 'Please enter a valid phone number (e.g. +251 91 123 4567).'
  },
  address: {
    tenantRequired: 'Tenant is required.',
    typeRequired: 'Address type is required.',
    countryRequired: 'Country is required.',
    countryLength: (min = 2, max = 100) => `Country must be between ${min} and ${max} characters.`,
    cityRequired: 'City is required.',
    cityLength: (min = 2, max = 100) => `City must be between ${min} and ${max} characters.`,
    addressLine1Required: 'Address line 1 is required.',
    addressLine1Length: (min = 3, max = 255) => `Address line 1 must be between ${min} and ${max} characters.`
  },
  subTenant: {
    parentTenantRequired: 'Parent tenant is required.',
    companyNameRequired: 'Sub-tenant company name is required.',
    companyNameLength: (min = 2, max = 150) => `Sub-tenant name must be between ${min} and ${max} characters.`,
    relationshipTypeRequired: 'Relationship type is required.',
    registrationNumberLength: (min = 3, max = 50) => `Registration number must be between ${min} and ${max} characters.`
  }
};

/**
 * Standardized, Short, Precise & Descriptive Messages for Service Catalog Subitems:
 * - Service Categories (Categorization & Tenant Scoping)
 * - Service Offerings (Core services, codes, unit costs)
 * - Category Department Mappings (Cross-module routing)
 * - Service Pricing (Billing types, rate models, precision)
 * - Service Requirements (Custom dynamic fields & attachments)
 * - Service Governance (Responsible departments & approval rules)
 */
export const SERVICE_CATALOG_MESSAGES = {
  category: {
    nameRequired: 'Category name is required.',
    nameLength: (min = 2, max = 150) => `Category name must be between ${min} and ${max} characters.`,
    codeRequired: 'Category code is required.',
    codeFormat: 'Category code must be uppercase alphanumeric (e.g. CAT-IT-01).',
    codeLength: (min = 2, max = 50) => `Category code must be between ${min} and ${max} characters.`,
    descriptionMaxLength: (max = 1000) => `Description cannot exceed ${max} characters.`,
    tenantInvalid: 'Please select a valid tenant organization or keep global.'
  },
  offering: {
    categoryRequired: 'Select a service category.',
    codeRequired: 'Service code is required.',
    codeFormat: 'Service code must be uppercase alphanumeric (e.g. SVC-HVAC-01).',
    codeLength: (min = 2, max = 50) => `Service code must be between ${min} and ${max} characters.`,
    nameRequired: 'Service title / name is required.',
    nameLength: (min = 3, max = 150) => `Service name must be between ${min} and ${max} characters.`,
    costNegative: 'Estimated unit cost cannot be negative.',
    costPrecision: 'Estimated unit cost can have at most 2 decimal places.',
    currencyRequired: 'Currency code is required.',
    descriptionMaxLength: (max = 1000) => `Scope description cannot exceed ${max} characters.`
  },
  mapping: {
    categoryRequired: 'Select a service category.',
    departmentRequired: 'Select a responsible department.',
    duplicateMapping: 'This service category is already mapped to the selected department.'
  },
  pricing: {
    serviceRequired: 'Select a service offering to configure pricing.',
    pricingModelRequired: 'Select a pricing model.',
    billingTypeRequired: 'Select a billing classification.',
    unitPriceNegative: 'Unit price cannot be negative.',
    unitPricePrecision: 'Unit price can have at most 2 decimal places.',
    unitPriceRequiredForBillable: 'Unit price must be greater than 0 for billable services.',
    unitPriceFreeWarning: 'Free service pricing model requires a 0.00 unit price.'
  },
  requirementField: {
    fieldNameRequired: 'System field name identifier is required.',
    fieldNameFormat: 'Field identifier must start with a letter and contain only letters, numbers, or underscores (e.g. serial_number).',
    fieldNameLength: (min = 2, max = 100) => `Field identifier must be between ${min} and ${max} characters.`,
    fieldLabelRequired: 'User-facing field label is required.',
    fieldLabelLength: (min = 2, max = 100) => `Field label must be between ${min} and ${max} characters.`,
    fieldTypeRequired: 'Select a field input type.',
    displayOrderPositive: 'Display order must be 0 or a positive whole integer.'
  },
  requirementAttachment: {
    attachmentNameRequired: 'Attachment requirement name is required.',
    attachmentNameLength: (min = 2, max = 100) => `Attachment name must be between ${min} and ${max} characters.`,
    allowedExtensionsRequired: 'Specify at least one allowed extension (e.g. pdf, docx, png).',
    allowedExtensionsFormat: 'Extensions must be comma-separated alphanumeric codes (e.g. pdf, jpg, png, docx).',
    maxFileSizeRange: (min = 1, max = 100) => `File size limit must be between ${min} MB and ${max} MB.`,
    descriptionMaxLength: (max = 500) => `Description cannot exceed ${max} characters.`
  },
  governance: {
    departmentRequired: 'Select a department to assign.',
    departmentAlreadyAssigned: 'This department is already assigned to this service offering.',
    ruleNameRequired: 'Approval rule name is required.',
    ruleNameLength: (min = 3, max = 150) => `Rule name must be between ${min} and ${max} characters.`,
    stagesCountRange: (min = 1, max = 10) => `Required approval stages must be between ${min} and ${max}.`,
    autoApproveNonNegative: 'Auto-approve threshold cannot be negative.',
    autoApprovePrecision: 'Auto-approve threshold can have at most 2 decimal places.'
  }
};

/**
 * Standardized, Short, Precise & Descriptive Messages for Issue Management Module:
 * - Issue Requests (Create / Edit ticket requests)
 * - Department & Technician Assignment
 * - Status Transitions & Hold/Cancellation
 * - Root Cause Investigation
 * - Resolution & Verification
 * - Internal / External Comments
 * - Known Issues Knowledge Base
 * - Service Feedback & Quality Ratings
 */
export const ISSUE_MANAGEMENT_MESSAGES = {
  request: {
    titleRequired: 'Request title is required.',
    titleLength: (min = 3, max = 255) => `Title must be between ${min} and ${max} characters.`,
    descriptionRequired: 'Detailed issue description is required.',
    descriptionLength: (min = 10, max = 2000) => `Description must be between ${min} and ${max} characters.`,
    categoryRequired: 'Select a service category.',
    serviceRequired: 'Select a service catalog offering.',
    priorityRequired: 'Select an urgency / priority level.',
    requestTypeRequired: 'Select a request classification type.',
    requesterRequired: 'Requester user ID is required.',
    locationLength: (max = 150) => `Location cannot exceed ${max} characters.`,
    categoryCodeLength: (max = 50) => `Category code cannot exceed ${max} characters.`
  },
  assignment: {
    departmentRequired: 'Select a target fulfillment department.',
    remarksMaxLength: (max = 1000) => `Assignment remarks cannot exceed ${max} characters.`,
    technicianRequired: 'Select an assigned technician or support team.'
  },
  statusUpdate: {
    statusRequired: 'Select a target status transition.',
    statusInvalid: 'Status transition is not allowed from the current state.',
    remarksRequiredForHoldOrCancel: 'Remarks or justification is required when putting on hold or cancelling.',
    remarksMaxLength: (max = 1000) => `Remarks cannot exceed ${max} characters.`
  },
  cancellation: {
    reasonRequired: 'Cancellation reason is required.',
    reasonLength: (min = 5, max = 1000) => `Cancellation reason must be between ${min} and ${max} characters.`
  },
  investigation: {
    rootCauseSummaryRequired: 'Root cause summary is required.',
    rootCauseSummaryLength: (min = 5, max = 1000) => `Root cause summary must be between ${min} and ${max} characters.`,
    detailsMaxLength: (max = 5000) => `Investigation details cannot exceed ${max} characters.`,
    correctiveActionsMaxLength: (max = 2000) => `Corrective actions cannot exceed ${max} characters.`,
    preventiveActionsMaxLength: (max = 2000) => `Preventive actions cannot exceed ${max} characters.`
  },
  resolution: {
    typeRequired: 'Select a resolution type.',
    summaryRequired: 'Resolution summary is required.',
    summaryLength: (min = 5, max = 1000) => `Resolution summary must be between ${min} and ${max} characters.`,
    actionStepsMaxLength: (max = 5000) => `Action steps cannot exceed ${max} characters.`,
    verificationNotesMaxLength: (max = 1000) => `Verification notes cannot exceed ${max} characters.`
  },
  comment: {
    textRequired: 'Comment text cannot be empty.',
    textMaxLength: (max = 2000) => `Comment cannot exceed ${max} characters.`
  },
  knownIssue: {
    titleRequired: 'Known issue title is required.',
    titleLength: (min = 3, max = 250) => `Title must be between ${min} and ${max} characters.`,
    symptomsRequired: 'Observable symptoms description is required.',
    symptomsLength: (min = 5, max = 2000) => `Symptoms must be between ${min} and ${max} characters.`,
    workaroundMaxLength: (max = 2000) => `Workaround cannot exceed ${max} characters.`,
    permanentSolutionMaxLength: (max = 2000) => `Permanent solution cannot exceed ${max} characters.`,
    categoryCodeMaxLength: (max = 50) => `Category code cannot exceed ${max} characters.`,
    searchKeywordsMaxLength: (max = 500) => `Search keywords cannot exceed ${max} characters.`
  },
  feedback: {
    ratingRequired: 'Please select an overall satisfaction rating.',
    commentsMaxLength: (max = 1000) => `Feedback comments cannot exceed ${max} characters.`
  }
};

/**
 * Standardized, Short, Precise & Descriptive Messages for Approval Module:
 * - Approval Workflows (Pipeline stages, request linkage, titles)
 * - Decision Submissions (Approval, rejection, return with mandatory comments)
 * - Approval Delegations (Temporary signing delegation windows)
 * - Governance Rules (Financial cost thresholds and policies)
 * - Approver Groups (Multi-user signing groups)
 */
export const APPROVAL_MESSAGES = {
  workflow: {
    requestIdRequired: 'Issue request ID is required.',
    requestIdPositive: 'Issue request ID must be a positive integer.',
    titleRequired: 'Workflow title is required.',
    titleLength: (min = 3, max = 250) => `Workflow title must be between ${min} and ${max} characters.`,
    descriptionMaxLength: (max = 1000) => `Justification & context cannot exceed ${max} characters.`,
    stagesMinLength: 'At least one approval stage is required in the pipeline.',
    approverRequired: (stage) => `Stage ${stage}: Please assign an approver user or approver group.`,
    approverUserIdPositive: (stage) => `Stage ${stage}: Approver user ID must be a positive integer.`,
    approverGroupIdPositive: (stage) => `Stage ${stage}: Approver group ID must be a positive integer.`
  },
  decision: {
    decisionRequired: 'Please select an approval decision action.',
    decisionInvalid: 'Invalid approval decision code.',
    commentsRequiredForRejectOrReturn: 'Justification comments are required when rejecting or returning for correction.',
    commentsMaxLength: (max = 1000) => `Decision comments cannot exceed ${max} characters.`
  },
  delegation: {
    delegatorRequired: 'Delegator user ID is required.',
    delegatorPositive: 'Delegator user ID must be a positive integer.',
    delegateeRequired: 'Delegatee user ID is required.',
    delegateePositive: 'Delegatee user ID must be a positive integer.',
    sameUserDelegation: 'Delegatee cannot be the same user as the delegator.',
    startDateRequired: 'Start date & time is required.',
    endDateRequired: 'End date & time is required.',
    endDateAfterStartDate: 'End date & time must be after the start date & time.',
    reasonMaxLength: (max = 500) => `Delegation reason cannot exceed ${max} characters.`
  },
  rule: {
    ruleNameRequired: 'Governance rule name is required.',
    ruleNameLength: (min = 3, max = 150) => `Governance rule name must be between ${min} and ${max} characters.`,
    descriptionMaxLength: (max = 1000) => `Policy description cannot exceed ${max} characters.`,
    minCostNegative: 'Minimum cost threshold cannot be negative.',
    minCostPrecision: 'Minimum cost threshold can have at most 2 decimal places.',
    maxCostNegative: 'Maximum cost threshold cannot be negative.',
    maxCostPrecision: 'Maximum cost threshold can have at most 2 decimal places.',
    maxCostGreaterThanMin: 'Maximum cost threshold must be greater than or equal to minimum cost.'
  },
  group: {
    groupNameRequired: 'Approver group name is required.',
    groupNameLength: (min = 2, max = 150) => `Approver group name must be between ${min} and ${max} characters.`,
    descriptionMaxLength: (max = 500) => `Group description cannot exceed ${max} characters.`
  }
};

/**
 * Standardized, Short, Precise & Descriptive Messages for Dispatch Module:
 * - Dispatch Assignments (Individual technician & Team dispatching)
 * - Field Execution Actions (Accept, Decline, Pause, Complete, Escalate)
 * - Technician Teams & Rosters (Team profile, code, leader, member assignments)
 * - Technician Availability & Workload
 */
export const DISPATCH_MESSAGES = {
  assignment: {
    requestIdRequired: 'Issue request identifier is required.',
    requestIdPositive: 'Issue request ID must be a positive integer.',
    technicianRequired: 'Please select a field technician from the roster.',
    teamRequired: 'Please select a technician work team.',
    remarksMaxLength: (max = 1000) => `Dispatch remarks cannot exceed ${max} characters.`
  },
  execution: {
    rejectionReasonRequired: 'Decline justification reason is required.',
    rejectionReasonLength: (min = 5, max = 500) => `Decline reason must be between ${min} and ${max} characters.`,
    pauseReasonRequired: 'Pause reason is required (e.g. Awaiting spare parts or site access).',
    pauseReasonLength: (min = 3, max = 500) => `Pause reason must be between ${min} and ${max} characters.`,
    workNotesRequired: 'Work completion notes and test results are required.',
    workNotesLength: (min = 5, max = 2000) => `Work completion notes must be between ${min} and ${max} characters.`,
    resolutionTypeRequired: 'Select a resolution classification type.',
    resolutionSummaryRequired: 'Resolution summary is required.',
    resolutionSummaryLength: (min = 5, max = 1000) => `Resolution summary must be between ${min} and ${max} characters.`,
    escalateReasonRequired: 'Escalation reason is required.',
    escalateReasonLength: (min = 5, max = 250) => `Escalation reason must be between ${min} and ${max} characters.`,
    escalateDetailsMaxLength: (max = 1000) => `Escalation details cannot exceed ${max} characters.`
  },
  team: {
    teamNameRequired: 'Team name is required.',
    teamNameLength: (min = 3, max = 150) => `Team name must be between ${min} and ${max} characters.`,
    teamCodeRequired: 'Team code is required.',
    teamCodeFormat: 'Team code must be alphanumeric with hyphens or underscores (e.g. TEAM-HVAC-01).',
    teamCodeLength: (min = 2, max = 50) => `Team code must be between ${min} and ${max} characters.`,
    descriptionMaxLength: (max = 1000) => `Description cannot exceed ${max} characters.`,
    leaderInvalid: 'Please select a valid team lead technician or leave unassigned.',
    memberSelectRequired: 'Please select an eligible department technician to add.',
    memberAlreadyExists: 'This technician is already a member of this work team.'
  },
  roster: {
    statusInvalid: 'Please select a valid availability status (AVAILABLE, BUSY, ON_LEAVE, OFFLINE).'
  }
};

/**
 * Standardized, Short, Precise & Descriptive Messages for SLA & Escalation Modules:
 * - SLA Policies & Priority Target Thresholds
 * - Live SLA Countdown Clocks & Pauses
 * - SLA Breach Acknowledgment
 * - Technical Escalations to Management/Dispatch
 * - Diagnostic Investigations & Root Cause Findings
 * - Structured Work Order Resolutions
 * - Requester Information Inquiries
 */
export const SLA_ESCALATION_MESSAGES = {
  policy: {
    nameRequired: 'SLA policy name is required.',
    nameLength: (min = 3, max = 100) => `Policy name must be between ${min} and ${max} characters.`,
    descriptionMaxLength: (max = 1000) => `Description cannot exceed ${max} characters.`,
    stagesRequired: 'At least one priority level target is required for an SLA policy.',
    stageDuplicatePriority: (priority) => `Duplicate priority tier "${priority}" found in policy targets.`,
    priorityCodeRequired: 'Priority tier code is required.',
    targetResponseRequired: 'Target response time is required.',
    targetResponsePositive: 'Target response time must be at least 1 minute.',
    targetResponseMax: (max = 43200) => `Target response time cannot exceed ${max} minutes (30 days).`,
    targetResolutionRequired: 'Target resolution time is required.',
    targetResolutionPositive: 'Target resolution time must be at least 1 minute.',
    targetResolutionMax: (max = 43200) => `Target resolution time cannot exceed ${max} minutes (30 days).`,
    resolutionMustBeGreaterOrEqual: 'Target resolution time must be greater than or equal to target response time.'
  },
  clock: {
    pauseReasonRequired: 'A valid pause reason is required to pause the SLA countdown.',
    pauseReasonLength: (min = 5, max = 500) => `Pause reason must be between ${min} and ${max} characters.`,
    resumeNotesMaxLength: (max = 500) => `Resume notes cannot exceed ${max} characters.`
  },
  breach: {
    acknowledgmentNotesMaxLength: (max = 500) => `Acknowledgment notes cannot exceed ${max} characters.`
  },
  escalation: {
    reasonRequired: 'Escalation reason is required.',
    reasonLength: (min = 5, max = 250) => `Escalation reason must be between ${min} and ${max} characters.`,
    detailsMaxLength: (max = 1000) => `Technical explanation cannot exceed ${max} characters.`
  },
  investigation: {
    rootCauseSummaryRequired: 'Root cause summary is required.',
    rootCauseSummaryLength: (min = 5, max = 500) => `Root cause summary must be between ${min} and ${max} characters.`,
    rootCauseDetailsMaxLength: (max = 2000) => `Diagnostic details cannot exceed ${max} characters.`,
    correctiveActionsMaxLength: (max = 2000) => `Corrective actions cannot exceed ${max} characters.`
  },
  resolution: {
    summaryRequired: 'Resolution summary is required.',
    summaryLength: (min = 5, max = 2000) => `Resolution summary must be between ${min} and ${max} characters.`,
    typeRequired: 'Please select a valid resolution type.',
    actionStepsMaxLength: (max = 2000) => `Action steps cannot exceed ${max} characters.`,
    verificationNotesMaxLength: (max = 1000) => `Verification notes cannot exceed ${max} characters.`
  },
  infoRequest: {
    messageRequired: 'Information request message is required.',
    messageLength: (min = 5, max = 1000) => `Information request message must be between ${min} and ${max} characters.`
  }
};

/**
 * Enterprise Production-Ready Organization Management Validation Messages
 * Tailored for:
 * - Departments & Business Units
 * - Office Space Location Mappings
 * - Operational Teams & Job Positions
 * - Employee Assignments & Reporting Hierarchies
 * - Cost Centers & Department Budgets
 */
export const ORGANIZATION_MESSAGES = {
  department: {
    codeRequired: 'Department code is required.',
    codeFormat: 'Department code must be 2–30 letters, numbers, or hyphens (e.g. DEPT-101).',
    nameRequired: 'Department name is required.',
    nameLength: (min = 2, max = 100) => `Department name must be between ${min} and ${max} characters.`,
    parkRequired: 'Please select a valid business park.',
    descriptionMaxLength: (max = 1000) => `Description cannot exceed ${max} characters.`
  },
  location: {
    officeRequired: 'Please select an office space to map to this department.'
  },
  team: {
    departmentRequired: 'Please select a department for this team.',
    codeRequired: 'Team code is required.',
    codeFormat: 'Team code must be 2–30 letters, numbers, or hyphens (e.g. TM-101).',
    nameRequired: 'Team name is required.',
    nameLength: (min = 2, max = 100) => `Team name must be between ${min} and ${max} characters.`,
    descriptionMaxLength: (max = 500) => `Description cannot exceed ${max} characters.`
  },
  position: {
    codeRequired: 'Position code is required.',
    codeFormat: 'Position code must be 2–30 letters, numbers, or hyphens (e.g. POS-101).',
    titleRequired: 'Position title is required.',
    titleLength: (min = 2, max = 100) => `Position title must be between ${min} and ${max} characters.`,
    descriptionMaxLength: (max = 500) => `Description cannot exceed ${max} characters.`
  },
  assignment: {
    userRequired: 'Please select an employee.',
    departmentRequired: 'Please select a department.',
    joinedDateRequired: 'Joined date is required.',
    joinedDateFormat: 'Joined date must be a valid date (YYYY-MM-DD).'
  },
  hierarchy: {
    employeeRequired: 'Please select an employee.',
    supervisorRequired: 'Please select a supervisor.',
    cannotReportToSelf: 'An employee cannot be designated as their own supervisor.',
    reportingTypeRequired: 'Please select a valid reporting type.'
  },
  costCenter: {
    codeRequired: 'Cost center code is required.',
    codeFormat: 'Cost center code must be 2–30 letters, numbers, or hyphens (e.g. CC-101).',
    nameRequired: 'Cost center name is required.',
    nameLength: (min = 2, max = 100) => `Cost center name must be between ${min} and ${max} characters.`,
    descriptionMaxLength: (max = 500) => `Description cannot exceed ${max} characters.`
  },
  budget: {
    departmentRequired: 'Please select a department.',
    fiscalYearRequired: 'Fiscal year is required.',
    fiscalYearRange: (min = 2000, max = 2100) => `Fiscal year must be between ${min} and ${max}.`,
    allocatedAmountRequired: 'Allocated budget amount is required.',
    allocatedAmountPositive: 'Allocated budget amount must be greater than 0.',
    remainingAmountInvalid: 'Remaining budget amount must be a positive number or zero.',
    remainingExceedsAllocated: 'Remaining budget cannot exceed total allocated amount.',
    currencyRequired: 'Please select a valid currency code.'
  }
};

/**
 * Enterprise Production-Ready Role & RBAC Governance Validation Messages
 * Tailored for:
 * - Role Definitions (Creation, Editing, Code, Title, Scope Description)
 * - Permission Assignments & Matrix Configuration
 * - User Role Allocations & Authority Grants
 */
export const ROLE_RBAC_MESSAGES = {
  role: {
    titleRequired: 'Role title is required.',
    titleLength: (min = 2, max = 100) => `Role title must be between ${min} and ${max} characters.`,
    codeRequired: 'Role code is required.',
    codeFormat: 'Role code must be 2–50 uppercase letters, numbers, or underscores (e.g. OPERATIONS_MANAGER).',
    codeLength: (min = 2, max = 50) => `Role code must be between ${min} and ${max} characters.`,
    descriptionMaxLength: (max = 500) => `Role scope description cannot exceed ${max} characters.`,
    permissionsRequired: 'At least one permission must be granted to this role.',
    protectedRoleNotice: 'Protected core system roles cannot be decommissioned or have their system code altered.'
  },
  assignment: {
    userRequired: 'Please select an employee to allocate role authority.',
    roleRequired: 'Please select a system or custom security role.',
    tenantRequired: 'Please select a valid tenant scope for this role assignment.'
  }
};



-- ============================================================================
-- ENTERPRISE ISSUE TRACKING & SERVICE REQUEST MANAGEMENT SYSTEM
-- MASTER PRODUCTION SEED DATA (ETHIOPIAN IT PARK CAMPUS)
-- ============================================================================
-- Prerequisite : Run Database.sql first on the target database
-- Engine       : MySQL 8.0+ / InnoDB / utf8mb4
-- Architecture :
--   1. Single Business Park: Ethiopian IT Park (ICT_PARK_AA)
--   2. All users belong to this one Business Park campus
--   3. Tenants do NOT have generic sub-users; each registered tenant has only
--      authorized TENANT REPRESENTATIVE(S) registered by the Park Admin.
--   4. Business Park has multiple departments with their own staff:
--      - Department Managers
--      - Maintenance & IT Technicians
--      - Park Employees / Staff
--   5. Exactly FIVE core roles across the entire system:
--      1. SUPER_ADMIN (Administrator)
--      2. DEPARTMENT_MANAGER (Department Manager)
--      3. TECHNICIAN (Technician)
--      4. EMPLOYEE (Employee)
--      5. TENANT_REPRESENTATIVE (Tenant Representative for each registered tenant)
--   6. User provisioning captures: DepartmentID, RoleID, Full Name, Age, Gender
-- ============================================================================
-- Default login credentials for all seeded accounts:
--   Password : Admin@123
--   Accounts :
--     - superadmin      : Business Park Super Administrator (Role 1: SUPER_ADMIN)
--     - facility        : Head of Campus Facilities (Role 2: DEPARTMENT_MANAGER)
--     - ithelpdesk      : IT Infrastructure & Support Lead (Role 2: DEPARTMENT_MANAGER)
--     - technician      : Senior Maintenance Technician (Role 3: TECHNICIAN)
--     - ittechnician    : Senior Network Engineer (Role 3: TECHNICIAN)
--     - dispatcher      : Central Campus Employee / Dispatch (Role 4: EMPLOYEE)
--     - tenantadmin     : Acme Technologies Tenant Representative (Role 5: TENANT_REPRESENTATIVE)
--     - betatenant      : Beta Logistics Ltd Tenant Representative (Role 5: TENANT_REPRESENTATIVE)
--     - safaricomadmin  : Safaricom Ethiopia Tech Operations Lead (Role 5: TENANT_REPRESENTATIVE)
--     - employee        : Ethio Telecom Data Center Division Rep (Role 5: TENANT_REPRESENTATIVE)
-- ============================================================================

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Idempotent re-seed cleanup (deletes seeded rows by primary IDs in reverse order)
-- ---------------------------------------------------------------------------
DELETE FROM IssueRequestFeedback WHERE FeedbackID BETWEEN 1 AND 50;
DELETE FROM Resolution WHERE ResolutionID BETWEEN 1 AND 50;
DELETE FROM ReportExecutionHistory WHERE ExecutionID BETWEEN 1 AND 50;
DELETE FROM ReportSchedule WHERE ReportScheduleID BETWEEN 1 AND 50;
DELETE FROM SavedReport WHERE SavedReportID BETWEEN 1 AND 50;
DELETE FROM UserNotification WHERE UserNotificationID BETWEEN 1 AND 50;
DELETE FROM NotificationRecipient WHERE NotificationRecipientID BETWEEN 1 AND 50;
DELETE FROM Notification WHERE NotificationID BETWEEN 1 AND 50;
DELETE FROM sys_document_categories WHERE CategoryID BETWEEN 1 AND 50;
DELETE FROM ServiceCategoryDepartmentMapping WHERE MappingID BETWEEN 1 AND 50;
DELETE FROM DepartmentBudget WHERE DepartmentBudgetID BETWEEN 1 AND 50;
DELETE FROM CostCenter WHERE CostCenterID BETWEEN 1 AND 50;

DELETE FROM ApprovalDecision WHERE ApprovalStageID BETWEEN 1 AND 50;
DELETE FROM ApprovalStage WHERE ApprovalID BETWEEN 1 AND 50;
DELETE FROM Approval WHERE ApprovalID BETWEEN 1 AND 50;
DELETE FROM ApprovalMember WHERE ApprovalGroupID BETWEEN 1 AND 50;
DELETE FROM ApprovalGroup WHERE ApprovalGroupID BETWEEN 1 AND 50;
DELETE FROM ApprovalRule WHERE ApprovalRuleID BETWEEN 1 AND 50;

DELETE FROM ServiceApprovalRule WHERE ServiceID BETWEEN 1 AND 50;
DELETE FROM IssueRequestHistory WHERE IssueRequestID BETWEEN 1 AND 50;
DELETE FROM IssueRequestComment WHERE IssueRequestID BETWEEN 1 AND 50;
DELETE FROM AssignmentHistory WHERE AssignmentID BETWEEN 1 AND 50;
DELETE FROM Assignment WHERE AssignmentID BETWEEN 1 AND 50;
DELETE FROM SLAClock WHERE IssueRequestID BETWEEN 1 AND 50;
DELETE FROM IssueRequest WHERE IssueRequestID BETWEEN 1 AND 50;

DELETE FROM ServiceSLA WHERE ServiceID BETWEEN 1 AND 50;
DELETE FROM ServiceWorkflow WHERE ServiceID BETWEEN 1 AND 50;
DELETE FROM ServiceDepartment WHERE ServiceID BETWEEN 1 AND 50;
DELETE FROM Service WHERE ServiceID BETWEEN 1 AND 50;
DELETE FROM ServiceCategory WHERE ServiceCategoryID BETWEEN 1 AND 50;

DELETE FROM EscalationRecipient WHERE EscalationRuleID BETWEEN 1 AND 50;
DELETE FROM EscalationRule WHERE EscalationRuleID BETWEEN 1 AND 50;
DELETE FROM SLAStage WHERE SLAPolicyID BETWEEN 1 AND 50;
DELETE FROM SLAPolicy WHERE SLAPolicyID BETWEEN 1 AND 50;
DELETE FROM PauseReason WHERE PauseReasonID BETWEEN 1 AND 50;

DELETE FROM WorkingHour WHERE BusinessCalendarID BETWEEN 1 AND 50;
DELETE FROM HolidayCalendar WHERE BusinessCalendarID BETWEEN 1 AND 50;
DELETE FROM BusinessCalendar WHERE BusinessCalendarID BETWEEN 1 AND 50;

DELETE FROM Dispatcher WHERE DispatcherID BETWEEN 1 AND 50;
DELETE FROM DispatchQueue WHERE DispatchQueueID BETWEEN 1 AND 50;
DELETE FROM TechnicianAvailability WHERE UserID BETWEEN 1 AND 50;
DELETE FROM TechnicianSkill WHERE UserID BETWEEN 1 AND 50;

DELETE FROM UserRole WHERE UserID BETWEEN 1 AND 50;
DELETE FROM RolePermission WHERE RoleID BETWEEN 1 AND 50;
DELETE FROM Permission WHERE PermissionID BETWEEN 1 AND 50;
DELETE FROM `Role` WHERE RoleID BETWEEN 1 AND 50;
DELETE FROM PermissionGroup WHERE PermissionGroupID BETWEEN 1 AND 50;
DELETE FROM ResourcePermission WHERE ResourcePermissionID BETWEEN 1 AND 50;
DELETE FROM `Action` WHERE ActionID BETWEEN 1 AND 50;
DELETE FROM `Resource` WHERE ResourceID BETWEEN 1 AND 50;
DELETE FROM SystemModule WHERE SystemModuleID BETWEEN 1 AND 50;

DELETE FROM TenantRepresentative WHERE TenantRepresentativeID BETWEEN 1 AND 50;
DELETE FROM TenantSetting WHERE TenantSettingID BETWEEN 1 AND 50;
DELETE FROM EmployeeAssignment WHERE EmployeeAssignmentID BETWEEN 1 AND 50;
DELETE FROM `Position` WHERE PositionID BETWEEN 1 AND 50;
DELETE FROM Team WHERE TeamID BETWEEN 1 AND 50;
DELETE FROM Department WHERE DepartmentID BETWEEN 1 AND 50;
DELETE FROM OrganizationUnit WHERE OrganizationUnitID BETWEEN 1 AND 50;

DELETE FROM UserAccount WHERE UserAccountID BETWEEN 1 AND 50;
DELETE FROM `User` WHERE UserID BETWEEN 1 AND 50;
DELETE FROM AuthenticationProvider WHERE AuthenticationProviderID BETWEEN 1 AND 50;

DELETE FROM TenantOfficeAllocation WHERE TenantOfficeAllocationID BETWEEN 1 AND 50;
DELETE FROM LeaseAgreement WHERE LeaseAgreementID BETWEEN 1 AND 50;
DELETE FROM TenantContact WHERE TenantContactID BETWEEN 1 AND 50;
DELETE FROM TenantAddress WHERE TenantAddressID BETWEEN 1 AND 50;
DELETE FROM OfficeAllocationHistory WHERE OfficeAllocationHistoryID BETWEEN 1 AND 50;
DELETE FROM Tenant WHERE TenantID BETWEEN 1 AND 50;

DELETE FROM OfficeSpace WHERE OfficeSpaceID BETWEEN 1 AND 50;
DELETE FROM Floor WHERE FloorID BETWEEN 1 AND 50;
DELETE FROM Building WHERE BuildingID BETWEEN 1 AND 50;
DELETE FROM FacilityZone WHERE FacilityZoneID BETWEEN 1 AND 50;
DELETE FROM Location WHERE LocationID BETWEEN 1 AND 50;
DELETE FROM BusinessPark WHERE BusinessParkID BETWEEN 1 AND 50;

DELETE FROM FAQ WHERE FAQID BETWEEN 1 AND 50;
DELETE FROM KnowledgeArticle WHERE KnowledgeArticleID BETWEEN 1 AND 50;
DELETE FROM KnowledgeCategory WHERE KnowledgeCategoryID BETWEEN 1 AND 50;

DELETE FROM NotificationTemplate WHERE NotificationTemplateID BETWEEN 1 AND 50;
DELETE FROM NotificationType WHERE NotificationTypeID BETWEEN 1 AND 50;
DELETE FROM NotificationChannel WHERE NotificationChannelID BETWEEN 1 AND 50;

DELETE FROM AuditEntity WHERE AuditEntityID BETWEEN 1 AND 50;
DELETE FROM AuditAction WHERE AuditActionID BETWEEN 1 AND 50;
DELETE FROM SearchIndex WHERE SearchIndexID BETWEEN 1 AND 50;
DELETE FROM SearchCategory WHERE SearchCategoryID BETWEEN 1 AND 50;
DELETE FROM DocumentType WHERE DocumentTypeID BETWEEN 1 AND 50;
DELETE FROM DocumentCategory WHERE DocumentCategoryID BETWEEN 1 AND 50;

DELETE FROM LookupValue WHERE LookupValueID BETWEEN 1 AND 50;
DELETE FROM LookupType WHERE LookupTypeID BETWEEN 1 AND 50;
DELETE FROM LanguageResource WHERE LocalizationID BETWEEN 1 AND 50;
DELETE FROM Localization WHERE LocalizationID BETWEEN 1 AND 50;
DELETE FROM NumberSequence WHERE NumberSequenceID BETWEEN 1 AND 50;
DELETE FROM BusinessRule WHERE BusinessRuleID BETWEEN 1 AND 50;
DELETE FROM SystemSetting WHERE SystemSettingID BETWEEN 1 AND 50;
DELETE FROM ConfigurationCategory WHERE ConfigurationCategoryID BETWEEN 1 AND 50;
DELETE FROM FeatureFlag WHERE FeatureFlagID BETWEEN 1 AND 50;
DELETE FROM PriorityDefinition WHERE PriorityDefinitionID BETWEEN 1 AND 50;
DELETE FROM StatusDefinition WHERE StatusDefinitionID BETWEEN 1 AND 50;
DELETE FROM Currency WHERE CurrencyID BETWEEN 1 AND 50;
DELETE FROM TimeZone WHERE TimeZoneID BETWEEN 1 AND 50;
DELETE FROM ServiceLevel WHERE ServiceLevelID BETWEEN 1 AND 50;
DELETE FROM ServiceType WHERE ServiceTypeID BETWEEN 1 AND 50;
DELETE FROM OfficeType WHERE OfficeTypeID BETWEEN 1 AND 50;
DELETE FROM TenantType WHERE TenantTypeID BETWEEN 1 AND 50;
DELETE FROM Industry WHERE IndustryID BETWEEN 1 AND 50;

SET @SYS := 1;
-- Verified bcrypt hash for password: Admin@123 (bcryptjs, cost 10)
SET @PWD_HASH := '$2b$10$3qtXTXC6g0qjdcF4L5TsrumsfErSafCiIG9crfix8CeXEm0Yr3LjO';

-- ============================================================================
-- MODULE 18: CONFIGURATION, LOOKUPS & SYSTEM LOCALIZATION
-- ============================================================================

INSERT INTO Industry (IndustryID, IndustryCode, IndustryName, Description, CreatedBy) VALUES
(1, 'TECH', 'Technology & Software', 'Software engineering, cloud infrastructure, and IT services', @SYS),
(2, 'LOGISTICS', 'Supply Chain & Logistics', 'Transport, freight forwarding, and warehousing solutions', @SYS),
(3, 'FINANCE', 'Banking & FinTech', 'Commercial banking, digital payments, and microfinance', @SYS),
(4, 'TELECOM', 'Telecommunications', 'Mobile network operators, data centers, and fiber providers', @SYS);

INSERT INTO TenantType (TenantTypeID, TenantTypeCode, TenantTypeName, Description, CreatedBy) VALUES
(1, 'CORPORATE', 'Corporate Enterprise Tenant', 'Large multinational or major enterprise tenant', @SYS),
(2, 'SME', 'SME / Innovation Hub', 'Small and medium business or tech incubator member', @SYS),
(3, 'GOV_AGENCY', 'Government Agency', 'Public sector or regulatory agency branch', @SYS);

INSERT INTO OfficeType (OfficeTypeID, OfficeTypeCode, OfficeTypeName, Description, CreatedBy) VALUES
(1, 'STANDARD', 'Standard Office', 'Standard corporate open-plan or partitioned office space', @SYS),
(2, 'EXECUTIVE', 'Executive Suite', 'High-finish executive corner suite with meeting area', @SYS),
(3, 'DATA_HALL', 'Colocation Data Hall', 'Climate-controlled, high-density server rack facility', @SYS),
(4, 'LAB_SPACE', 'R&D Innovation Lab', 'Specialized laboratory and engineering testing space', @SYS);

INSERT INTO ServiceType (ServiceTypeID, ServiceTypeCode, ServiceTypeName, Description, CreatedBy) VALUES
(1, 'MAINTENANCE', 'Facility Maintenance', 'Civil, electrical, plumbing, and structural maintenance', @SYS),
(2, 'IT', 'Information Technology', 'Network connectivity, telecom, hardware, and server support', @SYS),
(3, 'FACILITIES', 'General Facilities', 'Janitorial, climate control, landscaping, and office amenities', @SYS),
(4, 'SECURITY', 'Physical Security', 'Biometrics, access control, badges, and perimeter surveillance', @SYS);

INSERT INTO ServiceLevel (ServiceLevelID, ServiceLevelCode, ServiceLevelName, Description, CreatedBy) VALUES
(1, 'STANDARD', 'Standard SLA Tier', 'Standard enterprise business-hours support response', @SYS),
(2, 'PREMIUM', 'Mission-Critical 24/7 Tier', 'High-priority 24x7 coverage with accelerated escalation', @SYS);

INSERT INTO TimeZone (TimeZoneID, TimeZoneCode, DisplayName, UtcOffsetMinutes, CreatedBy) VALUES
(1, 'Africa/Addis_Ababa', 'East Africa Time (EAT, UTC+3)', 180, @SYS);

INSERT INTO Currency (CurrencyID, CurrencyCode, CurrencyName, Symbol, CreatedBy) VALUES
(1, 'ETB', 'Ethiopian Birr', 'Br', @SYS),
(2, 'USD', 'United States Dollar', '$', @SYS);

INSERT INTO StatusDefinition (StatusDefinitionID, StatusCode, StatusName, EntityName, CreatedBy) VALUES
(1, 'NEW', 'New Submitted', 'IssueRequest', @SYS),
(2, 'PENDING_APPROVAL', 'Pending Manager Approval', 'IssueRequest', @SYS),
(3, 'ASSIGNED', 'Assigned to Team', 'IssueRequest', @SYS),
(4, 'IN_PROGRESS', 'Work In Progress', 'IssueRequest', @SYS),
(5, 'PENDING', 'Pending Customer / Parts', 'IssueRequest', @SYS),
(6, 'RESOLVED', 'Resolved & Work Completed', 'IssueRequest', @SYS),
(7, 'CLOSED', 'Formally Closed & Verified', 'IssueRequest', @SYS),
(8, 'CANCELLED', 'Cancelled', 'IssueRequest', @SYS);

INSERT INTO PriorityDefinition (PriorityDefinitionID, PriorityCode, PriorityName, Weight, CreatedBy) VALUES
(1, 'LOW', 'Low Priority', 1, @SYS),
(2, 'MEDIUM', 'Medium Priority', 2, @SYS),
(3, 'HIGH', 'High Priority', 3, @SYS),
(4, 'CRITICAL', 'Mission Critical', 4, @SYS);

INSERT INTO LookupType (LookupTypeID, LookupTypeCode, LookupTypeName, CreatedBy) VALUES
(1, 'REQUEST_TYPE', 'Issue Request Type', @SYS),
(2, 'REQUEST_CHANNEL', 'Submission Channel', @SYS),
(3, 'REQUEST_SOURCE', 'Request Source Category', @SYS);

INSERT INTO LookupValue (LookupValueID, LookupTypeID, LookupValueCode, LookupValueName, DisplayOrder, CreatedBy) VALUES
(1, 1, 'COMPLAINT', 'Customer Complaint', 1, @SYS),
(2, 1, 'MAINTENANCE', 'Preventive / Corrective Maintenance', 2, @SYS),
(3, 1, 'INCIDENT', 'Service Disruption / Incident', 3, @SYS),
(4, 1, 'DISRUPTION', 'Campus Utility Disruption', 4, @SYS),
(5, 2, 'WEB', 'Tenant Web Portal', 1, @SYS),
(6, 2, 'MOBILE', 'Mobile Field App', 2, @SYS),
(7, 2, 'EMAIL', 'Automated Email Ingestion', 3, @SYS),
(8, 2, 'QR', 'Asset QR Code Scan', 4, @SYS),
(9, 3, 'TENANT', 'Tenant Authorized Representative', 1, @SYS),
(10, 3, 'EMPLOYEE', 'Park Department Employee', 2, @SYS),
(11, 3, 'GUEST', 'Campus Visitor / Guest', 3, @SYS);

INSERT INTO FeatureFlag (FeatureFlagID, FlagCode, FlagName, IsEnabled, CreatedBy) VALUES
(1, 'GUEST_REQUESTS', 'Allow Guest Issue Requests', 1, @SYS),
(2, 'MFA_REQUIRED', 'Mandate Multi-Factor Authentication', 0, @SYS),
(3, 'AUTO_DISPATCH', 'Intelligent Work Order Auto-Dispatch', 1, @SYS),
(4, 'SLA_AUTO_BREACH_ALERT', 'Automated SLA Breach Outbox Notifications', 1, @SYS);

INSERT INTO ConfigurationCategory (ConfigurationCategoryID, CategoryCode, CategoryName, CreatedBy) VALUES
(1, 'SECURITY', 'Security & Access Settings', @SYS),
(2, 'ISSUE', 'Issue & Incident Lifecycle Settings', @SYS),
(3, 'NOTIFICATION', 'Notification & Alerting Engine Settings', @SYS),
(4, 'SLA', 'SLA & Escalation Threshold Settings', @SYS);

INSERT INTO SystemSetting (SystemSettingID, ConfigurationCategoryID, SettingKey, SettingValue, DataType, CreatedBy) VALUES
(1, 1, 'PASSWORD_MIN_LENGTH', '8', 'INTEGER', @SYS),
(2, 1, 'MAX_LOGIN_ATTEMPTS', '5', 'INTEGER', @SYS),
(3, 2, 'ISSUE_AUTO_CLOSE_DAYS', '7', 'INTEGER', @SYS),
(4, 3, 'EMAIL_NOTIFICATIONS_ENABLED', 'true', 'BOOLEAN', @SYS),
(5, 4, 'SLA_WARNING_PERCENTAGE', '80', 'INTEGER', @SYS);

INSERT INTO BusinessRule (BusinessRuleID, RuleCode, RuleName, RuleExpression, CreatedBy) VALUES
(1, 'TENANT_ISOLATION', 'Tenant Data Isolation Boundary', 'tenantId == currentUser.tenantId || currentUser.isParkAdmin', @SYS),
(2, 'PRIMARY_REPRESENTATIVE', 'Primary Representative Required for Tenant', 'tenant.representatives.count(role==PRIMARY) >= 1', @SYS);

INSERT INTO NumberSequence (NumberSequenceID, SequenceCode, Prefix, NextNumber, IncrementValue, NumberWidth, CreatedBy) VALUES
(1, 'ISSUE_REQUEST', 'IR', 6, 1, 6, @SYS),
(2, 'LEASE_AGREEMENT', 'LS', 4, 1, 5, @SYS);

INSERT INTO Localization (LocalizationID, LanguageCode, CountryCode, LocaleName, CreatedBy) VALUES
(1, 'en', 'ET', 'English (Ethiopia)', @SYS),
(2, 'am', 'ET', 'አማርኛ (Amharic)', @SYS);

INSERT INTO LanguageResource (LocalizationID, ResourceKey, ResourceValue, CreatedBy) VALUES
(1, 'app.title', 'Ethiopian IT Park — Issue Tracking & Service Request Management System', @SYS),
(1, 'login.submit', 'Sign In to ITMS', @SYS),
(1, 'issue.create', 'Create Service / Issue Request', @SYS),
(2, 'app.title', 'የኢትዮጵያ አይቲ ፓርክ የችግሮች መከታተያና የአገልግሎት አስተዳደር ሥርዓት', @SYS),
(2, 'login.submit', 'ግባ (Sign In)', @SYS),
(2, 'issue.create', 'አዲስ የጥገና ጥያቄ አቅርብ', @SYS);

-- ============================================================================
-- ENTERPRISE SYSTEM MODULES
-- ============================================================================

INSERT INTO SystemModule (SystemModuleID, ModuleCode, ModuleName, Description, DisplayOrder, CreatedBy) VALUES
(1, 'MOD_BUSINESS_PARK', 'Business Park & Campus Infrastructure', 'Campus facilities, zones, buildings, floors, and office space management', 1, @SYS),
(2, 'MOD_TENANT_MGMT', 'Tenant Management & Leasing', 'Tenant company onboarding, leasing contracts, contacts, and office allocations', 2, @SYS),
(3, 'MOD_ORG_STRUCT', 'Organizational Structure & Hierarchy', 'Departments, cost centers, budgets, teams, positions, and employee assignments', 3, @SYS),
(4, 'MOD_IAM', 'Identity & Access Management', 'User authentication, security credentials, providers, and session governance', 4, @SYS),
(5, 'MOD_RBAC', 'Role-Based Access Control (RBAC)', 'Resources, actions, permission groups, granular permissions, and role assignments', 5, @SYS),
(6, 'MOD_SERVICE_CATALOG', 'Enterprise Service Catalog', 'Service categories, service definitions, workflow states, and department mappings', 6, @SYS),
(7, 'MOD_ISSUE_MGMT', 'Issue & Service Request Management', 'Full lifecycle issue submission, investigation, root cause, and resolution tracking', 7, @SYS),
(8, 'MOD_APPROVAL', 'Multi-Level Approval Governance', 'Sequential and parallel approval rule evaluation, stages, and voting records', 8, @SYS),
(9, 'MOD_DISPATCH', 'Intelligent Dispatch & Scheduling', 'Dispatcher queues, technician skill matching, availability, and workbench scheduling', 9, @SYS),
(10, 'MOD_SLA', 'Service Level Agreements & Escalations', 'Business calendar calculation, SLA policies, stage thresholds, and escalation rules', 10, @SYS),
(11, 'MOD_COMMUNICATION', 'Omnichannel Communication & Comments', 'Tenant-technician conversational threads, audit timeline, and internal notes', 11, @SYS),
(12, 'MOD_NOTIFICATION', 'Enterprise Notification Engine', 'In-app alerts, email queue, SMS notifications, and delivery tracking', 12, @SYS),
(13, 'MOD_DOCUMENT', 'Document & Attachment Management', 'Secure multi-part file uploads, versioning, mime validation, and audit access', 13, @SYS),
(14, 'MOD_REPORTING', 'Executive Analytics & BI Reporting', 'Operational KPI aggregation, SLA breach analysis, export schedules, and BI views', 14, @SYS),
(15, 'MOD_CONFIGURATION', 'System Configuration & Lookups', 'Master lookup types, localized dictionary keys, system parameters, and feature flags', 15, @SYS);

-- ============================================================================
-- MODULE 1: BUSINESS PARK & CAMPUS INFRASTRUCTURE (ETHIOPIAN IT PARK)
-- ============================================================================

INSERT INTO BusinessPark (
    BusinessParkID, BusinessParkCode, BusinessParkName, ShortName, Description,
    Country, City, TimeZone, CurrencyCode, LanguageCode, IsOperational, CreatedBy
) VALUES (
    1, 'ICT_PARK_AA', 'Ethiopian IT Park', 'EITP',
    'National ICT and Innovation Hub — Bole Sub-city, Addis Ababa, Ethiopia',
    'Ethiopia', 'Addis Ababa', 'Africa/Addis_Ababa', 'ETB', 'en', 1, @SYS
);

INSERT INTO FacilityZone (
    FacilityZoneID, BusinessParkID, FacilityZoneCode, FacilityZoneName, ZoneType, Description, CreatedBy
) VALUES
(1, 1, 'ZONE-INNOV', 'Innovation & Software Plaza', 'COMMERCIAL', 'Incubator blocks, software engineering suites, and collaboration hubs', @SYS),
(2, 1, 'ZONE-DC', 'Tier III Data Center Yard', 'DATA_CENTER', 'High-availability colocation halls, substation yard, and telecommunications towers', @SYS),
(3, 1, 'ZONE-ADMIN', 'Campus Core & Admin Boulevard', 'CAMPUS', 'Central park executive management offices, auditorium, and conference facility', @SYS),
(4, 1, 'ZONE-PARK', 'North Fleet & Visitor Parking', 'PARKING_LOT', 'Dedicated visitor and commercial vehicle parking zone with EV charging bays', @SYS);

INSERT INTO Location (LocationID, BusinessParkID, LocationCode, LocationName, LocationType, CreatedBy) VALUES
(1, 1, 'CAMPUS-01', 'Main Innovation Campus', 'CAMPUS', @SYS),
(2, 1, 'DC-ZONE-01', 'Tier III Data Center Compound', 'FACILITY', @SYS);

INSERT INTO Building (
    BuildingID, BusinessParkID, FacilityZoneID, BuildingCode, BuildingName,
    ShortName, Description, TotalFloors, TotalAreaSquareMeter, CreatedBy
) VALUES
(1, 1, 1, 'BLD-A', 'Block A - ICT Incubation Center', 'Incubation A', 'Primary software development, startups, and SME technology suites', 5, 12500.00, @SYS),
(2, 1, 2, 'BLD-B', 'Block B - Tier III Data Center & Commercial Hub', 'Data Center B', 'Mission-critical server colocation facility and major telecom operator offices', 4, 18000.00, @SYS),
(3, 1, 3, 'BLD-HQ', 'Block C - Park Administration Headquarters', 'Park HQ', 'Executive offices, conference hall, and central facilities dispatch control center', 6, 15000.00, @SYS);

INSERT INTO Floor (FloorID, BuildingID, FloorNumber, FloorCode, FloorName, TotalOfficeSpaces, CreatedBy) VALUES
(1, 1, 1, 'A-GF', 'Block A - Ground Floor & Reception', 10, @SYS),
(2, 1, 2, 'A-L1', 'Block A - Level 1 Software Labs', 12, @SYS),
(3, 1, 3, 'A-L2', 'Block A - Level 2 Corporate Suites', 8, @SYS),
(4, 2, 1, 'B-GF', 'Block B - Ground Floor Telecom Terminal', 8, @SYS),
(5, 2, 2, 'B-L1', 'Block B - Level 1 Tier III Data Hall', 6, @SYS),
(6, 3, 1, 'HQ-L1', 'Block C - Administration & Operations Suite', 10, @SYS);

INSERT INTO OfficeSpace (
    OfficeSpaceID, FloorID, OfficeTypeID, OfficeNumber, OfficeName,
    SquareMeters, AvailabilityStatus, CreatedBy
) VALUES
(1, 1, 1, 'A-101', 'Software Development Suite A-101', 45.00, 'OCCUPIED', @SYS),
(2, 1, 1, 'A-102', 'Operations Office A-102', 40.00, 'OCCUPIED', @SYS),
(3, 2, 2, 'A-201', 'Executive Innovation Suite A-201', 80.00, 'OCCUPIED', @SYS),
(4, 4, 2, 'B-101', 'Commercial Enterprise Suite B-101', 120.00, 'OCCUPIED', @SYS),
(5, 5, 3, 'B-DC1', 'Tier III Colocation Server Room B-DC1', 350.00, 'OCCUPIED', @SYS),
(6, 3, 4, 'A-301', 'FinTech Research & Testing Lab A-301', 95.00, 'OCCUPIED', @SYS);

-- ============================================================================
-- MODULE 2: TENANT MANAGEMENT & LEASING
-- ============================================================================

INSERT INTO Tenant (
    TenantID, BusinessParkID, TenantTypeID, IndustryID, TenantCode, CompanyName,
    Status, OnboardedDate, CreatedBy
) VALUES
(1, 1, 1, 1, 'TNT-ACME', 'Acme Technologies PLC', 'ACTIVE', '2025-01-15', @SYS),
(2, 1, 2, 2, 'TNT-BETA', 'Beta Logistics Ltd', 'ACTIVE', '2025-03-01', @SYS),
(3, 1, 1, 4, 'TNT-SAFARICOM', 'Safaricom Ethiopia PLC', 'ACTIVE', '2025-02-01', @SYS),
(4, 1, 1, 4, 'TNT-ETHIOTEL', 'Ethio Telecom Data Center Division', 'ACTIVE', '2024-11-01', @SYS),
(5, 1, 1, 3, 'TNT-CBE', 'Commercial Bank of Ethiopia FinTech Hub', 'ACTIVE', '2025-01-01', @SYS);

INSERT INTO TenantContact (TenantContactID, TenantID, ContactType, Label, ContactValue, IsPrimary, CreatedBy) VALUES
(1, 1, 'EMAIL', 'Acme Primary Email', 'contact@acme-tech.local', 1, @SYS),
(2, 1, 'PHONE', 'Acme Reception Desk', '+251-11-667-0001', 0, @SYS),
(3, 2, 'EMAIL', 'Beta Logistics Operations', 'operations@beta-logistics.local', 1, @SYS),
(4, 3, 'EMAIL', 'Safaricom Tech Facilities', 'facilities@safaricom.et.local', 1, @SYS),
(5, 4, 'EMAIL', 'Ethio Telecom Data Center', 'datacenter@ethiotel.et.local', 1, @SYS);

INSERT INTO TenantAddress (
    TenantAddressID, TenantID, AddressType, Country, City, AddressLine1, CreatedBy
) VALUES
(1, 1, 'PHYSICAL', 'Ethiopia', 'Addis Ababa', 'Block A, Office A-101, Ethiopian IT Park', @SYS),
(2, 2, 'PHYSICAL', 'Ethiopia', 'Addis Ababa', 'Block A, Office A-102, Ethiopian IT Park', @SYS),
(3, 3, 'PHYSICAL', 'Ethiopia', 'Addis Ababa', 'Block B, Suite B-101 & Data Hall B-DC1, Ethiopian IT Park', @SYS),
(4, 4, 'PHYSICAL', 'Ethiopia', 'Addis Ababa', 'Block B, Suite B-GF & Terminal Hub, Ethiopian IT Park', @SYS);

INSERT INTO LeaseAgreement (
    LeaseAgreementID, TenantID, AgreementNumber, StartDate, EndDate, ExecutionDate,
    MonthlyRentAmount, SecurityDepositAmount, CurrencyCode, Status, CreatedBy
) VALUES
(1, 1, 'LS-00001', '2025-01-01', '2027-12-31', '2024-12-15', 85000.00, 170000.00, 'ETB', 'ACTIVE', @SYS),
(2, 2, 'LS-00002', '2025-03-01', '2026-02-28', '2025-02-20', 62000.00, 124000.00, 'ETB', 'ACTIVE', @SYS),
(3, 3, 'LS-00003', '2025-02-01', '2030-01-31', '2025-01-10', 450000.00, 900000.00, 'ETB', 'ACTIVE', @SYS),
(4, 4, 'LS-00004', '2024-11-01', '2029-10-31', '2024-10-15', 380000.00, 760000.00, 'ETB', 'ACTIVE', @SYS);

INSERT INTO TenantOfficeAllocation (
    TenantOfficeAllocationID, TenantID, OfficeSpaceID, LeaseAgreementID,
    AllocatedDate, Status, CreatedBy
) VALUES
(1, 1, 1, 1, '2025-01-15', 'ACTIVE', @SYS),
(2, 2, 2, 2, '2025-03-01', 'ACTIVE', @SYS),
(3, 3, 4, 3, '2025-02-01', 'ACTIVE', @SYS),
(4, 3, 5, 3, '2025-02-01', 'ACTIVE', @SYS);

INSERT INTO OfficeAllocationHistory (
    OfficeAllocationHistoryID, OfficeSpaceID, TenantID, LeaseAgreementID,
    ActionType, Remarks, CreatedBy
) VALUES
(1, 1, 1, 1, 'ALLOCATED', 'Initial corporate allocation to Acme Technologies PLC', @SYS),
(2, 2, 2, 2, 'ALLOCATED', 'Initial logistics branch allocation to Beta Logistics Ltd', @SYS),
(3, 4, 3, 3, 'ALLOCATED', 'Colocation enterprise office allocation to Safaricom Ethiopia', @SYS);

-- ============================================================================
-- MODULE 3: ORGANIZATIONAL STRUCTURE, COST CENTERS & BUDGETS
-- (Park has multiple departments with their own staff)
-- ============================================================================

INSERT INTO OrganizationUnit (OrganizationUnitID, BusinessParkID, UnitCode, UnitName, Description, CreatedBy) VALUES
(1, 1, 'PARK-OPS', 'Ethiopian IT Park Operations', 'Core campus facilities, utility infrastructure, and data center operations', @SYS);

INSERT INTO Department (DepartmentID, BusinessParkID, OrganizationUnitID, DepartmentCode, DepartmentName, ManagerUserID, CreatedBy) VALUES
(1, 1, 1, 'FACILITIES', 'Facilities Management & Civil Works', 2, @SYS),
(2, 1, 1, 'IT-SUPPORT', 'IT Infrastructure & Data Center Services', 9, @SYS),
(3, 1, 1, 'SECURITY', 'Campus Physical Security & Badging', 2, @SYS),
(4, 1, 1, 'ADMIN', 'General Administration & Executive Operations', 1, @SYS);

INSERT INTO CostCenter (CostCenterID, BusinessParkID, CostCenterCode, CostCenterName, Description, CreatedBy) VALUES
(1, 1, 'CC-FAC-01', 'Facilities & Campus Maintenance', 'Central campus civil, electrical, HVAC, and groundskeeping expenditures', @SYS),
(2, 1, 'CC-IT-01', 'IT Infrastructure & Data Center', 'Fiber optics, high-speed switching, servers, and tenant connectivity', @SYS),
(3, 1, 'CC-SEC-01', 'Campus Security & Access Control', 'Physical barrier control, security personnel, and CCTV surveillance', @SYS),
(4, 1, 'CC-ADMIN-01', 'Executive Administration & Operations', 'Central campus executive administration and shared logistics', @SYS);

INSERT INTO DepartmentBudget (
    DepartmentBudgetID, DepartmentID, CostCenterID, FiscalYear,
    AllocatedAmount, RemainingAmount, CurrencyCode, CreatedBy
) VALUES
(1, 1, 1, 2026, 5000000.00, 4320000.00, 'ETB', @SYS),
(2, 2, 2, 2026, 8500000.00, 7650000.00, 'ETB', @SYS),
(3, 3, 3, 2026, 2500000.00, 2180000.00, 'ETB', @SYS);

INSERT INTO Team (TeamID, DepartmentID, TeamCode, TeamName, LeaderUserID, CreatedBy) VALUES
(1, 1, 'MAINT-TEAM', 'Facilities Maintenance Response Team', 5, @SYS),
(2, 2, 'NET-TEAM', 'Data Center & Network Engineering Team', 10, @SYS);

INSERT INTO `Position` (PositionID, OrganizationUnitID, PositionCode, PositionTitle, CreatedBy) VALUES
(1, 1, 'MGR-FAC', 'Facilities Department Manager', @SYS),
(2, 1, 'MGR-IT', 'IT Infrastructure Department Manager', @SYS),
(3, 1, 'SR-TECH', 'Senior Maintenance Technician', @SYS),
(4, 1, 'NET-ENG', 'Senior Network & Systems Engineer', @SYS),
(5, 1, 'DISP-LEAD', 'Campus Operations Employee', @SYS);

-- ============================================================================
-- MODULE 4: IDENTITY & ACCESS MANAGEMENT
-- (All users belong to the one business park; tenants have only representatives)
-- ============================================================================

INSERT INTO AuthenticationProvider (AuthenticationProviderID, ProviderCode, ProviderName, ConfigJson, CreatedBy) VALUES
(1, 'LOCAL', 'Local Database Authentication', JSON_OBJECT('type', 'local', 'bcryptRounds', 10), @SYS);

INSERT INTO `User` (
    UserID, BusinessParkID, TenantID, DepartmentID, UserTypeCode, FirstName, LastName,
    Age, Gender, Email, PhoneNumber, JobTitle, PreferredLanguage, CreatedBy
) VALUES
-- 1. Business Park Super Administrator
(1, 1, NULL, 4, 'SUPER_ADMIN', 'Super', 'Administrator', 38, 'MALE', 'superadmin@businesspark.local', '+251-11-667-0010', 'Business Park Super Administrator', 'en', @SYS),
-- 2. Department Manager: Facilities Management
(2, 1, NULL, 1, 'DEPARTMENT_MANAGER', 'Helen', 'Facility', 42, 'FEMALE', 'facility@businesspark.local', '+251-11-667-0020', 'Facilities Department Manager', 'en', @SYS),
-- 3. Tenant Representative: Acme Technologies PLC (Tenant 1)
(3, 1, 1, NULL, 'TENANT_REPRESENTATIVE', 'Samuel', 'Bekele', 35, 'MALE', 'tenantadmin@acme-tech.local', '+251-11-667-0030', 'Acme Primary Representative', 'en', @SYS),
-- 4. Tenant Representative: Ethio Telecom Data Center Division (Tenant 4)
(4, 1, 4, NULL, 'TENANT_REPRESENTATIVE', 'Marta', 'Tesfaye', 34, 'FEMALE', 'employee@acme-tech.local', '+251-11-667-0040', 'Ethio Telecom Authorized Representative', 'en', @SYS),
-- 5. Field Technician: Facilities Management
(5, 1, NULL, 1, 'TECHNICIAN', 'Daniel', 'Worku', 29, 'MALE', 'technician@businesspark.local', '+251-11-667-0050', 'Senior Maintenance Technician', 'en', @SYS),
-- 6. Park Employee: Campus Operations & Central Dispatch
(6, 1, NULL, 1, 'EMPLOYEE', 'Ruth', 'Alemu', 28, 'FEMALE', 'dispatcher@businesspark.local', '+251-11-667-0060', 'Campus Operations Employee', 'en', @SYS),
-- 7. Tenant Representative: Beta Logistics Ltd (Tenant 2)
(7, 1, 2, NULL, 'TENANT_REPRESENTATIVE', 'Hanna', 'Mekonnen', 31, 'FEMALE', 'tenantadmin@beta-logistics.local', '+251-11-667-0070', 'Beta Logistics Representative', 'en', @SYS),
-- 8. Tenant Representative: Safaricom Ethiopia PLC (Tenant 3)
(8, 1, 3, NULL, 'TENANT_REPRESENTATIVE', 'Dawit', 'Haile', 39, 'MALE', 'safaricomadmin@safaricom.et.local', '+251-11-667-0080', 'Safaricom Tech Operations Lead', 'en', @SYS),
-- 9. Department Manager: IT Infrastructure & Support
(9, 1, NULL, 2, 'DEPARTMENT_MANAGER', 'Yonas', 'Girma', 36, 'MALE', 'ithelpdesk@businesspark.local', '+251-11-667-0090', 'IT Support Department Manager', 'en', @SYS),
-- 10. Field Technician: IT & Data Center Network Engineering
(10, 1, NULL, 2, 'TECHNICIAN', 'Abebe', 'Kebede', 33, 'MALE', 'ittechnician@businesspark.local', '+251-11-667-0100', 'Senior Network & Systems Engineer', 'en', @SYS);

INSERT INTO UserAccount (
    UserAccountID, UserID, AuthenticationProviderID, Username, PasswordHash,
    AccountStatusCode, IsMfaEnabled, CreatedBy
) VALUES
(1, 1, 1, 'superadmin', @PWD_HASH, 'ACTIVE', 0, @SYS),
(2, 2, 1, 'facility', @PWD_HASH, 'ACTIVE', 0, @SYS),
(3, 3, 1, 'tenantadmin', @PWD_HASH, 'ACTIVE', 0, @SYS),
(4, 4, 1, 'employee', @PWD_HASH, 'ACTIVE', 0, @SYS),
(5, 5, 1, 'technician', @PWD_HASH, 'ACTIVE', 0, @SYS),
(6, 6, 1, 'dispatcher', @PWD_HASH, 'ACTIVE', 0, @SYS),
(7, 7, 1, 'betatenant', @PWD_HASH, 'ACTIVE', 0, @SYS),
(8, 8, 1, 'safaricomadmin', @PWD_HASH, 'ACTIVE', 0, @SYS),
(9, 9, 1, 'ithelpdesk', @PWD_HASH, 'ACTIVE', 0, @SYS),
(10, 10, 1, 'ittechnician', @PWD_HASH, 'ACTIVE', 0, @SYS);

-- Authorized Tenant Representatives Registered by Business Park Admin
INSERT INTO TenantRepresentative (
    TenantRepresentativeID, TenantID, UserID, RepresentativeRole, IsPrimary, CreatedBy
) VALUES
(1, 1, 3, 'PRIMARY', 1, @SYS), -- Acme Technologies -> Samuel Bekele
(2, 2, 7, 'PRIMARY', 1, @SYS), -- Beta Logistics -> Hanna Mekonnen
(3, 3, 8, 'PRIMARY', 1, @SYS), -- Safaricom Ethiopia -> Dawit Haile
(4, 4, 4, 'PRIMARY', 1, @SYS); -- Ethio Telecom -> Marta Tesfaye

INSERT INTO TenantSetting (TenantSettingID, TenantID, SettingKey, SettingValue, DataType, CreatedBy) VALUES
(1, 1, 'NOTIFY_ON_ISSUE_CREATE', 'true', 'BOOLEAN', @SYS),
(2, 1, 'REQUIRE_INTERNAL_MANAGER_APPROVAL', 'true', 'BOOLEAN', @SYS),
(3, 2, 'NOTIFY_ON_ISSUE_CREATE', 'true', 'BOOLEAN', @SYS),
(4, 3, 'NOTIFY_ON_ISSUE_CREATE', 'true', 'BOOLEAN', @SYS);

-- Park Staff Department Assignments
INSERT INTO EmployeeAssignment (
    EmployeeAssignmentID, UserID, DepartmentID, TeamID, PositionID, IsPrimary, JoinedDate, CreatedBy
) VALUES
(1, 1, 4, NULL, NULL, 1, '2024-01-01', @SYS), -- Super Admin -> Admin Dept
(2, 2, 1, NULL, 1, 1, '2024-01-01', @SYS),    -- Facility Manager -> Facilities Dept
(3, 9, 2, NULL, 2, 1, '2024-04-01', @SYS),    -- IT Lead -> IT Support Dept
(4, 5, 1, 1, 3, 1, '2024-06-01', @SYS),       -- Technician -> Facilities Dept, Maint Team
(5, 10, 2, 2, 4, 1, '2024-05-01', @SYS),      -- Network Tech -> IT Dept, Network Team
(6, 6, 1, NULL, 5, 1, '2024-07-01', @SYS);    -- Employee / Dispatch -> Facilities Dept

-- ============================================================================
-- MODULE 5: ROLE & PERMISSION GOVERNANCE (THE 5 CORE ROLES)
-- 1. SUPER_ADMIN (Administrator)
-- 2. DEPARTMENT_MANAGER (Department Manager)
-- 3. TECHNICIAN (Technician)
-- 4. EMPLOYEE (Employee)
-- 5. TENANT_REPRESENTATIVE (Tenant Representative for each registered tenant)
-- ============================================================================

INSERT INTO `Resource` (ResourceID, ResourceCode, ResourceName, Description, CreatedBy) VALUES
(1, 'ISSUE', 'Issue Request & Work Orders', 'Issue lifecycle, diagnostic data, and work orders', @SYS),
(2, 'TENANT', 'Tenant Organizations', 'Tenant company records, leases, and representatives', @SYS),
(3, 'SERVICE', 'Service Catalog', 'Service offerings, categories, SLA rules, and workflows', @SYS),
(4, 'USER', 'Users & Security Accounts', 'User identity profiles, permissions, and credentials', @SYS),
(5, 'DISPATCH', 'Dispatch Workbench', 'Dispatcher queues, technician scheduling, and work assignments', @SYS),
(6, 'REPORT', 'Analytics & Reports', 'Executive dashboards, SLA compliance KPIs, and scheduled exports', @SYS),
(7, 'DOCUMENT', 'Document Management', 'Attachments, lease agreements, and engineering blueprints', @SYS);

INSERT INTO `Action` (ActionID, ActionCode, ActionName, Description, CreatedBy) VALUES
(1, 'CREATE', 'Create Record', 'Submit or create new entity records', @SYS),
(2, 'READ', 'Read / View Record', 'Inspect and retrieve entity records', @SYS),
(3, 'UPDATE', 'Update / Modify Record', 'Edit and update existing entity details', @SYS),
(4, 'DELETE', 'Delete / Archive Record', 'Soft delete or cancel entity records', @SYS),
(5, 'APPROVE', 'Approve / Reject Action', 'Review and cast approval workflow decisions', @SYS),
(6, 'ASSIGN', 'Assign / Dispatch Action', 'Route requests to technicians or teams', @SYS),
(7, 'EXPORT', 'Export / Download Data', 'Generate and download data export reports', @SYS);

INSERT INTO ResourcePermission (ResourcePermissionID, ResourceID, ActionID, Description, CreatedBy) VALUES
(1, 1, 1, 'Submit new issue requests', @SYS),
(2, 1, 2, 'View issue requests and work orders', @SYS),
(3, 1, 3, 'Update issue requests and status notes', @SYS),
(4, 1, 4, 'Cancel / close issue requests', @SYS),
(5, 1, 5, 'Approve or reject service requests', @SYS),
(6, 1, 6, 'Dispatch and assign work orders', @SYS),
(7, 2, 2, 'View tenant profile and lease details', @SYS),
(8, 2, 3, 'Manage tenant information and contacts', @SYS),
(9, 3, 2, 'View service catalog items', @SYS),
(10, 3, 3, 'Manage service offerings and mappings', @SYS),
(11, 4, 3, 'Administer users and credentials', @SYS),
(12, 6, 2, 'View executive KPI and SLA reports', @SYS),
(13, 6, 7, 'Export operational analytics and logs', @SYS),
(14, 7, 1, 'Upload file documents and attachments', @SYS);

INSERT INTO PermissionGroup (
    PermissionGroupID, SystemModuleID, GroupCode, GroupName, Description, CreatedBy
) VALUES
(1, 7, 'ISSUE_OPS', 'Issue & Service Operations', 'Issue lifecycle and work order management permissions', @SYS),
(2, 2, 'TENANT_REP', 'Tenant Representation', 'Tenant representative self-service permissions', @SYS),
(3, 4, 'PLATFORM_ADMIN', 'Platform Administration', 'Master system configuration and user management permissions', @SYS),
(4, 6, 'SERVICE_CAT', 'Service Catalog Governance', 'Service catalog definitions and department routing permissions', @SYS),
(5, 9, 'DISPATCH_OPS', 'Dispatch & Scheduling Operations', 'Central dispatch queue and technician allocation permissions', @SYS),
(6, 14, 'REPORT_BI', 'Executive Analytics & BI', 'Operational dashboards and compliance reporting permissions', @SYS);

INSERT INTO Permission (
    PermissionID, PermissionGroupID, ResourcePermissionID, PermissionCode, PermissionName, CreatedBy
) VALUES
(1, 1, 1, 'issue:create', 'Create Service Request', @SYS),
(2, 1, 2, 'issue:read', 'View Service Request', @SYS),
(3, 1, 3, 'issue:update', 'Update Service Request', @SYS),
(4, 1, 4, 'issue:delete', 'Cancel Service Request', @SYS),
(5, 1, 5, 'issue:approve', 'Approve Service Request', @SYS),
(6, 5, 6, 'dispatch:assign', 'Dispatch & Assign Work Orders', @SYS),
(7, 2, 7, 'tenant:read', 'View Tenant Profile', @SYS),
(8, 2, 8, 'tenant:manage', 'Manage Tenant Details', @SYS),
(9, 4, 9, 'service:read', 'View Service Catalog', @SYS),
(10, 4, 10, 'service:manage', 'Manage Service Catalog', @SYS),
(11, 3, 11, 'user:manage', 'Manage Users & Accounts', @SYS),
(12, 6, 12, 'report:view', 'View Analytics & Reports', @SYS),
(13, 6, 13, 'report:export', 'Export BI Reports', @SYS),
(14, 1, 14, 'document:upload', 'Upload Document Attachments', @SYS);

-- EXACT 5 CORE SYSTEM ROLES (Belong to Business Park Campus)
INSERT INTO `Role` (RoleID, BusinessParkID, RoleCode, RoleName, Description, IsSystemRole, CreatedBy) VALUES
(1, 1, 'SUPER_ADMIN', 'Administrator', 'Business Park Super Administrator with full platform governance', 1, @SYS),
(2, 1, 'DEPARTMENT_MANAGER', 'Department Manager', 'Park department manager approving, dispatching, and managing departmental operations', 1, @SYS),
(3, 1, 'TECHNICIAN', 'Technician', 'Park maintenance and IT technician executing assigned work orders', 1, @SYS),
(4, 1, 'EMPLOYEE', 'Employee', 'Park department employee and service catalog consumer', 1, @SYS),
(5, 1, 'TENANT_REPRESENTATIVE', 'Tenant Representative', 'Registered representative for a tenant company submitting and tracking requests', 1, @SYS);

INSERT INTO RolePermission (RoleID, PermissionID, CreatedBy) VALUES
-- Role 1: SUPER_ADMIN (All 14 permissions)
(1, 1, @SYS), (1, 2, @SYS), (1, 3, @SYS), (1, 4, @SYS), (1, 5, @SYS),
(1, 6, @SYS), (1, 7, @SYS), (1, 8, @SYS), (1, 9, @SYS), (1, 10, @SYS),
(1, 11, @SYS), (1, 12, @SYS), (1, 13, @SYS), (1, 14, @SYS),
-- Role 2: DEPARTMENT_MANAGER (Department approval, dispatch, status updates, BI reports)
(2, 1, @SYS), (2, 2, @SYS), (2, 3, @SYS), (2, 5, @SYS), (2, 6, @SYS),
(2, 9, @SYS), (2, 12, @SYS), (2, 13, @SYS), (2, 14, @SYS),
-- Role 3: TECHNICIAN (Create field incident/request, view work orders, update progress, upload diagnostic evidence)
(3, 1, @SYS), (3, 2, @SYS), (3, 3, @SYS), (3, 9, @SYS), (3, 14, @SYS),
-- Role 4: EMPLOYEE (Create requests, view own requests, catalog)
(4, 1, @SYS), (4, 2, @SYS), (4, 9, @SYS), (4, 14, @SYS),
-- Role 5: TENANT_REPRESENTATIVE (Tenant requests, approve quotes, track status, view profile)
(5, 1, @SYS), (5, 2, @SYS), (5, 3, @SYS), (5, 5, @SYS), (5, 7, @SYS), (5, 9, @SYS), (5, 12, @SYS), (5, 14, @SYS);

INSERT INTO UserRole (UserID, RoleID, CreatedBy) VALUES
(1, 1, @SYS), -- Super Admin -> Role 1 (SUPER_ADMIN)
(2, 2, @SYS), -- Helen Facility -> Role 2 (DEPARTMENT_MANAGER)
(9, 2, @SYS), -- Yonas Girma -> Role 2 (DEPARTMENT_MANAGER)
(5, 3, @SYS), -- Daniel Worku -> Role 3 (TECHNICIAN)
(10, 3, @SYS), -- Abebe Kebede -> Role 3 (TECHNICIAN)
(6, 4, @SYS), -- Ruth Alemu -> Role 4 (EMPLOYEE)
(3, 5, @SYS), -- Samuel Bekele (Acme) -> Role 5 (TENANT_REPRESENTATIVE)
(7, 5, @SYS), -- Hanna Mekonnen (Beta) -> Role 5 (TENANT_REPRESENTATIVE)
(8, 5, @SYS), -- Dawit Haile (Safaricom) -> Role 5 (TENANT_REPRESENTATIVE)
(4, 5, @SYS); -- Marta Tesfaye (Ethio Telecom) -> Role 5 (TENANT_REPRESENTATIVE)

-- ============================================================================
-- MODULE 18: CALENDAR MANAGEMENT & ETHIOPIAN HOLIDAYS
-- ============================================================================

INSERT INTO BusinessCalendar (BusinessCalendarID, CalendarName, TimeZoneID, CreatedBy) VALUES
(1, 'Ethiopian IT Park Standard Working Calendar', 1, @SYS);

INSERT INTO WorkingHour (BusinessCalendarID, DayOfWeek, StartShift, EndShift, CreatedBy) VALUES
(1, 1, '08:30:00', '17:30:00', @SYS),
(1, 2, '08:30:00', '17:30:00', @SYS),
(1, 3, '08:30:00', '17:30:00', @SYS),
(1, 4, '08:30:00', '17:30:00', @SYS),
(1, 5, '08:30:00', '17:30:00', @SYS);

INSERT INTO HolidayCalendar (BusinessCalendarID, HolidayDate, HolidayName, CreatedBy) VALUES
(1, '2026-01-07', 'Ethiopian Christmas (Genna)', @SYS),
(1, '2026-01-19', 'Ethiopian Epiphany (Timkat)', @SYS),
(1, '2026-03-02', 'Victory of Adwa Day', @SYS),
(1, '2026-05-01', 'International Labour Day', @SYS),
(1, '2026-05-05', 'Patriots Victory Day', @SYS),
(1, '2026-09-11', 'Ethiopian New Year (Enkutatash)', @SYS),
(1, '2026-09-27', 'Finding of the True Cross (Meskel)', @SYS);

-- ============================================================================
-- MODULE 6: ENTERPRISE SERVICE CATALOG & DEPARTMENT MAPPINGS
-- ============================================================================

INSERT INTO ServiceCategory (ServiceCategoryID, BusinessParkID, DepartmentID, CategoryCode, CategoryName, Description, CreatedBy) VALUES
(1, 1, 1, 'FACILITIES', 'Facilities & Campus Maintenance', 'Civil maintenance, HVAC climate control, water, and building repairs', @SYS),
(2, 1, 2, 'IT-SERVICES', 'IT Infrastructure & Data Center', 'Dedicated fiber links, server colocation, Wi-Fi, and cybersecurity', @SYS),
(3, 1, 1, 'ELECTRICAL', 'Power & Electrical Infrastructure', 'Generator backups, UPS battery conditioning, and electrical distributions', @SYS),
(4, 1, 3, 'SECURITY-ACCESS', 'Access Control & Security Services', 'Biometric credentialing, visitor gate passes, and perimeter surveillance', @SYS);

INSERT INTO ServiceCategoryDepartmentMapping (
    MappingID, ServiceCategoryID, DepartmentID, IsActive, CreatedBy
) VALUES
(1, 1, 1, 1, @SYS), -- FACILITIES -> Department 1 (Facilities Management)
(2, 2, 2, 1, @SYS), -- IT-SERVICES -> Department 2 (IT Support)
(3, 3, 1, 1, @SYS), -- ELECTRICAL -> Department 1 (Facilities Management)
(4, 4, 3, 1, @SYS); -- SECURITY-ACCESS -> Department 3 (Campus Security)

INSERT INTO Service (
    ServiceID, ServiceCategoryID, ServiceTypeID, ServiceLevelID,
    ServiceCode, ServiceName, Description, EstimatedCost, CurrencyCode, CreatedBy
) VALUES
(1, 1, 1, 1, 'HVAC-REPAIR', 'HVAC Air Conditioning Repair', 'Chiller, cooling unit, ventilation, and thermostat maintenance', 1500.00, 'ETB', @SYS),
(2, 2, 2, 2, 'NET-ISSUE', 'Network & Internet Troubleshooting', 'Fiber optic loss, switch port errors, and Wi-Fi access point drops', 800.00, 'ETB', @SYS),
(3, 1, 3, 1, 'GEN-MAINT', 'General Building Maintenance', 'Lighting fixture replacement, drywall touch-up, and lock repairs', 500.00, 'ETB', @SYS),
(4, 3, 1, 2, 'PWR-OUTAGE', 'Critical Power & UPS Backup Failure', 'Sudden power dip, automated transfer switch failure, or UPS alarm', 3500.00, 'ETB', @SYS),
(5, 2, 2, 2, 'FIBER-LINK', 'Dedicated Fiber Splicing & Restoration', 'OTDR analysis, core realignment, and fusion splicing for gigabit links', 2500.00, 'ETB', @SYS),
(6, 4, 4, 1, 'ACCESS-CTRL', 'Biometric & RFID Keycard Provisioning', 'Employee badging, turnstile reader enrollment, and zone access rights', 400.00, 'ETB', @SYS);

INSERT INTO ServiceWorkflow (ServiceID, WorkflowStepsJson, VersionNumber, CreatedBy) VALUES
(1, JSON_ARRAY('NEW', 'PENDING_APPROVAL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'), 1, @SYS),
(2, JSON_ARRAY('NEW', 'PENDING_APPROVAL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'), 1, @SYS),
(3, JSON_ARRAY('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'), 1, @SYS),
(4, JSON_ARRAY('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'), 1, @SYS),
(5, JSON_ARRAY('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'), 1, @SYS),
(6, JSON_ARRAY('NEW', 'PENDING_APPROVAL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'), 1, @SYS);

INSERT INTO ServiceDepartment (ServiceID, DepartmentID, IsPrimary, CreatedBy) VALUES
(1, 1, 1, @SYS),
(2, 2, 1, @SYS),
(3, 1, 1, @SYS),
(4, 1, 1, @SYS),
(5, 2, 1, @SYS),
(6, 3, 1, @SYS);

INSERT INTO ServiceApprovalRule (
    ServiceID, ApprovalRuleName, RequiredStagesCount, AutoApproveLimit, CreatedBy
) VALUES
(2, 'IT Infrastructure Service Review', 1, NULL, @SYS),
(6, 'Security Clearance Approval', 1, NULL, @SYS);

-- ============================================================================
-- MODULE 9: APPROVAL MANAGEMENT
-- ============================================================================

INSERT INTO ApprovalRule (
    ApprovalRuleID, TenantID, RuleName, Description, MinCost, MaxCost, CurrencyCode, CreatedBy
) VALUES
(1, NULL, 'IT Network Service Approval Rule', 'Manager approval required before dispatching high-impact IT technician', 0.00, NULL, 'ETB', @SYS),
(2, 1, 'Acme Internal Department Approval', 'Internal approval for requests impacting Acme technology budget', 1000.00, NULL, 'ETB', @SYS);

INSERT INTO ApprovalGroup (ApprovalGroupID, TenantID, GroupName, Description, CreatedBy) VALUES
(1, 1, 'Acme Technical Approvers', 'Lead managers authorized to validate IT requests', @SYS),
(2, NULL, 'Park Facility Operations Reviewers', 'Campus managers authorized to approve high-cost repair work', @SYS);

INSERT INTO ApprovalMember (ApprovalGroupID, UserID, CreatedBy) VALUES
(1, 3, @SYS),
(2, 2, @SYS);

-- ============================================================================
-- MODULE 11: SLA & ESCALATION ENGINE
-- ============================================================================

INSERT INTO SLAPolicy (SLAPolicyID, PolicyName, Description, BusinessCalendarID, CreatedBy) VALUES
(1, 'Ethiopian IT Park Standard SLA Framework', 'Default enterprise response and resolution target matrix', 1, @SYS);

INSERT INTO SLAStage (SLAStageID, SLAPolicyID, PriorityCode, TargetResponseMinutes, TargetResolutionMinutes, CreatedBy) VALUES
(1, 1, 'LOW', 480, 2880, @SYS),     -- 8h Response / 48h Resolution
(2, 1, 'MEDIUM', 240, 1440, @SYS),   -- 4h Response / 24h Resolution
(3, 1, 'HIGH', 60, 480, @SYS),       -- 1h Response / 8h Resolution
(4, 1, 'CRITICAL', 15, 240, @SYS);   -- 15m Response / 4h Resolution (24x7)

INSERT INTO PauseReason (PauseReasonID, ReasonCode, ReasonName, StopTimer, CreatedBy) VALUES
(1, 'AWAITING_PARTS', 'Awaiting Spare Parts / Vendor Delivery', 1, @SYS),
(2, 'CUSTOMER_UNAVAILABLE', 'Awaiting Tenant Site Access / Customer Feedback', 1, @SYS),
(3, 'WEATHER_SAFETY', 'Safety Hold (Adverse Weather / High Voltage Risk)', 1, @SYS);

INSERT INTO ServiceSLA (ServiceID, SLAPolicyID, CreatedBy) VALUES
(1, 1, @SYS),
(2, 1, @SYS),
(3, 1, @SYS),
(4, 1, @SYS),
(5, 1, @SYS),
(6, 1, @SYS);

INSERT INTO EscalationRule (
    EscalationRuleID, SLAStageID, RuleName, TriggerOffsetMinutes,
    TriggerTypeCode, TargetEscalationLevel, ActionTypeCode, ReassignedTeamID, CreatedBy
) VALUES
(1, 3, 'High Priority Response Breach Escalation', 0, 'RESPONSE_BREACH', 1, 'NOTIFY_MANAGER', 1, @SYS),
(2, 4, 'Critical Incident Escalation to Head of Facilities', 0, 'RESOLUTION_BREACH', 2, 'NOTIFY_MANAGER', 2, @SYS);

INSERT INTO EscalationRecipient (EscalationRuleID, UserID, NotificationChannelCode, CreatedBy) VALUES
(1, 2, 'EMAIL', @SYS),
(2, 1, 'EMAIL', @SYS);

-- ============================================================================
-- MODULE 10: INTELLIGENT DISPATCH & TECHNICIAN SCHEDULING
-- ============================================================================

INSERT INTO DispatchQueue (DispatchQueueID, QueueCode, QueueName, Description, CreatedBy) VALUES
(1, 'FACILITY-QUEUE', 'Facilities Dispatch Queue', 'Primary dispatch queue for building maintenance, civil, and HVAC', @SYS),
(2, 'IT-QUEUE', 'Data Center & IT Support Queue', 'Primary dispatch queue for fiber optics, network switches, and colocation', @SYS);

INSERT INTO Dispatcher (DispatcherID, UserID, DispatchQueueID, CreatedBy) VALUES
(1, 6, 1, @SYS),
(2, 9, 2, @SYS);

INSERT INTO TechnicianAvailability (UserID, AvailabilityStatusCode, CreatedBy) VALUES
(5, 'AVAILABLE', @SYS),
(10, 'AVAILABLE', @SYS);

INSERT INTO TechnicianSkill (UserID, SkillCode, ExperienceYears, CreatedBy) VALUES
(5, 'HVAC', 5, @SYS),
(5, 'ELECTRICAL', 3, @SYS),
(10, 'FIBER_OPTICS', 6, @SYS),
(10, 'CISCO_NETWORKING', 5, @SYS),
(10, 'DATA_CENTER_UPS', 4, @SYS);

-- ============================================================================
-- MODULE 7: PRODUCTION-REALISTIC ISSUE REQUESTS & WORK ORDERS
-- ============================================================================

INSERT INTO IssueRequest (
    IssueRequestID, TenantID, ServiceID, RequestNumber, Title, Description,
    RequestTypeCode, PriorityCode, StatusCode, RequestChannelCode, CategoryCode, SubCategoryCode,
    RequestSourceCode, RequesterUserID, BuildingID, OfficeSpaceID,
    AssignedDepartmentID, TargetResolutionDateTime, ResponseDueAt, ResolutionDueAt,
    ActualResolutionDateTime, EstimatedCost, ResolutionNotes, IsMajorIncident, CreatedBy
) VALUES
(
    1, 1, 1, 'IR-000001',
    'AC not cooling in Office A-101',
    'Chilled water cooling unit in Office A-101 is humming loudly but ambient temperature remains at 28C.',
    'MAINTENANCE', 'HIGH', 'ASSIGNED', 'WEB', 'FACILITIES', 'HVAC',
    'TENANT', 3, 1, 1,
    1, DATE_ADD(NOW(6), INTERVAL 8 HOUR), DATE_ADD(NOW(6), INTERVAL 1 HOUR), DATE_ADD(NOW(6), INTERVAL 8 HOUR),
    NULL, 1500.00, NULL, 0, @SYS
),
(
    2, 1, 2, 'IR-000002',
    'Internet connection packet loss & latency spike',
    'Multiple workstations in Block A Level 1 reporting 25% packet loss to cloud gateway.',
    'INCIDENT', 'MEDIUM', 'PENDING_APPROVAL', 'WEB', 'IT-SERVICES', 'NETWORK',
    'TENANT', 3, 1, 1,
    2, DATE_ADD(NOW(6), INTERVAL 24 HOUR), DATE_ADD(NOW(6), INTERVAL 2 HOUR), DATE_ADD(NOW(6), INTERVAL 24 HOUR),
    NULL, 800.00, NULL, 0, @SYS
),
(
    3, 2, 3, 'IR-000003',
    'Flickering corridor LED light fixture outside Suite A-102',
    'Ceiling LED fixture #4 outside Office A-102 is intermittently flickering causing discomfort.',
    'MAINTENANCE', 'LOW', 'IN_PROGRESS', 'MOBILE', 'FACILITIES', 'ELECTRICAL',
    'TENANT', 7, 1, 2,
    1, DATE_ADD(NOW(6), INTERVAL 48 HOUR), DATE_ADD(NOW(6), INTERVAL 4 HOUR), DATE_ADD(NOW(6), INTERVAL 48 HOUR),
    NULL, 500.00, NULL, 0, @SYS
),
(
    4, 3, 5, 'IR-000004',
    'Fiber optic splice attenuation in Server Room B-DC1',
    'Core gigabit uplink fiber showed severe attenuation (-22dB) causing failover link flapping.',
    'INCIDENT', 'CRITICAL', 'RESOLVED', 'WEB', 'IT-SERVICES', 'FIBER',
    'TENANT', 8, 2, 5,
    2, DATE_SUB(NOW(6), INTERVAL 2 HOUR), DATE_SUB(NOW(6), INTERVAL 5 HOUR), DATE_SUB(NOW(6), INTERVAL 1 HOUR),
    DATE_SUB(NOW(6), INTERVAL 2 HOUR), 2500.00, 'Re-spliced strand #4 and calibrated OTDR loss below 0.04dB.', 1, @SYS
),
(
    5, 2, 1, 'IR-000005',
    'High temperature alert in Logistics Dispatch Room A-102',
    'Wall-mounted AC compressor tripped circuit breaker due to dust accumulation on condenser coils.',
    'MAINTENANCE', 'HIGH', 'ASSIGNED', 'EMAIL', 'FACILITIES', 'HVAC',
    'TENANT', 7, 1, 2,
    1, DATE_ADD(NOW(6), INTERVAL 6 HOUR), DATE_ADD(NOW(6), INTERVAL 1 HOUR), DATE_ADD(NOW(6), INTERVAL 6 HOUR),
    NULL, 1200.00, NULL, 0, @SYS
);

INSERT INTO IssueRequestHistory (
    IssueRequestID, UserID, FieldName, OldValue, NewValue, ActionTypeCode, Remarks, CreatedBy
) VALUES
(1, 3, NULL, NULL, NULL, 'ISSUE_SUBMITTED', 'Issue request submitted by Acme representative Samuel Bekele', @SYS),
(1, 2, 'StatusCode', 'NEW', 'ASSIGNED', 'STATUS_CHANGED', 'Assigned by Facilities Manager Helen Facility to Maintenance Team', @SYS),
(2, 3, NULL, NULL, NULL, 'ISSUE_SUBMITTED', 'Network degradation reported by Acme representative Samuel Bekele', @SYS),
(2, 3, 'StatusCode', 'NEW', 'PENDING_APPROVAL', 'STATUS_CHANGED', 'Awaiting management validation from technical approvers', @SYS),
(3, 7, 'StatusCode', 'NEW', 'ASSIGNED', 'STATUS_CHANGED', 'Routed to Facilities Maintenance Response Team', @SYS),
(3, 5, 'StatusCode', 'ASSIGNED', 'IN_PROGRESS', 'STATUS_CHANGED', 'Technician Daniel Worku on site investigating LED driver unit', @SYS),
(4, 8, NULL, NULL, NULL, 'ISSUE_SUBMITTED', 'Critical fiber attenuation reported by Safaricom Tech Lead Dawit Haile', @SYS),
(4, 9, 'StatusCode', 'NEW', 'ASSIGNED', 'STATUS_CHANGED', 'Dispatched with top priority to Senior Network Engineer Abebe Kebede', @SYS),
(4, 10, 'StatusCode', 'ASSIGNED', 'IN_PROGRESS', 'STATUS_CHANGED', 'Field OTDR trace initiated on distribution frame B-DC1', @SYS),
(4, 10, 'StatusCode', 'IN_PROGRESS', 'RESOLVED', 'STATUS_CHANGED', 'Core fusion splice completed and 10Gbps line rate verified', @SYS),
(5, 7, NULL, NULL, NULL, 'ISSUE_SUBMITTED', 'High temperature warning submitted by Beta Logistics', @SYS),
(5, 2, 'StatusCode', 'NEW', 'ASSIGNED', 'STATUS_CHANGED', 'Assigned to Senior Maintenance Technician Daniel Worku', @SYS);

INSERT INTO IssueRequestComment (IssueRequestID, UserID, CommentText, IsInternal, CreatedBy) VALUES
(1, 3, 'Temperature reached 28.5C at 2:00 PM. Please expedite.', 0, @SYS),
(1, 5, 'Coolant pressure inspected. Replacing expansion valve gasket today.', 1, @SYS),
(4, 8, 'Link degradation observed on Safaricom BGP peering router.', 0, @SYS),
(4, 10, 'OTDR localized break 14.2 meters from patch panel B-12. Performing fusion splice.', 0, @SYS);

INSERT INTO Approval (
    ApprovalID, RequestID, ApprovalRuleID, Title, Description,
    TotalStages, CurrentStageNumber, ApprovalStatusCode, CreatedBy
) VALUES
(
    1, 2, 1, 'Approval for IR-000002 (Network Diagnostics)',
    'Technical review required before deploying network diagnostic team',
    1, 1, 'PENDING', @SYS
);

INSERT INTO ApprovalStage (
    ApprovalStageID, ApprovalID, StageNumber, ApproverGroupID,
    StageStatusCode, SequenceNumber, CreatedBy
) VALUES
(1, 1, 1, 1, 'PENDING', 1, @SYS);

INSERT INTO Assignment (
    AssignmentID, RequestID, AssignedUserID, AssignedTeamID,
    AssignmentStatusCode, CompleteDateTime, CreatedBy
) VALUES
(1, 1, 5, 1, 'ASSIGNED', NULL, @SYS),
(2, 3, 5, 1, 'IN_PROGRESS', NULL, @SYS),
(3, 4, 10, 2, 'COMPLETED', DATE_SUB(NOW(6), INTERVAL 2 HOUR), @SYS),
(4, 5, 5, 1, 'ASSIGNED', NULL, @SYS);

INSERT INTO AssignmentHistory (AssignmentID, ActionUserID, ActionTypeCode, Remarks, CreatedBy) VALUES
(1, 2, 'ASSIGNED', 'Assigned by Facilities Manager Helen Facility', @SYS),
(2, 5, 'STARTED', 'Technician Daniel Worku commenced field work', @SYS),
(3, 9, 'ASSIGNED', 'Urgent assignment to Senior Network Engineer Abebe Kebede', @SYS),
(3, 10, 'COMPLETED', 'Splice completed and optical power meter reading at -12.1dBm', @SYS),
(4, 2, 'ASSIGNED', 'Assigned to Technician Daniel Worku', @SYS);

INSERT INTO SLAClock (
    IssueRequestID, SLAStageID, ResponseDeadline, ResolutionDeadline,
    ResponseAchievedDateTime, ResolutionAchievedDateTime, ClockStatus, CreatedBy
) VALUES
(
    1, 3,
    DATE_ADD(NOW(6), INTERVAL 1 HOUR),
    DATE_ADD(NOW(6), INTERVAL 8 HOUR),
    NOW(6), NULL,
    'RUNNING', @SYS
),
(
    2, 2,
    DATE_ADD(NOW(6), INTERVAL 2 HOUR),
    DATE_ADD(NOW(6), INTERVAL 24 HOUR),
    NULL, NULL,
    'PAUSED', @SYS
),
(
    3, 1,
    DATE_ADD(NOW(6), INTERVAL 4 HOUR),
    DATE_ADD(NOW(6), INTERVAL 48 HOUR),
    NOW(6), NULL,
    'RUNNING', @SYS
),
(
    4, 4,
    DATE_SUB(NOW(6), INTERVAL 5 HOUR),
    DATE_SUB(NOW(6), INTERVAL 1 HOUR),
    DATE_SUB(NOW(6), INTERVAL 5 HOUR),
    DATE_SUB(NOW(6), INTERVAL 2 HOUR),
    'STOPPED', @SYS
),
(
    5, 3,
    DATE_ADD(NOW(6), INTERVAL 1 HOUR),
    DATE_ADD(NOW(6), INTERVAL 6 HOUR),
    NOW(6), NULL,
    'RUNNING', @SYS
);

-- ============================================================================
-- RESOLUTION & CUSTOMER FEEDBACK
-- ============================================================================

INSERT INTO Resolution (
    ResolutionID, IssueRequestID, ResolverUserID, ResolutionTypeCode,
    ResolutionSummary, ActionStepsTaken, VerificationNotes, CreatedBy
) VALUES
(
    1, 4, 10, 'PERMANENT_FIX',
    'Re-spliced core fiber strand #4 in rack B-12 and calibrated optical loss to 0.03dB.',
    '1. Traced physical break via EXFO FTB-1v2 OTDR.
2. Stripped and cleaved 250um buffer tube.
3. Fusion spliced strand #4 using Fujikura 90S+ core alignment machine.
4. Benchmarked link throughput with 10Gbps iperf3 over 15 minutes.',
    'Optical power meter verified -12.1dBm received signal. Zero packet loss confirmed by Safaricom NOC.',
    @SYS
);

INSERT INTO IssueRequestFeedback (
    FeedbackID, IssueRequestID, TenantID, SubmittedByUserID,
    Rating, ResolutionConfirmed, Comments, TimelinessRating, QualityRating, CreatedBy
) VALUES
(
    1, 4, 3, 8,
    5, 1,
    'Exceptional response speed and professional fiber optic repair! Core uplink was completely restored under 2 hours.',
    5, 5, @SYS
);

-- ============================================================================
-- MODULE 13: DOCUMENT MANAGEMENT & CATEGORIES
-- ============================================================================

INSERT INTO sys_document_categories (
    CategoryID, CategoryCode, CategoryName, Description, Icon, IsActive
) VALUES
(1, 'DOC_CAT_LEASE', 'Lease Agreements & Contracts', 'Signed commercial lease documents, addenda, and space allocations', 'FileText', 1),
(2, 'DOC_CAT_TICKET', 'Issue & Work Order Attachments', 'Diagnostic photos, completion signoff sheets, and inspection certificates', 'Paperclip', 1),
(3, 'DOC_CAT_ASSET', 'Engineering Blueprints & Manuals', 'Building architectural schematics, electrical single-line diagrams, and HVAC specs', 'Cpu', 1),
(4, 'DOC_CAT_SLA', 'SLA Frameworks & Policies', 'Enterprise SLA service contracts, quality commitments, and operating guidelines', 'Shield', 1),
(5, 'DOC_CAT_REPORTS', 'Executive Audit & Performance Reports', 'Monthly compliance summaries, incident post-mortems, and uptime certificates', 'BarChart3', 1);

INSERT INTO DocumentCategory (DocumentCategoryID, CategoryCode, CategoryName, CreatedBy) VALUES
(1, 'LEASE', 'Lease Documents', @SYS),
(2, 'ISSUE', 'Issue Attachments', @SYS),
(3, 'POLICY', 'Policy Documents', @SYS);

INSERT INTO DocumentType (DocumentTypeID, DocumentTypeCode, DocumentTypeName, CreatedBy) VALUES
(1, 'PDF', 'Portable Document Format (.pdf)', @SYS),
(2, 'IMAGE', 'Image File (.jpg, .png, .webp)', @SYS),
(3, 'DOCX', 'Word Processing Document (.docx)', @SYS);

-- ============================================================================
-- MODULE 14: KNOWLEDGE BASE & FAQS
-- ============================================================================

INSERT INTO KnowledgeCategory (KnowledgeCategoryID, BusinessParkID, CategoryCode, CategoryName, CreatedBy) VALUES
(1, 1, 'FACILITIES-KB', 'Campus Facilities Maintenance Guide', @SYS),
(2, 1, 'IT-KB', 'Data Center & Telecom Connectivity Guide', @SYS);

INSERT INTO KnowledgeArticle (
    KnowledgeCategoryID, Title, ContentHTML, ArticleStatusCode,
    AuthorUserID, SearchKeywords, CreatedBy
) VALUES
(
    1, 'HVAC Troubleshooting & Temperature Settings',
    '<p>Prior to logging a cooling request, ensure thermostat digital display is active, filters are unobstructed, and return vents have at least 1 meter clearance.</p>',
    'PUBLISHED', 2, 'hvac,cooling,ac,temperature,facilities', @SYS
),
(
    2, 'Colocation Server Room Access & Cabling Rules',
    '<p>All cross-connect patch cables in Block B Data Center must use LSZH jacketed OM4 or OS2 single-mode cabling and be labeled per TIA-606 standards.</p>',
    'PUBLISHED', 9, 'fiber,data center,cabling,colocation,telecom', @SYS
);

INSERT INTO FAQ (FAQID, BusinessParkID, Question, AnswerHTML, DisplayOrder, CreatedBy) VALUES
(
    1, NULL,
    'How do I submit an urgent service request?',
    '<p>Log in to the ITMS portal, select Service Catalog, choose the applicable service category (Facilities or IT), provide title, office location, description, and submit. High/Critical issues automatically alert dispatchers.</p>',
    1, @SYS
),
(
    2, NULL,
    'What are standard SLA response targets at Ethiopian IT Park?',
    '<p>Standard SLA response targets are: Critical (15 minutes), High (1 hour), Medium (4 hours), and Low (8 hours).</p>',
    2, @SYS
);

-- ============================================================================
-- MODULE 16: NOTIFICATIONS & ALERTS
-- ============================================================================

INSERT INTO NotificationChannel (NotificationChannelID, ChannelCode, ChannelName, CreatedBy) VALUES
(1, 'IN_APP', 'In-App Web Notification', @SYS),
(2, 'EMAIL', 'Automated Email Alert', @SYS),
(3, 'SMS', 'SMS Text Alert', @SYS);

INSERT INTO NotificationType (NotificationTypeID, TypeCode, TypeName, CreatedBy) VALUES
(1, 'ISSUE_CREATED', 'New Issue Request Submitted', @SYS),
(2, 'ISSUE_ASSIGNED', 'Work Order Assigned to Technician', @SYS),
(3, 'SLA_BREACH', 'SLA Response / Resolution Breach Warning', @SYS),
(4, 'APPROVAL_REQUIRED', 'Manager Approval Action Required', @SYS),
(5, 'ISSUE_RESOLVED', 'Issue Request Marked Resolved', @SYS);

INSERT INTO NotificationTemplate (
    NotificationTemplateID, NotificationTypeID, NotificationChannelID,
    TemplateCode, TemplateSubject, TemplateBody, CreatedBy
) VALUES
(
    1, 1, 2, 'ISSUE_CREATED_EMAIL',
    'New Service Request {{requestNumber}} — {{title}}',
    'Dear {{recipientName}},

A new service request {{requestNumber}} has been submitted by {{requesterName}} with priority {{priority}}.
Title: {{title}}

Please log in to review.',
    @SYS
),
(
    2, 2, 1, 'ISSUE_ASSIGNED_INAPP',
    NULL,
    'Work Order {{requestNumber}} has been assigned to your queue.',
    @SYS
);

INSERT INTO Notification (
    NotificationID, NotificationTypeID, Title, MessageText,
    TriggeredByTable, TriggeredByID, CreatedBy
) VALUES
(
    1, 1,
    'Service Request IR-000001 Assigned',
    'Request IR-000001 (AC repair at Office A-101) has been assigned to technician Daniel Worku.',
    'IssueRequest', 1, @SYS
),
(
    2, 5,
    'Critical Incident IR-000004 Resolved',
    'Fiber optic splice in Server Room B-DC1 has been successfully completed and benchmarked.',
    'IssueRequest', 4, @SYS
);

INSERT INTO NotificationRecipient (
    NotificationRecipientID, NotificationID, RecipientUserID, NotificationChannelID, CreatedBy
) VALUES
(1, 1, 5, 1, @SYS),
(2, 2, 8, 1, @SYS);

INSERT INTO UserNotification (
    UserNotificationID, NotificationID, UserID, ChannelCode,
    CustomTitle, CustomMessage, IsRead, CreatedBy
) VALUES
(
    1, 1, 5, 'IN_APP',
    'Work Order Assigned: IR-000001',
    'AC repair at Office A-101 has been assigned to you with HIGH priority.',
    0, @SYS
),
(
    2, 2, 8, 'IN_APP',
    'Service Restored: IR-000004',
    'Core fiber optic link restored. Please review resolution notes and confirm satisfaction.',
    1, @SYS
),
(
    3, 1, 1, 'IN_APP',
    'System Initialization Completed',
    'Ethiopian IT Park ITMS master seed data successfully loaded into active database schema.',
    0, @SYS
);

-- ============================================================================
-- ENTERPRISE REPORTING & ANALYTICS
-- ============================================================================

INSERT INTO SavedReport (
    SavedReportID, TenantID, ReportName, Description, ReportTypeCode,
    ConfigJson, VisibilityCode, CreatedBy
) VALUES
(
    1, NULL,
    'Executive SLA Compliance & Quality KPI Matrix',
    'Monthly breakdown of SLA response and resolution compliance rates across campus departments',
    'SLA_COMPLIANCE',
    JSON_OBJECT('metrics', JSON_ARRAY('compliance_rate', 'breach_count', 'avg_resolution_hours'), 'groupBy', 'Department', 'timeRange', 'LAST_30_DAYS'),
    'PUBLIC', @SYS
),
(
    2, NULL,
    'Campus Issue Volume & Category Distribution',
    'Trend analysis of tickets raised, in progress, and closed by service category',
    'REQUEST_ANALYTICS',
    JSON_OBJECT('metrics', JSON_ARRAY('total_requests', 'resolved_requests', 'pending_requests'), 'groupBy', 'Category', 'timeRange', 'LAST_90_DAYS'),
    'PUBLIC', @SYS
),
(
    3, NULL,
    'Tenant Customer Satisfaction & Technician Scorecard',
    'Aggregated customer satisfaction ratings, timeliness score, and quality feedback',
    'TENANT_SATISFACTION',
    JSON_OBJECT('metrics', JSON_ARRAY('avg_rating', 'avg_timeliness', 'avg_quality'), 'groupBy', 'Tenant', 'timeRange', 'ALL_TIME'),
    'PUBLIC', @SYS
);

INSERT INTO ReportSchedule (
    ReportScheduleID, SavedReportID, TenantID, ScheduleName, ReportTypeCode,
    FrequencyCode, CronExpression, RecipientsJson, ExportFormat, Status, CreatedBy
) VALUES
(
    1, 1, NULL,
    'Weekly Executive SLA Summary',
    'SLA_COMPLIANCE', 'WEEKLY', '0 8 * * 1',
    JSON_ARRAY('superadmin@businesspark.local', 'facility@businesspark.local'),
    'PDF', 'ACTIVE', @SYS
),
(
    2, 2, NULL,
    'Monthly Ethiopian IT Park Operational Review',
    'REQUEST_ANALYTICS', 'MONTHLY', '0 8 1 * *',
    JSON_ARRAY('superadmin@businesspark.local'),
    'CSV', 'ACTIVE', @SYS
);

-- ============================================================================
-- AUDIT & ENTERPRISE SEARCH INDEXES
-- ============================================================================

INSERT INTO AuditAction (AuditActionID, ActionCode, ActionName, CreatedBy) VALUES
(1, 'CREATE', 'Create Record', @SYS),
(2, 'UPDATE', 'Update Record', @SYS),
(3, 'DELETE', 'Delete Record', @SYS),
(4, 'LOGIN', 'User Sign In', @SYS),
(5, 'ASSIGN', 'Assign Request', @SYS);

INSERT INTO AuditEntity (AuditEntityID, EntityName, TableName, CreatedBy) VALUES
(1, 'IssueRequest', 'IssueRequest', @SYS),
(2, 'Tenant', 'Tenant', @SYS),
(3, 'User', 'User', @SYS),
(4, 'Service', 'Service', @SYS);

INSERT INTO SearchIndex (SearchIndexID, IndexCode, IndexName, TargetTableName, CreatedBy) VALUES
(1, 'ISSUE_INDEX', 'Issue Request Global Index', 'IssueRequest', @SYS),
(2, 'TENANT_INDEX', 'Tenant Directory Index', 'Tenant', @SYS),
(3, 'USER_INDEX', 'User Directory Index', 'User', @SYS),
(4, 'SERVICE_INDEX', 'Service Catalog Index', 'Service', @SYS);

INSERT INTO SearchCategory (SearchCategoryID, CategoryCode, CategoryName, DisplayOrder, CreatedBy) VALUES
(1, 'ISSUES', 'Issue Requests & Work Orders', 1, @SYS),
(2, 'TENANTS', 'Tenant Organizations', 2, @SYS),
(3, 'USERS', 'Staff & Technicians', 3, @SYS),
(4, 'SERVICES', 'Service Catalog Offerings', 4, @SYS),
(5, 'ASSETS', 'Campus Physical Assets', 5, @SYS),
(6, 'DOCUMENTS', 'Document Repository', 6, @SYS);

-- ============================================================================
-- RESET TRANSACTION AUTO_INCREMENT START POSITIONS
-- ============================================================================

ALTER TABLE Industry AUTO_INCREMENT = 50;
ALTER TABLE TenantType AUTO_INCREMENT = 50;
ALTER TABLE OfficeType AUTO_INCREMENT = 50;
ALTER TABLE ServiceType AUTO_INCREMENT = 50;
ALTER TABLE ServiceLevel AUTO_INCREMENT = 50;
ALTER TABLE TimeZone AUTO_INCREMENT = 50;
ALTER TABLE Currency AUTO_INCREMENT = 50;
ALTER TABLE StatusDefinition AUTO_INCREMENT = 50;
ALTER TABLE PriorityDefinition AUTO_INCREMENT = 50;
ALTER TABLE LookupType AUTO_INCREMENT = 50;
ALTER TABLE LookupValue AUTO_INCREMENT = 50;
ALTER TABLE FeatureFlag AUTO_INCREMENT = 50;
ALTER TABLE ConfigurationCategory AUTO_INCREMENT = 50;
ALTER TABLE SystemSetting AUTO_INCREMENT = 50;
ALTER TABLE BusinessRule AUTO_INCREMENT = 50;
ALTER TABLE NumberSequence AUTO_INCREMENT = 50;
ALTER TABLE Localization AUTO_INCREMENT = 50;
ALTER TABLE LanguageResource AUTO_INCREMENT = 50;

ALTER TABLE SystemModule AUTO_INCREMENT = 50;
ALTER TABLE BusinessPark AUTO_INCREMENT = 50;
ALTER TABLE FacilityZone AUTO_INCREMENT = 50;
ALTER TABLE Location AUTO_INCREMENT = 50;
ALTER TABLE Building AUTO_INCREMENT = 50;
ALTER TABLE Floor AUTO_INCREMENT = 50;
ALTER TABLE OfficeSpace AUTO_INCREMENT = 50;

ALTER TABLE Tenant AUTO_INCREMENT = 50;
ALTER TABLE TenantContact AUTO_INCREMENT = 50;
ALTER TABLE TenantAddress AUTO_INCREMENT = 50;
ALTER TABLE LeaseAgreement AUTO_INCREMENT = 50;
ALTER TABLE TenantOfficeAllocation AUTO_INCREMENT = 50;
ALTER TABLE OfficeAllocationHistory AUTO_INCREMENT = 50;

ALTER TABLE AuthenticationProvider AUTO_INCREMENT = 50;
ALTER TABLE `User` AUTO_INCREMENT = 50;
ALTER TABLE UserAccount AUTO_INCREMENT = 50;
ALTER TABLE TenantRepresentative AUTO_INCREMENT = 50;
ALTER TABLE TenantSetting AUTO_INCREMENT = 50;

ALTER TABLE `Resource` AUTO_INCREMENT = 50;
ALTER TABLE `Action` AUTO_INCREMENT = 50;
ALTER TABLE ResourcePermission AUTO_INCREMENT = 50;
ALTER TABLE PermissionGroup AUTO_INCREMENT = 50;
ALTER TABLE Permission AUTO_INCREMENT = 50;
ALTER TABLE `Role` AUTO_INCREMENT = 50;

ALTER TABLE OrganizationUnit AUTO_INCREMENT = 50;
ALTER TABLE Department AUTO_INCREMENT = 50;
ALTER TABLE CostCenter AUTO_INCREMENT = 50;
ALTER TABLE DepartmentBudget AUTO_INCREMENT = 50;
ALTER TABLE Team AUTO_INCREMENT = 50;
ALTER TABLE `Position` AUTO_INCREMENT = 50;
ALTER TABLE EmployeeAssignment AUTO_INCREMENT = 50;

ALTER TABLE BusinessCalendar AUTO_INCREMENT = 50;
ALTER TABLE HolidayCalendar AUTO_INCREMENT = 50;

ALTER TABLE ServiceCategory AUTO_INCREMENT = 50;
ALTER TABLE ServiceCategoryDepartmentMapping AUTO_INCREMENT = 50;
ALTER TABLE Service AUTO_INCREMENT = 50;

ALTER TABLE ApprovalRule AUTO_INCREMENT = 50;
ALTER TABLE ApprovalGroup AUTO_INCREMENT = 50;
ALTER TABLE Approval AUTO_INCREMENT = 50;
ALTER TABLE ApprovalStage AUTO_INCREMENT = 50;

ALTER TABLE SLAPolicy AUTO_INCREMENT = 50;
ALTER TABLE SLAStage AUTO_INCREMENT = 50;
ALTER TABLE PauseReason AUTO_INCREMENT = 50;
ALTER TABLE EscalationRule AUTO_INCREMENT = 50;

ALTER TABLE DispatchQueue AUTO_INCREMENT = 50;
ALTER TABLE Dispatcher AUTO_INCREMENT = 50;

ALTER TABLE IssueRequest AUTO_INCREMENT = 50;
ALTER TABLE IssueRequestHistory AUTO_INCREMENT = 50;
ALTER TABLE IssueRequestComment AUTO_INCREMENT = 50;
ALTER TABLE Assignment AUTO_INCREMENT = 50;
ALTER TABLE AssignmentHistory AUTO_INCREMENT = 50;
ALTER TABLE SLAClock AUTO_INCREMENT = 50;
ALTER TABLE Resolution AUTO_INCREMENT = 50;
ALTER TABLE IssueRequestFeedback AUTO_INCREMENT = 50;

ALTER TABLE sys_document_categories AUTO_INCREMENT = 50;
ALTER TABLE DocumentCategory AUTO_INCREMENT = 50;
ALTER TABLE DocumentType AUTO_INCREMENT = 50;
ALTER TABLE KnowledgeCategory AUTO_INCREMENT = 50;
ALTER TABLE KnowledgeArticle AUTO_INCREMENT = 50;
ALTER TABLE FAQ AUTO_INCREMENT = 50;

ALTER TABLE NotificationChannel AUTO_INCREMENT = 50;
ALTER TABLE NotificationType AUTO_INCREMENT = 50;
ALTER TABLE NotificationTemplate AUTO_INCREMENT = 50;
ALTER TABLE Notification AUTO_INCREMENT = 50;
ALTER TABLE NotificationRecipient AUTO_INCREMENT = 50;
ALTER TABLE UserNotification AUTO_INCREMENT = 50;

ALTER TABLE SavedReport AUTO_INCREMENT = 50;
ALTER TABLE ReportSchedule AUTO_INCREMENT = 50;
ALTER TABLE AuditAction AUTO_INCREMENT = 50;
ALTER TABLE AuditEntity AUTO_INCREMENT = 50;
ALTER TABLE SearchIndex AUTO_INCREMENT = 50;
ALTER TABLE SearchCategory AUTO_INCREMENT = 50;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS;

-- ============================================================================
-- ENTERPRISE SEED DATA LOAD COMPLETE
-- ============================================================================

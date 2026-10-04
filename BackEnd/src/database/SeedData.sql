-- ============================================================================
-- ENTERPRISE ISSUE TRACKING SYSTEM — SEED DATA
-- ============================================================================
-- Prerequisite : Run Database.sql first on database `issue_tracking_system`
-- Module 20    : Task Management EXCLUDED (no task seed data)
-- Environment  : Development / QA bootstrap data
-- ============================================================================
-- Usage:
--   1. mysql -u root -p < BackEnd/src/database/Database.sql
--   2. mysql -u root -p issue_tracking_system < BackEnd/src/database/SeedData.sql
--
-- Default login (all seeded accounts):
--   Username : superadmin | tenantadmin | betatenant | employee | technician | dispatcher | facility
--   Password : Admin@123
-- ============================================================================
-- Stable ID map (for API testing & FK references):
--   Users      1-7  | Tenants 1-2 | BusinessPark 1 | Services 1-3
--   Issues     1-3  | Roles 1-6   | Departments 1-4 | Approvals 1
-- ============================================================================

USE issue_tracking_system;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Optional re-seed cleanup (dev only — deletes seeded rows by fixed IDs)
-- ---------------------------------------------------------------------------
DELETE FROM ApprovalDecision WHERE ApprovalStageID = 1;
DELETE FROM ApprovalStage WHERE ApprovalID = 1;
DELETE FROM Approval WHERE ApprovalID = 1;
DELETE FROM ApprovalMember WHERE ApprovalGroupID = 1;
DELETE FROM ApprovalGroup WHERE ApprovalGroupID = 1;
DELETE FROM ApprovalRule WHERE ApprovalRuleID = 1;
DELETE FROM ServiceApprovalRule WHERE ServiceID = 2;
DELETE FROM IssueRequestHistory WHERE IssueRequestID BETWEEN 1 AND 3;
DELETE FROM IssueRequestComment WHERE IssueRequestID BETWEEN 1 AND 3;
DELETE FROM AssignmentHistory WHERE AssignmentID BETWEEN 1 AND 2;
DELETE FROM Assignment WHERE AssignmentID BETWEEN 1 AND 2;
DELETE FROM SLAClock WHERE IssueRequestID BETWEEN 1 AND 3;
DELETE FROM IssueRequest WHERE IssueRequestID BETWEEN 1 AND 3;
DELETE FROM ServiceSLA WHERE ServiceID BETWEEN 1 AND 3;
DELETE FROM ServiceWorkflow WHERE ServiceID BETWEEN 1 AND 3;
DELETE FROM ServiceDepartment WHERE ServiceID BETWEEN 1 AND 3;
DELETE FROM Service WHERE ServiceID BETWEEN 1 AND 3;
DELETE FROM ServiceCategory WHERE ServiceCategoryID BETWEEN 1 AND 2;
DELETE FROM EscalationRecipient WHERE EscalationRuleID = 1;
DELETE FROM EscalationRule WHERE EscalationRuleID = 1;
DELETE FROM SLAStage WHERE SLAPolicyID = 1;
DELETE FROM SLAPolicy WHERE SLAPolicyID = 1;
DELETE FROM WorkingHour WHERE BusinessCalendarID = 1;
DELETE FROM HolidayCalendar WHERE BusinessCalendarID = 1;
DELETE FROM BusinessCalendar WHERE BusinessCalendarID = 1;
DELETE FROM Dispatcher WHERE DispatcherID = 1;
DELETE FROM DispatchQueue WHERE DispatchQueueID = 1;
DELETE FROM TechnicianAvailability WHERE UserID = 5;
DELETE FROM TechnicianSkill WHERE UserID = 5;
DELETE FROM UserRole WHERE UserID BETWEEN 1 AND 7;
DELETE FROM RolePermission WHERE RoleID IN (1, 2, 3, 4, 5, 6);
DELETE FROM Permission WHERE PermissionID BETWEEN 1 AND 8;
DELETE FROM ResourcePermission WHERE ResourcePermissionID BETWEEN 1 AND 8;
DELETE FROM `Role` WHERE RoleID IN (1, 2, 3, 4, 5, 6);
DELETE FROM PermissionGroup WHERE PermissionGroupID BETWEEN 1 AND 3;
DELETE FROM `Action` WHERE ActionID BETWEEN 1 AND 4;
DELETE FROM `Resource` WHERE ResourceID BETWEEN 1 AND 4;
DELETE FROM TenantRepresentative WHERE TenantRepresentativeID BETWEEN 1 AND 3;
DELETE FROM TenantSetting WHERE TenantSettingID BETWEEN 1 AND 2;
DELETE FROM EmployeeAssignment WHERE EmployeeAssignmentID BETWEEN 1 AND 5;
DELETE FROM Team WHERE TeamID = 1;
DELETE FROM FAQ WHERE FAQID = 1;
DELETE FROM KnowledgeArticle WHERE KnowledgeArticleID = 1;
DELETE FROM Department WHERE DepartmentID BETWEEN 1 AND 4;
DELETE FROM OrganizationUnit WHERE OrganizationUnitID BETWEEN 1 AND 3;
DELETE FROM UserAccount WHERE UserAccountID BETWEEN 1 AND 7;
DELETE FROM `User` WHERE UserID BETWEEN 1 AND 7;
DELETE FROM AuthenticationProvider WHERE AuthenticationProviderID = 1;
DELETE FROM TenantOfficeAllocation WHERE TenantOfficeAllocationID BETWEEN 1 AND 2;
DELETE FROM LeaseAgreement WHERE LeaseAgreementID BETWEEN 1 AND 2;
DELETE FROM TenantContact WHERE TenantContactID BETWEEN 1 AND 2;
DELETE FROM TenantAddress WHERE TenantAddressID BETWEEN 1 AND 2;
DELETE FROM Tenant WHERE TenantID BETWEEN 1 AND 2;
DELETE FROM OfficeSpace WHERE OfficeSpaceID BETWEEN 1 AND 4;
DELETE FROM Floor WHERE FloorID BETWEEN 1 AND 3;
DELETE FROM Building WHERE BuildingID BETWEEN 1 AND 2;
DELETE FROM FacilityZone WHERE FacilityZoneID = 1;
DELETE FROM Location WHERE LocationID = 1;
DELETE FROM BusinessPark WHERE BusinessParkID = 1;
DELETE FROM OfficeAllocationHistory WHERE OfficeAllocationHistoryID BETWEEN 1 AND 2;
DELETE FROM LookupValue WHERE LookupValueID BETWEEN 1 AND 11;
DELETE FROM LookupType WHERE LookupTypeID BETWEEN 1 AND 3;
DELETE FROM LanguageResource WHERE LocalizationID = 1;
DELETE FROM Localization WHERE LocalizationID = 1;
DELETE FROM NumberSequence WHERE NumberSequenceID BETWEEN 1 AND 2;
DELETE FROM BusinessRule WHERE BusinessRuleID BETWEEN 1 AND 2;
DELETE FROM SystemSetting WHERE SystemSettingID BETWEEN 1 AND 4;
DELETE FROM ConfigurationCategory WHERE ConfigurationCategoryID BETWEEN 1 AND 3;
DELETE FROM FeatureFlag WHERE FeatureFlagID BETWEEN 1 AND 3;
DELETE FROM PriorityDefinition WHERE PriorityDefinitionID BETWEEN 1 AND 4;
DELETE FROM StatusDefinition WHERE StatusDefinitionID BETWEEN 1 AND 8;
DELETE FROM Currency WHERE CurrencyID BETWEEN 1 AND 2;
DELETE FROM TimeZone WHERE TimeZoneID = 1;
DELETE FROM ServiceLevel WHERE ServiceLevelID BETWEEN 1 AND 2;
DELETE FROM ServiceType WHERE ServiceTypeID BETWEEN 1 AND 3;
DELETE FROM OfficeType WHERE OfficeTypeID BETWEEN 1 AND 2;
DELETE FROM TenantType WHERE TenantTypeID BETWEEN 1 AND 2;
DELETE FROM Industry WHERE IndustryID BETWEEN 1 AND 3;
DELETE FROM PauseReason WHERE PauseReasonID BETWEEN 1 AND 2;
DELETE FROM NotificationTemplate WHERE NotificationTemplateID BETWEEN 1 AND 2;
DELETE FROM NotificationType WHERE NotificationTypeID BETWEEN 1 AND 4;
DELETE FROM NotificationChannel WHERE NotificationChannelID BETWEEN 1 AND 3;
DELETE FROM AuditEntity WHERE AuditEntityID BETWEEN 1 AND 4;
DELETE FROM AuditAction WHERE AuditActionID BETWEEN 1 AND 5;
DELETE FROM SearchCategory WHERE SearchCategoryID BETWEEN 1 AND 6;
DELETE FROM SearchIndex WHERE SearchIndexID BETWEEN 1 AND 4;
DELETE FROM DocumentType WHERE DocumentTypeID BETWEEN 1 AND 3;
DELETE FROM DocumentCategory WHERE DocumentCategoryID BETWEEN 1 AND 3;
DELETE FROM KnowledgeCategory WHERE KnowledgeCategoryID = 1;

SET @SYS := 1;
-- bcrypt hash for password: Admin@123 (generated with bcryptjs, cost 10)
SET @PWD_HASH := '$2b$10$3qtXTXC6g0qjdcF4L5TsrumsfErSafCiIG9crfix8CeXEm0Yr3LjO';

-- ============================================================================
-- MODULE 18: CONFIGURATION & LOOKUP
-- ============================================================================

INSERT INTO Industry (IndustryID, IndustryCode, IndustryName, Description, CreatedBy) VALUES
(1, 'TECH', 'Technology', 'Software and IT services', @SYS),
(2, 'LOGISTICS', 'Logistics', 'Transport and warehousing', @SYS),
(3, 'FINANCE', 'Financial Services', 'Banking and insurance', @SYS);

INSERT INTO TenantType (TenantTypeID, TenantTypeCode, TenantTypeName, Description, CreatedBy) VALUES
(1, 'CORPORATE', 'Corporate Tenant', 'Large enterprise tenant', @SYS),
(2, 'SME', 'SME Tenant', 'Small and medium enterprise', @SYS);

INSERT INTO OfficeType (OfficeTypeID, OfficeTypeCode, OfficeTypeName, Description, CreatedBy) VALUES
(1, 'STANDARD', 'Standard Office', 'Regular office space', @SYS),
(2, 'EXECUTIVE', 'Executive Suite', 'Premium office space', @SYS);

INSERT INTO ServiceType (ServiceTypeID, ServiceTypeCode, ServiceTypeName, Description, CreatedBy) VALUES
(1, 'MAINTENANCE', 'Maintenance', 'Facility maintenance services', @SYS),
(2, 'IT', 'Information Technology', 'IT support services', @SYS),
(3, 'FACILITIES', 'Facilities', 'General facilities services', @SYS);

INSERT INTO ServiceLevel (ServiceLevelID, ServiceLevelCode, ServiceLevelName, Description, CreatedBy) VALUES
(1, 'STANDARD', 'Standard', 'Standard service level', @SYS),
(2, 'PREMIUM', 'Premium', 'Premium priority service level', @SYS);

INSERT INTO TimeZone (TimeZoneID, TimeZoneCode, DisplayName, UtcOffsetMinutes, CreatedBy) VALUES
(1, 'Africa/Addis_Ababa', 'East Africa Time (EAT)', 180, @SYS);

INSERT INTO Currency (CurrencyID, CurrencyCode, CurrencyName, Symbol, CreatedBy) VALUES
(1, 'ETB', 'Ethiopian Birr', 'Br', @SYS),
(2, 'USD', 'US Dollar', '$', @SYS);

INSERT INTO StatusDefinition (StatusDefinitionID, StatusCode, StatusName, EntityName, CreatedBy) VALUES
(1, 'NEW', 'New', 'IssueRequest', @SYS),
(2, 'PENDING_APPROVAL', 'Pending Approval', 'IssueRequest', @SYS),
(3, 'ASSIGNED', 'Assigned', 'IssueRequest', @SYS),
(4, 'IN_PROGRESS', 'In Progress', 'IssueRequest', @SYS),
(5, 'PENDING', 'Pending', 'IssueRequest', @SYS),
(6, 'RESOLVED', 'Resolved', 'IssueRequest', @SYS),
(7, 'CLOSED', 'Closed', 'IssueRequest', @SYS),
(8, 'CANCELLED', 'Cancelled', 'IssueRequest', @SYS);

INSERT INTO PriorityDefinition (PriorityDefinitionID, PriorityCode, PriorityName, Weight, CreatedBy) VALUES
(1, 'LOW', 'Low', 1, @SYS),
(2, 'MEDIUM', 'Medium', 2, @SYS),
(3, 'HIGH', 'High', 3, @SYS),
(4, 'CRITICAL', 'Critical', 4, @SYS);

INSERT INTO LookupType (LookupTypeID, LookupTypeCode, LookupTypeName, CreatedBy) VALUES
(1, 'REQUEST_TYPE', 'Issue Request Type', @SYS),
(2, 'REQUEST_CHANNEL', 'Submission Channel', @SYS),
(3, 'REQUEST_SOURCE', 'Request Source', @SYS);

INSERT INTO LookupValue (LookupValueID, LookupTypeID, LookupValueCode, LookupValueName, DisplayOrder, CreatedBy) VALUES
(1, 1, 'COMPLAINT', 'Complaint', 1, @SYS),
(2, 1, 'MAINTENANCE', 'Maintenance', 2, @SYS),
(3, 1, 'INCIDENT', 'Incident', 3, @SYS),
(4, 1, 'DISRUPTION', 'Disruption', 4, @SYS),
(5, 2, 'WEB', 'Web Portal', 1, @SYS),
(6, 2, 'MOBILE', 'Mobile App', 2, @SYS),
(7, 2, 'EMAIL', 'Email', 3, @SYS),
(8, 2, 'QR', 'QR Code', 4, @SYS),
(9, 3, 'TENANT', 'Tenant User', 1, @SYS),
(10, 3, 'EMPLOYEE', 'Employee', 2, @SYS),
(11, 3, 'GUEST', 'Guest User', 3, @SYS);

INSERT INTO FeatureFlag (FeatureFlagID, FlagCode, FlagName, IsEnabled, CreatedBy) VALUES
(1, 'GUEST_REQUESTS', 'Guest Issue Requests', 1, @SYS),
(2, 'MFA_REQUIRED', 'Multi-Factor Authentication Required', 0, @SYS),
(3, 'AUTO_DISPATCH', 'Automatic Dispatch', 1, @SYS);

INSERT INTO ConfigurationCategory (ConfigurationCategoryID, CategoryCode, CategoryName, CreatedBy) VALUES
(1, 'SECURITY', 'Security Settings', @SYS),
(2, 'ISSUE', 'Issue Management Settings', @SYS),
(3, 'NOTIFICATION', 'Notification Settings', @SYS);

INSERT INTO SystemSetting (SystemSettingID, ConfigurationCategoryID, SettingKey, SettingValue, DataType, CreatedBy) VALUES
(1, 1, 'PASSWORD_MIN_LENGTH', '8', 'INTEGER', @SYS),
(2, 1, 'MAX_LOGIN_ATTEMPTS', '5', 'INTEGER', @SYS),
(3, 2, 'ISSUE_AUTO_CLOSE_DAYS', '7', 'INTEGER', @SYS),
(4, 3, 'EMAIL_NOTIFICATIONS_ENABLED', 'true', 'BOOLEAN', @SYS);

INSERT INTO BusinessRule (BusinessRuleID, RuleCode, RuleName, RuleExpression, CreatedBy) VALUES
(1, 'TENANT_ISOLATION', 'Tenant Data Isolation', 'tenantId == currentUser.tenantId || currentUser.isParkAdmin', @SYS),
(2, 'PRIMARY_REPRESENTATIVE', 'Primary Representative Required', 'tenant.representatives.count(role==PRIMARY) >= 1', @SYS);

INSERT INTO NumberSequence (NumberSequenceID, SequenceCode, Prefix, NextNumber, IncrementValue, NumberWidth, CreatedBy) VALUES
(1, 'ISSUE_REQUEST', 'IR', 4, 1, 6, @SYS),
(2, 'LEASE_AGREEMENT', 'LS', 3, 1, 5, @SYS);

INSERT INTO Localization (LocalizationID, LanguageCode, CountryCode, LocaleName, CreatedBy) VALUES
(1, 'en', 'ET', 'English (Ethiopia)', @SYS),
(2, 'am', 'ET', 'አማርኛ (Amharic)', @SYS);

INSERT INTO LanguageResource (LocalizationID, ResourceKey, ResourceValue, CreatedBy) VALUES
(1, 'app.title', 'Issue Tracking System', @SYS),
(1, 'login.submit', 'Sign In', @SYS),
(1, 'issue.create', 'Create Issue Request', @SYS);

-- ============================================================================
-- MODULE 1: BUSINESS PARK MANAGEMENT
-- ============================================================================

INSERT INTO BusinessPark (
    BusinessParkID, BusinessParkCode, BusinessParkName, ShortName, Description,
    Country, City, TimeZone, CurrencyCode, LanguageCode, IsOperational, CreatedBy
) VALUES (
    1, 'ICT_PARK_AA', 'Ethiopian IT Park', 'EITP',
    'Central Ethiopian IT Park Campus — National ICT and Innovation Hub',
    'Ethiopia', 'Addis Ababa', 'Africa/Addis_Ababa', 'ETB', 'en', 1, @SYS
);

INSERT INTO Building (BuildingID, BusinessParkID, BuildingCode, BuildingName, TotalFloors, CreatedBy) VALUES
(1, 1, 'BLD-A', 'Block A', 5, @SYS),
(2, 1, 'BLD-B', 'Block B', 3, @SYS);

INSERT INTO Floor (FloorID, BuildingID, FloorNumber, FloorCode, FloorName, TotalOfficeSpaces, CreatedBy) VALUES
(1, 1, 1, 'A-GF', 'Block A - Ground Floor', 10, @SYS),
(2, 1, 2, 'A-L1', 'Block A - Level 1', 12, @SYS),
(3, 2, 1, 'B-GF', 'Block B - Ground Floor', 8, @SYS);

INSERT INTO OfficeSpace (
    OfficeSpaceID, FloorID, OfficeTypeID, OfficeNumber, OfficeName,
    SquareMeters, AvailabilityStatus, CreatedBy
) VALUES
(1, 1, 1, 'A-101', 'Office A-101', 45.00, 'OCCUPIED', @SYS),
(2, 1, 1, 'A-102', 'Office A-102', 40.00, 'OCCUPIED', @SYS),
(3, 2, 2, 'A-201', 'Executive A-201', 80.00, 'VACANT', @SYS),
(4, 3, 1, 'B-101', 'Office B-101', 50.00, 'VACANT', @SYS);

INSERT INTO Location (LocationID, BusinessParkID, LocationCode, LocationName, LocationType, CreatedBy) VALUES
(1, 1, 'CAMPUS-01', 'Main Campus', 'CAMPUS', @SYS);

INSERT INTO FacilityZone (
    FacilityZoneID, BusinessParkID, FacilityZoneCode, FacilityZoneName, ZoneType, CreatedBy
) VALUES
(1, 1, 'PARK-01', 'Visitor Parking', 'PARKING_LOT', @SYS);

-- ============================================================================
-- MODULE 2: TENANT MANAGEMENT
-- ============================================================================

INSERT INTO Tenant (
    TenantID, BusinessParkID, TenantTypeID, IndustryID, TenantCode, CompanyName,
    Status, OnboardedDate, CreatedBy
) VALUES
(1, 1, 1, 1, 'TNT-ACME', 'Acme Technologies PLC', 'ACTIVE', '2025-01-15', @SYS),
(2, 1, 2, 2, 'TNT-BETA', 'Beta Logistics Ltd', 'ACTIVE', '2025-03-01', @SYS);

INSERT INTO TenantContact (TenantContactID, TenantID, ContactType, Label, ContactValue, IsPrimary, CreatedBy) VALUES
(1, 1, 'EMAIL', 'Main Email', 'contact@acme-tech.local', 1, @SYS),
(2, 1, 'PHONE', 'Reception', '+251-11-000-0001', 0, @SYS);

INSERT INTO TenantAddress (
    TenantAddressID, TenantID, AddressType, Country, City, AddressLine1, CreatedBy
) VALUES
(1, 1, 'PHYSICAL', 'Ethiopia', 'Addis Ababa', 'Block A, Office A-101, Addis Business Park', @SYS),
(2, 2, 'PHYSICAL', 'Ethiopia', 'Addis Ababa', 'Block A, Office A-102, Addis Business Park', @SYS);

INSERT INTO LeaseAgreement (
    LeaseAgreementID, TenantID, AgreementNumber, StartDate, EndDate, ExecutionDate,
    MonthlyRentAmount, SecurityDepositAmount, CurrencyCode, Status, CreatedBy
) VALUES
(1, 1, 'LS-00001', '2025-01-01', '2027-12-31', '2024-12-15', 85000.00, 170000.00, 'ETB', 'ACTIVE', @SYS),
(2, 2, 'LS-00002', '2025-03-01', '2026-02-28', '2025-02-20', 62000.00, 124000.00, 'ETB', 'ACTIVE', @SYS);

INSERT INTO TenantOfficeAllocation (
    TenantOfficeAllocationID, TenantID, OfficeSpaceID, LeaseAgreementID,
    AllocatedDate, Status, CreatedBy
) VALUES
(1, 1, 1, 1, '2025-01-15', 'ACTIVE', @SYS),
(2, 2, 2, 2, '2025-03-01', 'ACTIVE', @SYS);

INSERT INTO OfficeAllocationHistory (
    OfficeAllocationHistoryID, OfficeSpaceID, TenantID, LeaseAgreementID,
    ActionType, Remarks, CreatedBy
) VALUES
(1, 1, 1, 1, 'ALLOCATED', 'Initial allocation to Acme Technologies', @SYS),
(2, 2, 2, 2, 'ALLOCATED', 'Initial allocation to Beta Logistics', @SYS);

-- ============================================================================
-- MODULE 4: IDENTITY & ACCESS MANAGEMENT
-- ============================================================================

INSERT INTO AuthenticationProvider (AuthenticationProviderID, ProviderCode, ProviderName, ConfigJson, CreatedBy) VALUES
(1, 'LOCAL', 'Local Authentication', JSON_OBJECT('type', 'local', 'bcryptRounds', 10), @SYS);

INSERT INTO `User` (
    UserID, TenantID, UserTypeCode, FirstName, LastName, Email, JobTitle, PreferredLanguage, CreatedBy
) VALUES
(1, NULL, 'PARK_ADMIN', 'System', 'Super Admin', 'superadmin@businesspark.local', 'Business Park Super Administrator', 'en', @SYS),
(2, NULL, 'PARK_STAFF', 'Helen', 'Facility', 'facility@businesspark.local', 'Facility Manager', 'en', @SYS),
(3, 1, 'TENANT_REPRESENTATIVE', 'Samuel', 'Bekele', 'tenantadmin@acme-tech.local', 'Tenant Representative', 'en', @SYS),
(4, 1, 'EMPLOYEE', 'Marta', 'Tesfaye', 'employee@acme-tech.local', 'Operations Officer', 'en', @SYS),
(5, NULL, 'TECHNICIAN', 'Daniel', 'Worku', 'technician@businesspark.local', 'Maintenance Technician', 'en', @SYS),
(6, NULL, 'DISPATCHER', 'Ruth', 'Alemu', 'dispatcher@businesspark.local', 'Service Dispatcher', 'en', @SYS),
(7, 2, 'TENANT_REPRESENTATIVE', 'Hanna', 'Mekonnen', 'tenantadmin@beta-logistics.local', 'Tenant Representative', 'en', @SYS);

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
(7, 7, 1, 'betatenant', @PWD_HASH, 'ACTIVE', 0, @SYS);

INSERT INTO TenantRepresentative (
    TenantRepresentativeID, TenantID, UserID, RepresentativeRole, IsPrimary, CreatedBy
) VALUES
(1, 1, 3, 'PRIMARY', 1, @SYS),
(2, 1, 4, 'SECONDARY', 0, @SYS),
(3, 2, 7, 'PRIMARY', 1, @SYS);

INSERT INTO TenantSetting (TenantSettingID, TenantID, SettingKey, SettingValue, DataType, CreatedBy) VALUES
(1, 1, 'NOTIFY_ON_ISSUE_CREATE', 'true', 'BOOLEAN', @SYS),
(2, 2, 'NOTIFY_ON_ISSUE_CREATE', 'true', 'BOOLEAN', @SYS);

-- ============================================================================
-- MODULE 5: ROLE & PERMISSION MANAGEMENT
-- ============================================================================

INSERT INTO `Resource` (ResourceID, ResourceCode, ResourceName, Description, CreatedBy) VALUES
(1, 'ISSUE', 'Issue Request', 'Issue and service request records', @SYS),
(2, 'TENANT', 'Tenant', 'Tenant organization records', @SYS),
(3, 'SERVICE', 'Service Catalog', 'Service catalog records', @SYS),
(4, 'USER', 'User', 'User and identity records', @SYS);

INSERT INTO `Action` (ActionID, ActionCode, ActionName, Description, CreatedBy) VALUES
(1, 'CREATE', 'Create', 'Create records', @SYS),
(2, 'READ', 'Read', 'View records', @SYS),
(3, 'UPDATE', 'Update', 'Modify records', @SYS),
(4, 'DELETE', 'Delete', 'Soft delete records', @SYS);

INSERT INTO ResourcePermission (ResourcePermissionID, ResourceID, ActionID, Description, CreatedBy) VALUES
(1, 1, 1, 'Create issue requests', @SYS),
(2, 1, 2, 'View issue requests', @SYS),
(3, 1, 3, 'Update issue requests', @SYS),
(4, 1, 4, 'Cancel/delete issue requests', @SYS),
(5, 2, 2, 'View tenants', @SYS),
(6, 2, 3, 'Manage tenants', @SYS),
(7, 3, 2, 'View services', @SYS),
(8, 4, 3, 'Manage users', @SYS);

INSERT INTO PermissionGroup (PermissionGroupID, GroupCode, GroupName, Description, CreatedBy) VALUES
(1, 'ISSUE_OPS', 'Issue Operations', 'Issue lifecycle permissions', @SYS),
(2, 'TENANT_REP', 'Tenant Representation', 'Tenant representative permissions', @SYS),
(3, 'PLATFORM_ADMIN', 'Platform Administration', 'Platform-wide permissions', @SYS);

INSERT INTO Permission (PermissionID, PermissionGroupID, ResourcePermissionID, PermissionCode, PermissionName, CreatedBy) VALUES
(1, 1, 1, 'issue:create', 'Create Issue Request', @SYS),
(2, 1, 2, 'issue:read', 'View Issue Request', @SYS),
(3, 1, 3, 'issue:update', 'Update Issue Request', @SYS),
(4, 1, 4, 'issue:delete', 'Cancel Issue Request', @SYS),
(5, 2, 5, 'tenant:read', 'View Tenant', @SYS),
(6, 2, 6, 'tenant:manage', 'Manage Tenant', @SYS),
(7, 3, 7, 'service:read', 'View Service Catalog', @SYS),
(8, 3, 8, 'user:manage', 'Manage Users', @SYS);

INSERT INTO `Role` (RoleID, TenantID, RoleCode, RoleName, Description, IsSystemRole, CreatedBy) VALUES
(1, NULL, 'PARK_SUPER_ADMIN', 'Business Park Super Admin', 'Full platform access', 1, @SYS),
(2, 1, 'TENANT_REPRESENTATIVE', 'Tenant Representative', 'Authorized tenant representative account', 1, @SYS),
(6, 2, 'TENANT_REPRESENTATIVE', 'Tenant Representative', 'Beta tenant authorized representative', 1, @SYS),
(3, 1, 'EMPLOYEE', 'Employee', 'Submit and track own requests', 1, @SYS),
(4, NULL, 'TECHNICIAN', 'Technician', 'Execute assigned work', 1, @SYS),
(5, NULL, 'DISPATCHER', 'Dispatcher', 'Assign and dispatch requests', 1, @SYS);

INSERT INTO RolePermission (RoleID, PermissionID, CreatedBy) VALUES
(1, 1, @SYS), (1, 2, @SYS), (1, 3, @SYS), (1, 4, @SYS),
(1, 5, @SYS), (1, 6, @SYS), (1, 7, @SYS), (1, 8, @SYS),
(2, 1, @SYS), (2, 2, @SYS), (2, 3, @SYS), (2, 5, @SYS), (2, 6, @SYS), (2, 7, @SYS),
(6, 1, @SYS), (6, 2, @SYS), (6, 5, @SYS), (6, 7, @SYS),
(3, 1, @SYS), (3, 2, @SYS), (3, 7, @SYS),
(4, 2, @SYS), (4, 3, @SYS),
(5, 2, @SYS), (5, 3, @SYS);

INSERT INTO UserRole (UserID, RoleID, CreatedBy) VALUES
(1, 1, @SYS),
(3, 2, @SYS),
(7, 6, @SYS),
(4, 3, @SYS),
(5, 4, @SYS),
(6, 5, @SYS);

-- ============================================================================
-- MODULE 3: ORGANIZATIONAL STRUCTURE
-- ============================================================================

INSERT INTO OrganizationUnit (OrganizationUnitID, TenantID, UnitCode, UnitName, Description, CreatedBy) VALUES
(1, NULL, 'PARK-OPS', 'Business Park Operations', 'Park operations organization', @SYS),
(2, 1, 'ACME-ROOT', 'Acme Technologies', 'Root organization for Acme', @SYS),
(3, 2, 'BETA-ROOT', 'Beta Logistics', 'Root organization for Beta', @SYS);

INSERT INTO Department (DepartmentID, OrganizationUnitID, DepartmentCode, DepartmentName, ManagerUserID, CreatedBy) VALUES
(1, 1, 'FACILITIES', 'Facilities Management', 2, @SYS),
(2, 1, 'IT-SUPPORT', 'IT Support', NULL, @SYS),
(3, 2, 'OPS', 'Operations', 3, @SYS),
(4, 3, 'ADMIN', 'Administration', 7, @SYS);

INSERT INTO Team (TeamID, DepartmentID, TeamCode, TeamName, LeaderUserID, CreatedBy) VALUES
(1, 1, 'MAINT-TEAM', 'Maintenance Team', 5, @SYS);

INSERT INTO `Position` (PositionID, OrganizationUnitID, PositionCode, PositionTitle, CreatedBy) VALUES
(1, 2, 'OPS-OFFICER', 'Operations Officer', @SYS),
(2, 1, 'TECH', 'Maintenance Technician', @SYS);

INSERT INTO EmployeeAssignment (
    EmployeeAssignmentID, UserID, DepartmentID, TeamID, PositionID, IsPrimary, JoinedDate, CreatedBy
) VALUES
(1, 2, 1, NULL, NULL, 1, '2024-01-01', @SYS),
(2, 3, 3, NULL, 1, 1, '2025-01-15', @SYS),
(3, 4, 3, NULL, 1, 1, '2025-02-01', @SYS),
(4, 5, 1, 1, 2, 1, '2024-06-01', @SYS),
(5, 7, 4, NULL, NULL, 1, '2025-03-01', @SYS);

-- ============================================================================
-- MODULE 18: CALENDAR MANAGEMENT
-- ============================================================================

INSERT INTO BusinessCalendar (BusinessCalendarID, CalendarName, TimeZoneID, CreatedBy) VALUES
(1, 'Standard Business Calendar', 1, @SYS);

INSERT INTO WorkingHour (BusinessCalendarID, DayOfWeek, StartShift, EndShift, CreatedBy) VALUES
(1, 1, '08:30:00', '17:30:00', @SYS),
(1, 2, '08:30:00', '17:30:00', @SYS),
(1, 3, '08:30:00', '17:30:00', @SYS),
(1, 4, '08:30:00', '17:30:00', @SYS),
(1, 5, '08:30:00', '17:30:00', @SYS);

INSERT INTO HolidayCalendar (BusinessCalendarID, HolidayDate, HolidayName, CreatedBy) VALUES
(1, '2026-01-07', 'Ethiopian Christmas', @SYS),
(1, '2026-03-02', 'Adwa Victory Day', @SYS);

-- ============================================================================
-- MODULE 6: SERVICE CATALOG
-- ============================================================================

INSERT INTO ServiceCategory (ServiceCategoryID, TenantID, CategoryCode, CategoryName, Description, CreatedBy) VALUES
(1, NULL, 'FACILITIES', 'Facilities Services', 'Business Park facilities services', @SYS),
(2, NULL, 'IT-SERVICES', 'IT Services', 'Information technology support', @SYS);

INSERT INTO Service (
    ServiceID, ServiceCategoryID, ServiceTypeID, ServiceLevelID,
    ServiceCode, ServiceName, Description, EstimatedCost, CurrencyCode, CreatedBy
) VALUES
(1, 1, 1, 1, 'HVAC-REPAIR', 'HVAC Repair', 'Air conditioning and ventilation repair', 1500.00, 'ETB', @SYS),
(2, 2, 2, 2, 'NET-ISSUE', 'Network Issue', 'Network connectivity troubleshooting', 800.00, 'ETB', @SYS),
(3, 1, 3, 1, 'GEN-MAINT', 'General Maintenance', 'General facility maintenance request', 500.00, 'ETB', @SYS);

INSERT INTO ServiceWorkflow (ServiceID, WorkflowStepsJson, VersionNumber, CreatedBy) VALUES
(1, JSON_ARRAY('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'), 1, @SYS),
(2, JSON_ARRAY('NEW', 'PENDING_APPROVAL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'), 1, @SYS),
(3, JSON_ARRAY('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'), 1, @SYS);

INSERT INTO ServiceDepartment (ServiceID, DepartmentID, IsPrimary, CreatedBy) VALUES
(1, 1, 1, @SYS),
(2, 2, 1, @SYS),
(3, 1, 1, @SYS);

INSERT INTO ServiceApprovalRule (
    ServiceID, ApprovalRuleName, RequiredStagesCount, AutoApproveLimit, CreatedBy
) VALUES
(2, 'IT Service Approval', 1, NULL, @SYS);

-- ============================================================================
-- MODULE 9: APPROVAL MANAGEMENT
-- ============================================================================

INSERT INTO ApprovalRule (
    ApprovalRuleID, TenantID, RuleName, Description, MinCost, MaxCost, CurrencyCode, CreatedBy
) VALUES
(1, NULL, 'IT Service Approval Rule', 'Approval required for IT network services', 0.00, NULL, 'ETB', @SYS);

INSERT INTO ApprovalGroup (ApprovalGroupID, TenantID, GroupName, Description, CreatedBy) VALUES
(1, 1, 'Acme IT Approvers', 'Managers who approve IT service requests', @SYS);

INSERT INTO ApprovalMember (ApprovalGroupID, UserID, CreatedBy) VALUES
(1, 3, @SYS);

-- ============================================================================
-- MODULE 11: SLA & ESCALATION
-- ============================================================================

INSERT INTO SLAPolicy (SLAPolicyID, PolicyName, Description, BusinessCalendarID, CreatedBy) VALUES
(1, 'Standard SLA Policy', 'Default response and resolution targets', 1, @SYS);

INSERT INTO SLAStage (SLAStageID, SLAPolicyID, PriorityCode, TargetResponseMinutes, TargetResolutionMinutes, CreatedBy) VALUES
(1, 1, 'LOW', 480, 2880, @SYS),
(2, 1, 'MEDIUM', 240, 1440, @SYS),
(3, 1, 'HIGH', 120, 720, @SYS),
(4, 1, 'CRITICAL', 30, 240, @SYS);

INSERT INTO PauseReason (PauseReasonID, ReasonCode, ReasonName, StopTimer, CreatedBy) VALUES
(1, 'AWAITING_PARTS', 'Awaiting Parts', 1, @SYS),
(2, 'CUSTOMER_UNAVAILABLE', 'Customer Unavailable', 1, @SYS);

INSERT INTO ServiceSLA (ServiceID, SLAPolicyID, CreatedBy) VALUES
(1, 1, @SYS),
(2, 1, @SYS),
(3, 1, @SYS);

INSERT INTO EscalationRule (
    EscalationRuleID, SLAStageID, RuleName, TriggerOffsetMinutes,
    TriggerTypeCode, TargetEscalationLevel, ActionTypeCode, ReassignedTeamID, CreatedBy
) VALUES
(1, 3, 'High Priority Response Breach', 0, 'RESPONSE_BREACH', 1, 'NOTIFY_MANAGER', 1, @SYS);

INSERT INTO EscalationRecipient (EscalationRuleID, UserID, NotificationChannelCode, CreatedBy) VALUES
(1, 2, 'EMAIL', @SYS);

-- ============================================================================
-- MODULE 10: ASSIGNMENT & DISPATCH
-- ============================================================================

INSERT INTO DispatchQueue (DispatchQueueID, QueueCode, QueueName, Description, CreatedBy) VALUES
(1, 'FACILITY-QUEUE', 'Facilities Dispatch Queue', 'Primary facilities dispatch queue', @SYS);

INSERT INTO Dispatcher (DispatcherID, UserID, DispatchQueueID, CreatedBy) VALUES
(1, 6, 1, @SYS);

INSERT INTO TechnicianAvailability (UserID, AvailabilityStatusCode, CreatedBy) VALUES
(5, 'AVAILABLE', @SYS);

INSERT INTO TechnicianSkill (UserID, SkillCode, ExperienceYears, CreatedBy) VALUES
(5, 'HVAC', 4, @SYS),
(5, 'ELECTRICAL', 2, @SYS);

-- ============================================================================
-- MODULE 7: ISSUE REQUEST MANAGEMENT (sample records)
-- ============================================================================

INSERT INTO IssueRequest (
    IssueRequestID, TenantID, ServiceID, RequestNumber, Title, Description,
    RequestTypeCode, PriorityCode, StatusCode, RequestChannelCode, CategoryCode,
    RequestSourceCode, RequesterUserID, BuildingID, OfficeSpaceID,
    AssignedDepartmentID, IsMajorIncident, CreatedBy
) VALUES
(
    1, 1, 1, 'IR-000001',
    'AC not cooling in Office A-101',
    'Air conditioner in Office A-101 is running but not cooling the room.',
    'MAINTENANCE', 'HIGH', 'ASSIGNED', 'WEB', 'FACILITIES',
    'EMPLOYEE', 4, 1, 1, 1, 0, @SYS
),
(
    2, 1, 2, 'IR-000002',
    'Internet connection unstable',
    'Frequent disconnections on the 5th floor Wi-Fi network.',
    'INCIDENT', 'MEDIUM', 'PENDING_APPROVAL', 'WEB', 'IT-SERVICES',
    'EMPLOYEE', 4, 1, 1, 2, 0, @SYS
),
(
    3, 1, 3, 'IR-000003',
    'Broken light fixture in corridor',
    'Light fixture outside Office A-102 is flickering and needs replacement.',
    'MAINTENANCE', 'LOW', 'IN_PROGRESS', 'MOBILE', 'FACILITIES',
    'TENANT', 3, 1, 2, 1, 0, @SYS
);

INSERT INTO IssueRequestHistory (
    IssueRequestID, UserID, FieldName, OldValue, NewValue, ActionTypeCode, Remarks, CreatedBy
) VALUES
(1, 4, NULL, NULL, NULL, 'CREATED', 'Issue submitted by employee', @SYS),
(1, 6, 'StatusCode', 'NEW', 'ASSIGNED', 'STATUS_CHANGED', 'Assigned to maintenance team', @SYS),
(2, 4, NULL, NULL, NULL, 'CREATED', 'IT issue submitted by employee', @SYS),
(2, 4, 'StatusCode', 'NEW', 'PENDING_APPROVAL', 'STATUS_CHANGED', 'Sent for manager approval', @SYS),
(3, 5, 'StatusCode', 'ASSIGNED', 'IN_PROGRESS', 'STATUS_CHANGED', 'Technician started work', @SYS);

INSERT INTO Approval (
    ApprovalID, RequestID, ApprovalRuleID, Title, Description,
    TotalStages, CurrentStageNumber, ApprovalStatusCode, CreatedBy
) VALUES
(
    1, 2, 1, 'Approval for IR-000002',
    'Manager approval required before IT dispatch',
    1, 1, 'PENDING', @SYS
);

INSERT INTO ApprovalStage (
    ApprovalStageID, ApprovalID, StageNumber, ApproverGroupID,
    StageStatusCode, SequenceNumber, CreatedBy
) VALUES
(1, 1, 1, 1, 'PENDING', 1, @SYS);

INSERT INTO IssueRequestComment (IssueRequestID, UserID, CommentText, IsInternal, CreatedBy) VALUES
(1, 4, 'Issue started after yesterday maintenance.', 0, @SYS),
(1, 5, 'Checked coolant levels, scheduling full service.', 1, @SYS);

INSERT INTO Assignment (
    AssignmentID, RequestID, AssignedUserID, AssignedTeamID,
    AssignmentStatusCode, CreatedBy
) VALUES
(1, 1, 5, 1, 'ASSIGNED', @SYS),
(2, 3, 5, 1, 'IN_PROGRESS', @SYS);

INSERT INTO AssignmentHistory (AssignmentID, ActionUserID, ActionTypeCode, Remarks, CreatedBy) VALUES
(1, 6, 'ASSIGNED', 'Auto-assigned by dispatcher', @SYS),
(2, 5, 'STARTED', 'Technician started task', @SYS);

INSERT INTO SLAClock (
    IssueRequestID, SLAStageID, ResponseDeadline, ResolutionDeadline,
    ResponseAchievedDateTime, ClockStatus, CreatedBy
) VALUES
(
    1, 3,
    DATE_ADD(NOW(6), INTERVAL 2 HOUR),
    DATE_ADD(NOW(6), INTERVAL 12 HOUR),
    NOW(6),
    'RUNNING', @SYS
);

-- ============================================================================
-- MODULE 13: DOCUMENT MANAGEMENT (metadata)
-- MODULE 14: KNOWLEDGE BASE (starter category)
-- MODULE 16: NOTIFICATION MANAGEMENT
-- MODULE 17: AUDIT & COMPLIANCE (reference data)
-- MODULE 23: ENTERPRISE SEARCH
-- ============================================================================

INSERT INTO DocumentCategory (DocumentCategoryID, CategoryCode, CategoryName, CreatedBy) VALUES
(1, 'LEASE', 'Lease Documents', @SYS),
(2, 'ISSUE', 'Issue Attachments', @SYS),
(3, 'POLICY', 'Policy Documents', @SYS);

INSERT INTO DocumentType (DocumentTypeID, DocumentTypeCode, DocumentTypeName, CreatedBy) VALUES
(1, 'PDF', 'PDF Document', @SYS),
(2, 'IMAGE', 'Image File', @SYS),
(3, 'DOCX', 'Word Document', @SYS);

INSERT INTO KnowledgeCategory (KnowledgeCategoryID, TenantID, CategoryCode, CategoryName, CreatedBy) VALUES
(1, NULL, 'FACILITIES-KB', 'Facilities Knowledge', @SYS);

INSERT INTO KnowledgeArticle (
    KnowledgeCategoryID, Title, ContentHTML, ArticleStatusCode,
    AuthorUserID, SearchKeywords, CreatedBy
) VALUES
(
    1, 'HVAC Troubleshooting Basics',
    '<p>Check thermostat settings, air filters, and circuit breakers before raising a maintenance request.</p>',
    'PUBLISHED', 2, 'hvac,cooling,maintenance', @SYS
);

INSERT INTO FAQ (FAQID, TenantID, Question, AnswerHTML, DisplayOrder, CreatedBy) VALUES
(
    1, NULL,
    'How do I submit an issue request?',
    '<p>Log in, open Service Catalog, choose a service, fill the form, and submit.</p>',
    1, @SYS
);

INSERT INTO NotificationChannel (NotificationChannelID, ChannelCode, ChannelName, CreatedBy) VALUES
(1, 'IN_APP', 'In-App Notification', @SYS),
(2, 'EMAIL', 'Email Notification', @SYS),
(3, 'SMS', 'SMS Notification', @SYS);

INSERT INTO NotificationType (NotificationTypeID, TypeCode, TypeName, CreatedBy) VALUES
(1, 'ISSUE_CREATED', 'Issue Created', @SYS),
(2, 'ISSUE_ASSIGNED', 'Issue Assigned', @SYS),
(3, 'SLA_BREACH', 'SLA Breach', @SYS),
(4, 'APPROVAL_REQUIRED', 'Approval Required', @SYS);

INSERT INTO NotificationTemplate (
    NotificationTemplateID, NotificationTypeID, NotificationChannelID,
    TemplateCode, TemplateSubject, TemplateBody, CreatedBy
) VALUES
(
    1, 1, 2, 'ISSUE_CREATED_EMAIL',
    'New Issue Request {{requestNumber}}',
    'A new issue request has been submitted: {{title}}.', @SYS
),
(
    2, 2, 1, 'ISSUE_ASSIGNED_INAPP',
    NULL,
    'Issue {{requestNumber}} has been assigned to you.', @SYS
);

INSERT INTO AuditAction (AuditActionID, ActionCode, ActionName, CreatedBy) VALUES
(1, 'CREATE', 'Create Record', @SYS),
(2, 'UPDATE', 'Update Record', @SYS),
(3, 'DELETE', 'Delete Record', @SYS),
(4, 'LOGIN', 'User Login', @SYS),
(5, 'ASSIGN', 'Assign Request', @SYS);

INSERT INTO AuditEntity (AuditEntityID, EntityName, TableName, CreatedBy) VALUES
(1, 'IssueRequest', 'IssueRequest', @SYS),
(2, 'Tenant', 'Tenant', @SYS),
(3, 'User', 'User', @SYS),
(4, 'Service', 'Service', @SYS);

INSERT INTO SearchIndex (SearchIndexID, IndexCode, IndexName, TargetTableName, CreatedBy) VALUES
(1, 'ISSUE_INDEX', 'Issue Request Index', 'IssueRequest', @SYS),
(2, 'TENANT_INDEX', 'Tenant Index', 'Tenant', @SYS),
(3, 'USER_INDEX', 'User Index', 'User', @SYS),
(4, 'SERVICE_INDEX', 'Service Index', 'Service', @SYS);

INSERT INTO SearchCategory (SearchCategoryID, CategoryCode, CategoryName, DisplayOrder, CreatedBy) VALUES
(1, 'ISSUES', 'Issue Requests', 1, @SYS),
(2, 'TENANTS', 'Companies', 2, @SYS),
(3, 'USERS', 'Employees', 3, @SYS),
(4, 'SERVICES', 'Services', 4, @SYS),
(5, 'ASSETS', 'Assets', 5, @SYS),
(6, 'DOCUMENTS', 'Documents', 6, @SYS);

-- ============================================================================
-- Reset AUTO_INCREMENT to continue after seeded IDs
-- ============================================================================

ALTER TABLE Industry AUTO_INCREMENT = 10;
ALTER TABLE Tenant AUTO_INCREMENT = 10;
ALTER TABLE `User` AUTO_INCREMENT = 10;
ALTER TABLE `Role` AUTO_INCREMENT = 10;
ALTER TABLE Approval AUTO_INCREMENT = 10;
ALTER TABLE IssueRequest AUTO_INCREMENT = 10;
ALTER TABLE Service AUTO_INCREMENT = 10;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS;

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================

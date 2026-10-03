-- ============================================================================
-- ENTERPRISE ISSUE TRACKING & SERVICE REQUEST MANAGEMENT SYSTEM
-- FINAL PRODUCTION-READY MASTER SCHEMA
-- ============================================================================
-- Database Engine  : MySQL 8.0+
-- Storage Engine   : InnoDB (all tables)
-- Character Set    : utf8mb4
-- Collation        : utf8mb4_unicode_ci
-- Audit Pattern    : RowVersion, IsActive, IsDeleted, Created/Modified/Deleted
-- Modules          : 1-19, 23 (Task Management Module EXCLUDED)
-- Total Tables     : 245
-- ============================================================================
-- USAGE INSTRUCTIONS:
-- 1. CREATE DATABASE issue_tracking_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 2. USE issue_tracking_system;
-- 3. Run this script (source /path/to/mysql_final_schema.sql)
-- ============================================================================
-- CONVENTIONS:
-- * Reserved-word table names are backtick-quoted: `User`, `Role`, `Action`,
--   `Resource`, `Position`, `Comment`
-- * Every table has audit columns: CreatedBy, CreatedDate, ModifiedBy,
--   ModifiedDate, DeletedBy, DeletedDate, IsActive, IsDeleted, RowVersion
-- * RowVersion TIMESTAMP(6) is the ONLY auto-updating column per table
-- * ModifiedDate DATETIME(6) is updated by application code, NOT auto-updated
-- * All foreign keys have explicit named constraints (fk_xxx_yyy)
-- * All unique constraints have explicit names (uq_xxx)
-- * All check constraints have explicit names (chk_xxx)
-- * Indexes for FK columns and common query predicates are at the end
-- ============================================================================

CREATE DATABASE IF NOT EXISTS issue_tracking_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE issue_tracking_system;

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- ============================================================================
-- MODULE 18: CONFIGURATION & LOOKUP MANAGEMENT (Pre-requisites)
-- ============================================================================
CREATE TABLE IF NOT EXISTS Industry (
    IndustryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IndustryCode VARCHAR(30) NOT NULL UNIQUE,
    IndustryName VARCHAR(200) NOT NULL,
    Description VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TenantType
CREATE TABLE IF NOT EXISTS TenantType (
    TenantTypeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantTypeCode VARCHAR(30) NOT NULL UNIQUE,
    TenantTypeName VARCHAR(100) NOT NULL,
    Description VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: OfficeType
CREATE TABLE IF NOT EXISTS OfficeType (
    OfficeTypeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    OfficeTypeCode VARCHAR(30) NOT NULL UNIQUE,
    OfficeTypeName VARCHAR(100) NOT NULL,
    Description VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceType
CREATE TABLE IF NOT EXISTS ServiceType (
    ServiceTypeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceTypeCode VARCHAR(30) NOT NULL UNIQUE,
    ServiceTypeName VARCHAR(100) NOT NULL,
    Description VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceLevel
CREATE TABLE IF NOT EXISTS ServiceLevel (
    ServiceLevelID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceLevelCode VARCHAR(30) NOT NULL UNIQUE,
    ServiceLevelName VARCHAR(100) NOT NULL,
    Description VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TimeZone
CREATE TABLE IF NOT EXISTS TimeZone (
    TimeZoneID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TimeZoneCode VARCHAR(50) NOT NULL UNIQUE,
    DisplayName VARCHAR(150) NOT NULL,
    UtcOffsetMinutes INT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Currency
CREATE TABLE IF NOT EXISTS Currency (
    CurrencyID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CurrencyCode VARCHAR(10) NOT NULL UNIQUE,
    CurrencyName VARCHAR(100) NOT NULL,
    Symbol VARCHAR(15) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: StatusDefinition
CREATE TABLE IF NOT EXISTS StatusDefinition (
    StatusDefinitionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    StatusCode VARCHAR(30) NOT NULL UNIQUE,
    StatusName VARCHAR(100) NOT NULL,
    EntityName VARCHAR(100) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: PriorityDefinition
CREATE TABLE IF NOT EXISTS PriorityDefinition (
    PriorityDefinitionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    PriorityCode VARCHAR(30) NOT NULL UNIQUE,
    PriorityName VARCHAR(100) NOT NULL,
    Weight INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: LookupType
CREATE TABLE IF NOT EXISTS LookupType (
    LookupTypeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    LookupTypeCode VARCHAR(50) NOT NULL UNIQUE,
    LookupTypeName VARCHAR(150) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: LookupValue
CREATE TABLE IF NOT EXISTS LookupValue (
    LookupValueID BIGINT AUTO_INCREMENT PRIMARY KEY,
    LookupTypeID BIGINT NOT NULL,
    LookupValueCode VARCHAR(50) NOT NULL,
    LookupValueName VARCHAR(255) NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_lookup_value UNIQUE(LookupTypeID, LookupValueCode),
    CONSTRAINT fk_lvalue_type FOREIGN KEY (LookupTypeID) REFERENCES LookupType(LookupTypeID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: FeatureFlag
CREATE TABLE IF NOT EXISTS FeatureFlag (
    FeatureFlagID BIGINT AUTO_INCREMENT PRIMARY KEY,
    FlagCode VARCHAR(100) NOT NULL UNIQUE,
    FlagName VARCHAR(150) NOT NULL,
    IsEnabled TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ConfigurationCategory
CREATE TABLE IF NOT EXISTS ConfigurationCategory (
    ConfigurationCategoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CategoryCode VARCHAR(50) NOT NULL UNIQUE,
    CategoryName VARCHAR(150) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SystemSetting
CREATE TABLE IF NOT EXISTS SystemSetting (
    SystemSettingID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ConfigurationCategoryID BIGINT NOT NULL,
    SettingKey VARCHAR(100) NOT NULL UNIQUE,
    SettingValue VARCHAR(1000) NOT NULL,
    DataType VARCHAR(50) NOT NULL DEFAULT 'STRING',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_setting_category FOREIGN KEY (ConfigurationCategoryID) REFERENCES ConfigurationCategory(ConfigurationCategoryID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TenantSetting
CREATE TABLE IF NOT EXISTS TenantSetting (
    TenantSettingID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NOT NULL,
    SettingKey VARCHAR(100) NOT NULL,
    SettingValue VARCHAR(1000) NOT NULL,
    DataType VARCHAR(50) NOT NULL DEFAULT 'STRING',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_tenant_setting UNIQUE(TenantID, SettingKey),
    CONSTRAINT fk_tsetting_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: BusinessRule
CREATE TABLE IF NOT EXISTS BusinessRule (
    BusinessRuleID BIGINT AUTO_INCREMENT PRIMARY KEY,
    RuleCode VARCHAR(50) NOT NULL UNIQUE,
    RuleName VARCHAR(150) NOT NULL,
    RuleExpression VARCHAR(2000) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: NumberSequence
CREATE TABLE IF NOT EXISTS NumberSequence (
    NumberSequenceID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SequenceCode VARCHAR(50) NOT NULL UNIQUE,
    Prefix VARCHAR(10) NULL,
    Suffix VARCHAR(10) NULL,
    NextNumber BIGINT NOT NULL DEFAULT 1,
    IncrementValue INT NOT NULL DEFAULT 1,
    NumberWidth INT NOT NULL DEFAULT 6,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Localization
CREATE TABLE IF NOT EXISTS Localization (
    LocalizationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    LanguageCode VARCHAR(10) NOT NULL,
    CountryCode VARCHAR(10) NOT NULL,
    LocaleName VARCHAR(100) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_locale UNIQUE(LanguageCode, CountryCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: LanguageResource
CREATE TABLE IF NOT EXISTS LanguageResource (
    LanguageResourceID BIGINT AUTO_INCREMENT PRIMARY KEY,
    LocalizationID BIGINT NOT NULL,
    ResourceKey VARCHAR(250) NOT NULL,
    ResourceValue TEXT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_lang_resource UNIQUE(LocalizationID, ResourceKey),
    CONSTRAINT fk_lresource_locale FOREIGN KEY (LocalizationID) REFERENCES Localization(LocalizationID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 1: BUSINESS PARK MANAGEMENT (Physical Topology)
-- ============================================================================
-- Table: BusinessPark
CREATE TABLE IF NOT EXISTS BusinessPark (
    BusinessParkID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BusinessParkCode VARCHAR(30) NOT NULL UNIQUE,
    BusinessParkName VARCHAR(200) NOT NULL,
    ShortName VARCHAR(100) NULL,
    Description VARCHAR(1000) NULL,
    RegistrationNumber VARCHAR(100) NULL,
    TaxIdentificationNo VARCHAR(100) NULL,
    Email VARCHAR(200) NULL,
    PhoneNumber VARCHAR(50) NULL,
    MobileNumber VARCHAR(50) NULL,
    Website VARCHAR(250) NULL,
    Country VARCHAR(100) NOT NULL,
    Region VARCHAR(100) NULL,
    City VARCHAR(100) NOT NULL,
    SubCity VARCHAR(100) NULL,
    Woreda VARCHAR(100) NULL,
    PostalCode VARCHAR(20) NULL,
    AddressLine1 VARCHAR(250) NULL,
    AddressLine2 VARCHAR(250) NULL,
    Latitude DECIMAL(18,8) NULL,
    Longitude DECIMAL(18,8) NULL,
    TimeZone VARCHAR(100) NOT NULL,
    CurrencyCode VARCHAR(10) NOT NULL,
    LanguageCode VARCHAR(10) NOT NULL,
    LogoPath VARCHAR(500) NULL,
    TotalAreaSquareMeter DECIMAL(18,2) NULL,
    IsOperational TINYINT NOT NULL DEFAULT 1,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Building
CREATE TABLE IF NOT EXISTS Building (
    BuildingID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BusinessParkID BIGINT NOT NULL,
    BuildingCode VARCHAR(30) NOT NULL,
    BuildingName VARCHAR(200) NOT NULL,
    ShortName VARCHAR(100) NULL,
    Description VARCHAR(1000) NULL,
    TotalFloors INT NOT NULL DEFAULT 1,
    TotalAreaSquareMeter DECIMAL(18,2) NULL,
    Latitude DECIMAL(18,8) NULL,
    Longitude DECIMAL(18,8) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_building_park_code UNIQUE(BusinessParkID, BuildingCode),
    CONSTRAINT fk_building_park FOREIGN KEY (BusinessParkID) REFERENCES BusinessPark(BusinessParkID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Floor
CREATE TABLE IF NOT EXISTS Floor (
    FloorID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BuildingID BIGINT NOT NULL,
    FloorNumber INT NOT NULL,
    FloorCode VARCHAR(20) NOT NULL,
    FloorName VARCHAR(100) NOT NULL,
    Description VARCHAR(500) NULL,
    TotalOfficeSpaces INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_floor_building_number UNIQUE(BuildingID, FloorNumber),
    CONSTRAINT fk_floor_building FOREIGN KEY (BuildingID) REFERENCES Building(BuildingID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: OfficeSpace
CREATE TABLE IF NOT EXISTS OfficeSpace (
    OfficeSpaceID BIGINT AUTO_INCREMENT PRIMARY KEY,
    FloorID BIGINT NOT NULL,
    OfficeTypeID BIGINT NOT NULL,
    OfficeNumber VARCHAR(30) NOT NULL,
    OfficeName VARCHAR(100) NOT NULL,
    Description VARCHAR(1000) NULL,
    SquareMeters DECIMAL(18,2) NOT NULL,
    MaxOccupancy INT NULL,
    MonthlyRentAmount DECIMAL(18,2) NULL,
    AvailabilityStatus VARCHAR(50) NOT NULL DEFAULT 'VACANT',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_office_floor_number UNIQUE(FloorID, OfficeNumber),
    CONSTRAINT uq_office_floor_name UNIQUE(FloorID, OfficeName),
    CONSTRAINT chk_office_status CHECK (AvailabilityStatus IN ('VACANT', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
    CONSTRAINT fk_office_floor FOREIGN KEY (FloorID) REFERENCES Floor(FloorID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_office_type FOREIGN KEY (OfficeTypeID) REFERENCES OfficeType(OfficeTypeID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Location
CREATE TABLE IF NOT EXISTS Location (
    LocationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ParentLocationID BIGINT NULL,
    BusinessParkID BIGINT NOT NULL,
    LocationCode VARCHAR(50) NOT NULL,
    LocationName VARCHAR(200) NOT NULL,
    LocationType VARCHAR(50) NOT NULL, -- CAMPUS, PARKING_BAY, BLOCK, TOWER, COMMON_ROOM
    Description VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_location_park_code UNIQUE(BusinessParkID, LocationCode),
    CONSTRAINT fk_location_parent FOREIGN KEY (ParentLocationID) REFERENCES Location(LocationID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_location_park FOREIGN KEY (BusinessParkID) REFERENCES BusinessPark(BusinessParkID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: FloorPlan
CREATE TABLE IF NOT EXISTS FloorPlan (
    FloorPlanID BIGINT AUTO_INCREMENT PRIMARY KEY,
    FloorID BIGINT NOT NULL UNIQUE,
    FloorPlanCode VARCHAR(50) NOT NULL,
    FloorPlanName VARCHAR(150) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    MimeType VARCHAR(100) NULL,
    FileSizeKB DECIMAL(18,2) NULL,
    ScaleFactor DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    MetadataJson JSON NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_floorplan_floor FOREIGN KEY (FloorID) REFERENCES Floor(FloorID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: FacilityZone
CREATE TABLE IF NOT EXISTS FacilityZone (
    FacilityZoneID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BusinessParkID BIGINT NOT NULL,
    FacilityZoneCode VARCHAR(30) NOT NULL,
    FacilityZoneName VARCHAR(150) NOT NULL,
    ZoneType VARCHAR(50) NOT NULL, -- GREEN_ZONE, PARKING_LOT, SECURITY_OFFICE, UTILITY_ROOM
    Description VARCHAR(1000) NULL,
    CapacityLimit INT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_facility_zone_park_code UNIQUE(BusinessParkID, FacilityZoneCode),
    CONSTRAINT fk_facility_zone_park FOREIGN KEY (BusinessParkID) REFERENCES BusinessPark(BusinessParkID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MODULE 2: TENANT MANAGEMENT (Tenant Profiles & Leases)
-- ============================================================================
-- Table: Tenant
CREATE TABLE IF NOT EXISTS Tenant (
    TenantID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BusinessParkID BIGINT NOT NULL,
    TenantTypeID BIGINT NOT NULL,
    IndustryID BIGINT NULL,
    TenantCode VARCHAR(30) NOT NULL UNIQUE,
    CompanyName VARCHAR(250) NOT NULL,
    RegistrationNumber VARCHAR(100) NULL,
    TaxIdentificationNo VARCHAR(100) NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'ONBOARDING',
    OnboardedDate DATE NULL,
    OffboardedDate DATE NULL,
    Website VARCHAR(250) NULL,
    LogoPath VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_tenant_status CHECK (Status IN ('ONBOARDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED')),
    CONSTRAINT fk_tenant_park FOREIGN KEY (BusinessParkID) REFERENCES BusinessPark(BusinessParkID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tenant_type FOREIGN KEY (TenantTypeID) REFERENCES TenantType(TenantTypeID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tenant_industry FOREIGN KEY (IndustryID) REFERENCES Industry(IndustryID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SubTenant
CREATE TABLE IF NOT EXISTS SubTenant (
    SubTenantID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ParentTenantID BIGINT NOT NULL,
    CompanyName VARCHAR(250) NOT NULL,
    RegistrationNumber VARCHAR(100) NULL,
    RelationshipType VARCHAR(100) NOT NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_subtenant_status CHECK (Status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT fk_subtenant_tenant FOREIGN KEY (ParentTenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TenantContact
CREATE TABLE IF NOT EXISTS TenantContact (
    TenantContactID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NOT NULL,
    ContactType VARCHAR(50) NOT NULL,
    Label VARCHAR(100) NOT NULL,
    ContactValue VARCHAR(255) NOT NULL,
    IsPrimary TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_contact_type CHECK (ContactType IN ('EMAIL', 'PHONE', 'MOBILE', 'FAX', 'CHAT')),
    CONSTRAINT fk_contact_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TenantAddress
CREATE TABLE IF NOT EXISTS TenantAddress (
    TenantAddressID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NOT NULL,
    AddressType VARCHAR(50) NOT NULL,
    Country VARCHAR(100) NOT NULL,
    Region VARCHAR(100) NULL,
    City VARCHAR(100) NOT NULL,
    SubCity VARCHAR(100) NULL,
    Woreda VARCHAR(100) NULL,
    PostalCode VARCHAR(20) NULL,
    AddressLine1 VARCHAR(250) NOT NULL,
    AddressLine2 VARCHAR(250) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_address_type CHECK (AddressType IN ('LEGAL', 'BILLING', 'MAILING', 'PHYSICAL')),
    CONSTRAINT fk_address_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: LeaseAgreement
CREATE TABLE IF NOT EXISTS LeaseAgreement (
    LeaseAgreementID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NOT NULL,
    AgreementNumber VARCHAR(100) NOT NULL UNIQUE,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    ExecutionDate DATE NOT NULL,
    MonthlyRentAmount DECIMAL(18,2) NOT NULL,
    SecurityDepositAmount DECIMAL(18,2) NOT NULL,
    CurrencyCode VARCHAR(10) NOT NULL,
    GracePeriodDays INT NOT NULL DEFAULT 0,
    Status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    TerminationDate DATE NULL,
    TerminationReason VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_lease_status CHECK (Status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED')),
    CONSTRAINT fk_lease_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TenantOfficeAllocation
CREATE TABLE IF NOT EXISTS TenantOfficeAllocation (
    TenantOfficeAllocationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NOT NULL,
    OfficeSpaceID BIGINT NOT NULL,
    LeaseAgreementID BIGINT NULL,
    AllocatedDate DATE NOT NULL,
    ReleasedDate DATE NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_allocation_status CHECK (Status IN ('ACTIVE', 'RELEASED')),
    CONSTRAINT fk_allocation_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_allocation_office FOREIGN KEY (OfficeSpaceID) REFERENCES OfficeSpace(OfficeSpaceID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_allocation_lease FOREIGN KEY (LeaseAgreementID) REFERENCES LeaseAgreement(LeaseAgreementID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: OfficeAllocationHistory
CREATE TABLE IF NOT EXISTS OfficeAllocationHistory (
    OfficeAllocationHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    OfficeSpaceID BIGINT NOT NULL,
    TenantID BIGINT NULL,
    LeaseAgreementID BIGINT NULL,
    ActionType VARCHAR(50) NOT NULL,
    ActionDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    Remarks VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_allochist_action CHECK (ActionType IN ('ALLOCATED', 'RELEASED', 'VACATED')),
    CONSTRAINT fk_allochist_office FOREIGN KEY (OfficeSpaceID) REFERENCES OfficeSpace(OfficeSpaceID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_allochist_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_allochist_lease FOREIGN KEY (LeaseAgreementID) REFERENCES LeaseAgreement(LeaseAgreementID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 3: ORGANIZATIONAL STRUCTURE MANAGEMENT
-- ============================================================================
-- Table: OrganizationUnit
CREATE TABLE IF NOT EXISTS OrganizationUnit (
    OrganizationUnitID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    ParentUnitID BIGINT NULL,
    UnitCode VARCHAR(30) NOT NULL,
    UnitName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_orgunit_tenant_code UNIQUE(TenantID, UnitCode),
    CONSTRAINT fk_orgunit_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_orgunit_parent FOREIGN KEY (ParentUnitID) REFERENCES OrganizationUnit(OrganizationUnitID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: BusinessUnit
CREATE TABLE IF NOT EXISTS BusinessUnit (
    BusinessUnitID BIGINT AUTO_INCREMENT PRIMARY KEY,
    OrganizationUnitID BIGINT NOT NULL,
    BusinessUnitCode VARCHAR(30) NOT NULL,
    BusinessUnitName VARCHAR(150) NOT NULL,
    ManagerUserID BIGINT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_business_unit UNIQUE(OrganizationUnitID, BusinessUnitCode),
    CONSTRAINT fk_busunit_orgunit FOREIGN KEY (OrganizationUnitID) REFERENCES OrganizationUnit(OrganizationUnitID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_busunit_manager FOREIGN KEY (ManagerUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Department
CREATE TABLE IF NOT EXISTS Department (
    DepartmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    OrganizationUnitID BIGINT NULL DEFAULT 1,
    DepartmentCode VARCHAR(30) NOT NULL,
    DepartmentName VARCHAR(150) NOT NULL,
    ManagerUserID BIGINT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_dept UNIQUE(OrganizationUnitID, DepartmentCode),
    CONSTRAINT fk_dept_orgunit FOREIGN KEY (OrganizationUnitID) REFERENCES OrganizationUnit(OrganizationUnitID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_dept_manager FOREIGN KEY (ManagerUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Team
CREATE TABLE IF NOT EXISTS Team (
    TeamID BIGINT AUTO_INCREMENT PRIMARY KEY,
    DepartmentID BIGINT NOT NULL,
    TeamCode VARCHAR(30) NOT NULL,
    TeamName VARCHAR(150) NOT NULL,
    LeaderUserID BIGINT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_team UNIQUE(DepartmentID, TeamCode),
    CONSTRAINT fk_team_dept FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_team_leader FOREIGN KEY (LeaderUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Position
CREATE TABLE IF NOT EXISTS `Position` (
    PositionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    OrganizationUnitID BIGINT NOT NULL,
    PositionCode VARCHAR(30) NOT NULL,
    PositionTitle VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_position UNIQUE(OrganizationUnitID, PositionCode),
    CONSTRAINT fk_pos_orgunit FOREIGN KEY (OrganizationUnitID) REFERENCES OrganizationUnit(OrganizationUnitID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: EmployeeAssignment
CREATE TABLE IF NOT EXISTS EmployeeAssignment (
    EmployeeAssignmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    DepartmentID BIGINT NOT NULL,
    TeamID BIGINT NULL,
    PositionID BIGINT NULL,
    IsPrimary TINYINT NOT NULL DEFAULT 1,
    JoinedDate DATE NOT NULL,
    LeftDate DATE NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_empassign_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_empassign_dept FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_empassign_team FOREIGN KEY (TeamID) REFERENCES Team(TeamID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_empassign_pos FOREIGN KEY (PositionID) REFERENCES `Position`(PositionID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ReportingHierarchy
CREATE TABLE IF NOT EXISTS ReportingHierarchy (
    ReportingHierarchyID BIGINT AUTO_INCREMENT PRIMARY KEY,
    EmployeeUserID BIGINT NOT NULL,
    SupervisorUserID BIGINT NOT NULL,
    ReportingTypeCode VARCHAR(30) NOT NULL DEFAULT 'DIRECT',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_hierarchy UNIQUE(EmployeeUserID, SupervisorUserID),
    CONSTRAINT chk_reporting_type CHECK (ReportingTypeCode IN ('DIRECT', 'MATRIX')),
    CONSTRAINT fk_report_employee FOREIGN KEY (EmployeeUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_report_supervisor FOREIGN KEY (SupervisorUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: CostCenter
CREATE TABLE IF NOT EXISTS CostCenter (
    CostCenterID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    CostCenterCode VARCHAR(50) NOT NULL,
    CostCenterName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_cost_center UNIQUE(TenantID, CostCenterCode),
    CONSTRAINT fk_costcenter_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DepartmentBudget
CREATE TABLE IF NOT EXISTS DepartmentBudget (
    DepartmentBudgetID BIGINT AUTO_INCREMENT PRIMARY KEY,
    DepartmentID BIGINT NOT NULL,
    CostCenterID BIGINT NULL,
    FiscalYear INT NOT NULL,
    AllocatedAmount DECIMAL(18,2) NOT NULL,
    RemainingAmount DECIMAL(18,2) NOT NULL,
    CurrencyCode VARCHAR(10) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_dept_budget UNIQUE(DepartmentID, FiscalYear),
    CONSTRAINT fk_budget_dept FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_budget_costcenter FOREIGN KEY (CostCenterID) REFERENCES CostCenter(CostCenterID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DepartmentLocation
CREATE TABLE IF NOT EXISTS DepartmentLocation (
    DepartmentLocationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    DepartmentID BIGINT NOT NULL,
    OfficeSpaceID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_dept_loc UNIQUE(DepartmentID, OfficeSpaceID),
    CONSTRAINT fk_deptloc_dept FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_deptloc_office FOREIGN KEY (OfficeSpaceID) REFERENCES OfficeSpace(OfficeSpaceID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 4: IDENTITY & ACCESS MANAGEMENT (IAM)
-- ============================================================================
-- Table: AuthenticationProvider
CREATE TABLE IF NOT EXISTS AuthenticationProvider (
    AuthenticationProviderID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ProviderCode VARCHAR(30) NOT NULL UNIQUE,
    ProviderName VARCHAR(100) NOT NULL,
    ConfigJson JSON NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: User
CREATE TABLE IF NOT EXISTS `User` (
    UserID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    UserTypeCode VARCHAR(30) NOT NULL DEFAULT 'STAFF',
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(200) NOT NULL UNIQUE,
    PhoneNumber VARCHAR(50) NULL,
    MobileNumber VARCHAR(50) NULL,
    JobTitle VARCHAR(100) NULL,
    PreferredLanguage VARCHAR(10) NOT NULL DEFAULT 'en',
    AvatarUrl VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_user_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: UserAccount
CREATE TABLE IF NOT EXISTS UserAccount (
    UserAccountID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL UNIQUE,
    AuthenticationProviderID BIGINT NOT NULL,
    Username VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NULL,
    PasswordSalt VARCHAR(100) NULL,
    AccountStatusCode VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    FailedLoginAttempts INT NOT NULL DEFAULT 0,
    LockoutEndDateTime DATETIME(6) NULL,
    LastLoginDateTime DATETIME(6) NULL,
    IsMfaEnabled TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_account_status CHECK (AccountStatusCode IN ('ACTIVE', 'MUST_CHANGE_PASSWORD', 'LOCKED', 'SUSPENDED', 'PENDING_MFA', 'DEACTIVATED', 'PENDING_ACTIVATION')),
    CONSTRAINT fk_account_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_account_auth FOREIGN KEY (AuthenticationProviderID) REFERENCES AuthenticationProvider(AuthenticationProviderID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TenantRepresentative
CREATE TABLE IF NOT EXISTS TenantRepresentative (
    TenantRepresentativeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    RepresentativeRole VARCHAR(50) NOT NULL DEFAULT 'STAFF',
    IsPrimary TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_representative UNIQUE(TenantID, UserID, RepresentativeRole),
    CONSTRAINT chk_rep_role CHECK (RepresentativeRole IN ('PRIMARY', 'SECONDARY', 'ESCALATION')),
    CONSTRAINT fk_rep_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_rep_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: UserSession
CREATE TABLE IF NOT EXISTS UserSession (
    UserSessionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserAccountID BIGINT NOT NULL,
    SessionToken VARCHAR(500) NOT NULL UNIQUE,
    IPAddress VARCHAR(50) NULL,
    UserAgent VARCHAR(255) NULL,
    LoginDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ExpiryDateTime DATETIME(6) NOT NULL,
    IsRevoked TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_session_account FOREIGN KEY (UserAccountID) REFERENCES UserAccount(UserAccountID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: PasswordHistory
CREATE TABLE IF NOT EXISTS PasswordHistory (
    PasswordHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserAccountID BIGINT NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    PasswordSalt VARCHAR(100) NULL,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_passhist_account FOREIGN KEY (UserAccountID) REFERENCES UserAccount(UserAccountID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: PasswordResetToken
CREATE TABLE IF NOT EXISTS PasswordResetToken (
    PasswordResetTokenID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserAccountID BIGINT NOT NULL,
    ResetToken VARCHAR(100) NOT NULL UNIQUE,
    ExpiryDateTime DATETIME(6) NOT NULL,
    IsUsed TINYINT NOT NULL DEFAULT 0,
    UsedDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_reset_account FOREIGN KEY (UserAccountID) REFERENCES UserAccount(UserAccountID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: EmailVerification
CREATE TABLE IF NOT EXISTS EmailVerification (
    EmailVerificationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    VerificationToken VARCHAR(100) NOT NULL UNIQUE,
    ExpiryDateTime DATETIME(6) NOT NULL,
    IsVerified TINYINT NOT NULL DEFAULT 0,
    VerifiedDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_verify_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: MultiFactorAuthentication
CREATE TABLE IF NOT EXISTS MultiFactorAuthentication (
    MultiFactorAuthenticationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserAccountID BIGINT NOT NULL UNIQUE,
    MfaTypeCode VARCHAR(30) NOT NULL,
    SecretKey VARCHAR(255) NOT NULL,
    BackupRecoveryCodesJson JSON NULL,
    IsVerified TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_mfa_type CHECK (MfaTypeCode IN ('TOTP', 'SMS', 'EMAIL')),
    CONSTRAINT fk_mfa_account FOREIGN KEY (UserAccountID) REFERENCES UserAccount(UserAccountID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: UserDevice
CREATE TABLE IF NOT EXISTS UserDevice (
    UserDeviceID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    DeviceFingerprint VARCHAR(255) NOT NULL,
    DeviceName VARCHAR(100) NULL,
    DeviceType VARCHAR(50) NULL,
    IsTrusted TINYINT NOT NULL DEFAULT 1,
    LastUsedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_user_device UNIQUE(UserID, DeviceFingerprint),
    CONSTRAINT fk_device_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: APIKey
CREATE TABLE IF NOT EXISTS APIKey (
    APIKeyID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    UserID BIGINT NOT NULL,
    KeyName VARCHAR(100) NOT NULL,
    KeyPrefix VARCHAR(8) NOT NULL,
    KeyHash VARCHAR(64) NOT NULL UNIQUE,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_apikey_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_apikey_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: LoginHistory
CREATE TABLE IF NOT EXISTS LoginHistory (
    LoginHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserAccountID BIGINT NOT NULL,
    LoginDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IPAddress VARCHAR(50) NULL,
    UserAgent VARCHAR(255) NULL,
    LoginStatus VARCHAR(30) NOT NULL,
    FailureReason VARCHAR(255) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_loginhist_account FOREIGN KEY (UserAccountID) REFERENCES UserAccount(UserAccountID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: FailedLoginAttempt
CREATE TABLE IF NOT EXISTS FailedLoginAttempt (
    FailedLoginAttemptID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IPAddress VARCHAR(50) NOT NULL UNIQUE,
    AttemptCount INT NOT NULL DEFAULT 1,
    FirstAttemptDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    LastAttemptDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ExternalContractor
CREATE TABLE IF NOT EXISTS ExternalContractor (
    ExternalContractorID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL UNIQUE,
    CompanyName VARCHAR(250) NOT NULL,
    TaxRegistrationNo VARCHAR(100) NULL,
    ContractStartDate DATE NOT NULL,
    ContractEndDate DATE NULL,
    Specialization VARCHAR(150) NULL,
    IsBackgroundChecked TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_contractor_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: VisitorAccount
CREATE TABLE IF NOT EXISTS VisitorAccount (
    VisitorAccountID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL UNIQUE,
    HostUserID BIGINT NOT NULL,
    VisitPurpose VARCHAR(500) NOT NULL,
    ScheduledArrivalDateTime DATETIME(6) NOT NULL,
    ActualArrivalDateTime DATETIME(6) NULL,
    ActualDepartureDateTime DATETIME(6) NULL,
    VisitorBadgeNumber VARCHAR(50) NULL,
    Status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_visitor_status CHECK (Status IN ('SCHEDULED', 'ARRIVED', 'DEPARTED', 'CANCELLED')),
    CONSTRAINT fk_visitor_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_visitor_host FOREIGN KEY (HostUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MODULE 5: ROLE & PERMISSION MANAGEMENT (Enterprise RBAC)
-- ============================================================================
-- Table: Resource
CREATE TABLE IF NOT EXISTS `Resource` (
    ResourceID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ResourceCode VARCHAR(50) NOT NULL UNIQUE,
    ResourceName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Action
CREATE TABLE IF NOT EXISTS `Action` (
    ActionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ActionCode VARCHAR(30) NOT NULL UNIQUE,
    ActionName VARCHAR(100) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ResourcePermission
CREATE TABLE IF NOT EXISTS ResourcePermission (
    ResourcePermissionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ResourceID BIGINT NOT NULL,
    ActionID BIGINT NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_resource_action UNIQUE(ResourceID, ActionID),
    CONSTRAINT fk_respermit_resource FOREIGN KEY (ResourceID) REFERENCES `Resource`(ResourceID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_respermit_action FOREIGN KEY (ActionID) REFERENCES `Action`(ActionID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: PermissionGroup
CREATE TABLE IF NOT EXISTS PermissionGroup (
    PermissionGroupID BIGINT AUTO_INCREMENT PRIMARY KEY,
    GroupCode VARCHAR(50) NOT NULL UNIQUE,
    GroupName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Permission
CREATE TABLE IF NOT EXISTS Permission (
    PermissionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    PermissionGroupID BIGINT NULL,
    ResourcePermissionID BIGINT NOT NULL,
    PermissionCode VARCHAR(100) NOT NULL UNIQUE,
    PermissionName VARCHAR(200) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_permit_group FOREIGN KEY (PermissionGroupID) REFERENCES PermissionGroup(PermissionGroupID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_permit_respermit FOREIGN KEY (ResourcePermissionID) REFERENCES ResourcePermission(ResourcePermissionID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Role
CREATE TABLE IF NOT EXISTS `Role` (
    RoleID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    RoleCode VARCHAR(50) NOT NULL,
    RoleName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsSystemRole TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_role_tenant_code UNIQUE(TenantID, RoleCode),
    CONSTRAINT fk_role_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: RoleHierarchy
CREATE TABLE IF NOT EXISTS RoleHierarchy (
    ParentRoleID BIGINT NOT NULL,
    ChildRoleID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (ParentRoleID, ChildRoleID),
    CONSTRAINT fk_rolehier_parent FOREIGN KEY (ParentRoleID) REFERENCES `Role`(RoleID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_rolehier_child FOREIGN KEY (ChildRoleID) REFERENCES `Role`(RoleID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: RolePermission
CREATE TABLE IF NOT EXISTS RolePermission (
    RoleID BIGINT NOT NULL,
    PermissionID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (RoleID, PermissionID),
    CONSTRAINT fk_rolepermit_role FOREIGN KEY (RoleID) REFERENCES `Role`(RoleID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_rolepermit_permission FOREIGN KEY (PermissionID) REFERENCES Permission(PermissionID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: UserRole
CREATE TABLE IF NOT EXISTS UserRole (
    UserID BIGINT NOT NULL,
    RoleID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (UserID, RoleID),
    CONSTRAINT fk_userrole_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_userrole_role FOREIGN KEY (RoleID) REFERENCES `Role`(RoleID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DelegatedAccess
CREATE TABLE IF NOT EXISTS DelegatedAccess (
    DelegatedAccessID BIGINT AUTO_INCREMENT PRIMARY KEY,
    DelegatorUserID BIGINT NOT NULL,
    DelegateeUserID BIGINT NOT NULL,
    RoleID BIGINT NOT NULL,
    StartDateTime DATETIME(6) NOT NULL,
    EndDateTime DATETIME(6) NOT NULL,
    Reason VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_delegate_delegator FOREIGN KEY (DelegatorUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_delegate_delegatee FOREIGN KEY (DelegateeUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_delegate_role FOREIGN KEY (RoleID) REFERENCES `Role`(RoleID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ImpersonationLog
CREATE TABLE IF NOT EXISTS ImpersonationLog (
    ImpersonationLogID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AdminUserID BIGINT NOT NULL,
    TargetUserID BIGINT NOT NULL,
    StartDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    EndDateTime DATETIME(6) NULL,
    Reason VARCHAR(1000) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_impersonate_admin FOREIGN KEY (AdminUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_impersonate_target FOREIGN KEY (TargetUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 18: CALENDAR MANAGEMENT (Business Calendars & Holidays)
-- ============================================================================
-- Table: BusinessCalendar
CREATE TABLE IF NOT EXISTS BusinessCalendar (
    BusinessCalendarID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CalendarName VARCHAR(100) NOT NULL UNIQUE,
    TimeZoneID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_calendar_timezone FOREIGN KEY (TimeZoneID) REFERENCES TimeZone(TimeZoneID) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: WorkingHour
CREATE TABLE IF NOT EXISTS WorkingHour (
    WorkingHourID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BusinessCalendarID BIGINT NOT NULL,
    DayOfWeek INT NOT NULL CHECK (DayOfWeek BETWEEN 1 AND 7),
    StartShift TIME NOT NULL,
    EndShift TIME NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_working_day UNIQUE(BusinessCalendarID, DayOfWeek),
    CONSTRAINT fk_workhour_calendar FOREIGN KEY (BusinessCalendarID) REFERENCES BusinessCalendar(BusinessCalendarID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: HolidayCalendar
CREATE TABLE IF NOT EXISTS HolidayCalendar (
    HolidayCalendarID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BusinessCalendarID BIGINT NOT NULL,
    HolidayDate DATE NOT NULL,
    HolidayName VARCHAR(150) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_holiday_day UNIQUE(BusinessCalendarID, HolidayDate),
    CONSTRAINT fk_holiday_calendar FOREIGN KEY (BusinessCalendarID) REFERENCES BusinessCalendar(BusinessCalendarID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 6: SERVICE CATALOG MANAGEMENT
-- ============================================================================
-- Table: ServiceCategory
CREATE TABLE IF NOT EXISTS ServiceCategory (
    ServiceCategoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    CategoryCode VARCHAR(50) NOT NULL,
    CategoryName VARCHAR(150) NOT NULL,
    Description VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_service_cat UNIQUE(TenantID, CategoryCode),
    CONSTRAINT fk_svccat_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Service
CREATE TABLE IF NOT EXISTS Service (
    ServiceID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceCategoryID BIGINT NOT NULL,
    ServiceTypeID BIGINT NOT NULL,
    ServiceLevelID BIGINT NOT NULL,
    ServiceCode VARCHAR(50) NOT NULL,
    ServiceName VARCHAR(150) NOT NULL,
    Description VARCHAR(1000) NULL,
    EstimatedCost DECIMAL(18,2) NULL,
    CurrencyCode VARCHAR(10) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_service UNIQUE(ServiceCategoryID, ServiceCode),
    CONSTRAINT fk_svc_category FOREIGN KEY (ServiceCategoryID) REFERENCES ServiceCategory(ServiceCategoryID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_svc_type FOREIGN KEY (ServiceTypeID) REFERENCES ServiceType(ServiceTypeID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_svc_level FOREIGN KEY (ServiceLevelID) REFERENCES ServiceLevel(ServiceLevelID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServicePricing
CREATE TABLE IF NOT EXISTS ServicePricing (
    ServicePricingID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL UNIQUE,
    PricingModel VARCHAR(50) NOT NULL, -- FREE, FLAT_RATE, LABOR_HOURS, UNIT_PRICE
    UnitPrice DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    CurrencyCode VARCHAR(10) NOT NULL,
    BillingType VARCHAR(50) NOT NULL, -- BILLABLE, NON_BILLABLE, INTERNAL_CHARGE
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_pricing_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceAvailability
CREATE TABLE IF NOT EXISTS ServiceAvailability (
    ServiceAvailabilityID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL UNIQUE,
    BusinessCalendarID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_avail_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_avail_calendar FOREIGN KEY (BusinessCalendarID) REFERENCES BusinessCalendar(BusinessCalendarID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceVisibility
CREATE TABLE IF NOT EXISTS ServiceVisibility (
    ServiceVisibilityID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL,
    TenantTypeID BIGINT NULL,
    TenantID BIGINT NULL,
    RoleID BIGINT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_vis_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_vis_tenanttype FOREIGN KEY (TenantTypeID) REFERENCES TenantType(TenantTypeID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_vis_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_vis_role FOREIGN KEY (RoleID) REFERENCES `Role`(RoleID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceRequirement
CREATE TABLE IF NOT EXISTS ServiceRequirement (
    ServiceRequirementID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL,
    FieldName VARCHAR(100) NOT NULL,
    FieldLabel VARCHAR(100) NOT NULL,
    FieldType VARCHAR(30) NOT NULL,
    IsRequired TINYINT NOT NULL DEFAULT 0,
    ValidationRegex VARCHAR(255) NULL,
    DataSourceJson JSON NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_svc_requirement UNIQUE(ServiceID, FieldName),
    CONSTRAINT chk_field_type CHECK (FieldType IN ('TEXT', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX')),
    CONSTRAINT fk_req_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceAttachmentRequirement
CREATE TABLE IF NOT EXISTS ServiceAttachmentRequirement (
    ServiceAttachmentRequirementID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL,
    AttachmentName VARCHAR(100) NOT NULL,
    Description VARCHAR(500) NULL,
    IsRequired TINYINT NOT NULL DEFAULT 0,
    AllowedExtensions VARCHAR(100) NULL,
    MaxFileSizeMB INT NOT NULL DEFAULT 10,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_svc_attachment UNIQUE(ServiceID, AttachmentName),
    CONSTRAINT fk_attachreq_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceApprovalRule
CREATE TABLE IF NOT EXISTS ServiceApprovalRule (
    ServiceApprovalRuleID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL,
    ApprovalRuleName VARCHAR(150) NOT NULL,
    RequiredStagesCount INT NOT NULL DEFAULT 1,
    AutoApproveLimit DECIMAL(18,2) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_apprule_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceWorkflow
CREATE TABLE IF NOT EXISTS ServiceWorkflow (
    ServiceWorkflowID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL UNIQUE,
    WorkflowStepsJson JSON NOT NULL,
    VersionNumber INT NOT NULL DEFAULT 1,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_wf_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceSLA
CREATE TABLE IF NOT EXISTS ServiceSLA (
    ServiceSLAID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL UNIQUE,
    SLAPolicyID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_sla_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_sla_policy FOREIGN KEY (SLAPolicyID) REFERENCES SLAPolicy(SLAPolicyID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceDepartment
CREATE TABLE IF NOT EXISTS ServiceDepartment (
    ServiceDepartmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL,
    DepartmentID BIGINT NOT NULL,
    IsPrimary TINYINT NOT NULL DEFAULT 1,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_svc_dept UNIQUE(ServiceID, DepartmentID),
    CONSTRAINT fk_svcdep_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_svcdep_dept FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceSkill
CREATE TABLE IF NOT EXISTS ServiceSkill (
    ServiceSkillID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL,
    SkillCode VARCHAR(50) NOT NULL,
    SkillLabel VARCHAR(150) NOT NULL,
    IsRequired TINYINT NOT NULL DEFAULT 1,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_svc_skill UNIQUE(ServiceID, SkillCode),
    CONSTRAINT fk_skill_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceTemplate
CREATE TABLE IF NOT EXISTS ServiceTemplate (
    ServiceTemplateID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NOT NULL UNIQUE,
    TemplateTitle VARCHAR(255) NOT NULL,
    TemplateDescription VARCHAR(1000) NULL,
    TemplatePriority VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_template_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 14: FILE & DOCUMENT MANAGEMENT
-- ============================================================================
-- Table: CentralDocument
CREATE TABLE IF NOT EXISTS CentralDocument (
    CentralDocumentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    MimeType VARCHAR(100) NULL,
    FileSizeKB DECIMAL(18,2) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: LeaseDocument
CREATE TABLE IF NOT EXISTS LeaseDocument (
    LeaseDocumentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    LeaseAgreementID BIGINT NOT NULL,
    CentralDocumentID BIGINT NOT NULL,
    DocumentType VARCHAR(50) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_leasedoc_lease FOREIGN KEY (LeaseAgreementID) REFERENCES LeaseAgreement(LeaseAgreementID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_leasedoc_central FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TenantDocument
CREATE TABLE IF NOT EXISTS TenantDocument (
    TenantDocumentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NOT NULL,
    CentralDocumentID BIGINT NOT NULL,
    DocumentType VARCHAR(50) NOT NULL,
    ExpiryDate DATE NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_tenantdoc_type CHECK (DocumentType IN ('BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'INSURANCE')),
    CONSTRAINT fk_tenantdoc_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tenantdoc_central FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DocumentCategory
CREATE TABLE IF NOT EXISTS DocumentCategory (
    DocumentCategoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CategoryCode VARCHAR(50) NOT NULL UNIQUE,
    CategoryName VARCHAR(150) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DocumentType
CREATE TABLE IF NOT EXISTS DocumentType (
    DocumentTypeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    DocumentTypeCode VARCHAR(50) NOT NULL UNIQUE,
    DocumentTypeName VARCHAR(150) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DocumentFolder
CREATE TABLE IF NOT EXISTS DocumentFolder (
    DocumentFolderID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ParentFolderID BIGINT NULL,
    TenantID BIGINT NULL,
    FolderName VARCHAR(150) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_folder_parent FOREIGN KEY (ParentFolderID) REFERENCES DocumentFolder(DocumentFolderID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_folder_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DocumentPermission
CREATE TABLE IF NOT EXISTS DocumentPermission (
    DocumentPermissionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    DocumentFolderID BIGINT NULL,
    CentralDocumentID BIGINT NULL,
    RoleID BIGINT NOT NULL,
    AccessLevel VARCHAR(30) NOT NULL DEFAULT 'READ',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_docperm_level CHECK (AccessLevel IN ('READ', 'WRITE', 'DELETE')),
    CONSTRAINT fk_docperm_folder FOREIGN KEY (DocumentFolderID) REFERENCES DocumentFolder(DocumentFolderID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_docperm_doc FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_docperm_role FOREIGN KEY (RoleID) REFERENCES `Role`(RoleID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DocumentTag
CREATE TABLE IF NOT EXISTS DocumentTag (
    DocumentTagID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CentralDocumentID BIGINT NOT NULL,
    TagName VARCHAR(50) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_doc_tag UNIQUE(CentralDocumentID, TagName),
    CONSTRAINT fk_doctag_doc FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DocumentShare
CREATE TABLE IF NOT EXISTS DocumentShare (
    DocumentShareID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CentralDocumentID BIGINT NOT NULL,
    SharedWithTenantID BIGINT NOT NULL,
    SharedWithUserID BIGINT NULL,
    AccessLevel VARCHAR(30) NOT NULL DEFAULT 'READ',
    ExpiryDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_share_doc FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_share_tenant FOREIGN KEY (SharedWithTenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_share_user FOREIGN KEY (SharedWithUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DocumentApproval
CREATE TABLE IF NOT EXISTS DocumentApproval (
    DocumentApprovalID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CentralDocumentID BIGINT NOT NULL,
    ApprovalID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_docapprove_doc FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_docapprove_approval FOREIGN KEY (ApprovalID) REFERENCES Approval(ApprovalID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: FileStorage
CREATE TABLE IF NOT EXISTS FileStorage (
    FileStorageID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CentralDocumentID BIGINT NOT NULL,
    FileName VARCHAR(250) NOT NULL,
    StoragePath VARCHAR(500) NOT NULL,
    MimeType VARCHAR(100) NOT NULL,
    FileSizeBytes BIGINT NOT NULL,
    Checksum VARCHAR(64) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_fstorage_doc FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DocumentVersion
CREATE TABLE IF NOT EXISTS DocumentVersion (
    DocumentVersionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CentralDocumentID BIGINT NOT NULL,
    FileStorageID BIGINT NOT NULL,
    VersionNumber INT NOT NULL,
    Comment VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_doc_version UNIQUE(CentralDocumentID, VersionNumber),
    CONSTRAINT fk_docversion_doc FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_docversion_storage FOREIGN KEY (FileStorageID) REFERENCES FileStorage(FileStorageID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Attachment
CREATE TABLE IF NOT EXISTS Attachment (
    AttachmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CentralDocumentID BIGINT NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_attachment_central FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AttachmentReference
CREATE TABLE IF NOT EXISTS AttachmentReference (
    AttachmentReferenceID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AttachmentID BIGINT NOT NULL,
    TargetTableName VARCHAR(100) NOT NULL,
    TargetID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_attref_attach FOREIGN KEY (AttachmentID) REFERENCES Attachment(AttachmentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: FileAudit
CREATE TABLE IF NOT EXISTS FileAudit (
    FileAuditID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CentralDocumentID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    ActionType VARCHAR(50) NOT NULL,
    ActionDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IPAddress VARCHAR(50) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_faudit_doc FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_faudit_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 7: ISSUE REQUEST MANAGEMENT (Consolidated Issues & Requests)
-- ============================================================================
-- Table: IssueRequest
CREATE TABLE IF NOT EXISTS IssueRequest (
    IssueRequestID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    ServiceID BIGINT NOT NULL,
    RequestNumber VARCHAR(50) NOT NULL UNIQUE,
    Title VARCHAR(255) NOT NULL,
    Description VARCHAR(2000) NOT NULL,
    RequestTypeCode VARCHAR(30) NOT NULL, -- e.g. COMPLAINT, MAINTENANCE, INCIDENT, DISRUPTION
    PriorityCode VARCHAR(30) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    StatusCode VARCHAR(30) NOT NULL DEFAULT 'NEW', -- NEW, PENDING_APPROVAL, ASSIGNED, IN_PROGRESS, PENDING, RESOLVED, CLOSED, CANCELLED
    RequestChannelCode VARCHAR(30) NOT NULL DEFAULT 'WEB', -- WEB, MOBILE, EMAIL, QR
    CategoryCode VARCHAR(50) NOT NULL,
    SubCategoryCode VARCHAR(50) NULL,
    RequestSourceCode VARCHAR(30) NOT NULL DEFAULT 'TENANT', -- TENANT, EMPLOYEE, GUEST
    RequesterUserID BIGINT NOT NULL,
    BuildingID BIGINT NULL,
    OfficeSpaceID BIGINT NULL,
    AssignedDepartmentID BIGINT NULL,
    TargetResolutionDateTime DATETIME(6) NULL,
    ActualResolutionDateTime DATETIME(6) NULL,
    ClosedDateTime DATETIME(6) NULL,
    CancellationReason VARCHAR(1000) NULL,
    IsMajorIncident TINYINT NOT NULL DEFAULT 0,
    CustomFieldsDataJson JSON NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_issuereq_priority CHECK (PriorityCode IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_issuereq_status CHECK (StatusCode IN ('NEW', 'PENDING_APPROVAL', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'CANCELLED')),
    CONSTRAINT chk_issuereq_channel CHECK (RequestChannelCode IN ('WEB', 'MOBILE', 'EMAIL', 'QR')),
    CONSTRAINT chk_issuereq_source CHECK (RequestSourceCode IN ('TENANT', 'EMPLOYEE', 'GUEST')),
    CONSTRAINT fk_issuereq_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_issuereq_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_issuereq_requester FOREIGN KEY (RequesterUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_issuereq_building FOREIGN KEY (BuildingID) REFERENCES Building(BuildingID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_issuereq_office FOREIGN KEY (OfficeSpaceID) REFERENCES OfficeSpace(OfficeSpaceID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_issuereq_dept FOREIGN KEY (AssignedDepartmentID) REFERENCES Department(DepartmentID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: RootCause
CREATE TABLE IF NOT EXISTS RootCause (
    RootCauseID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IssueRequestID BIGINT NOT NULL UNIQUE,
    InvestigatorUserID BIGINT NULL,
    RootCauseSummary VARCHAR(1000) NOT NULL,
    RootCauseDetails TEXT NULL,
    CorrectiveActionsTaken VARCHAR(2000) NULL,
    PreventiveActionsProposed VARCHAR(2000) NULL,
    InvestigationDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_rc_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_rc_investigator FOREIGN KEY (InvestigatorUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Resolution
CREATE TABLE IF NOT EXISTS Resolution (
    ResolutionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IssueRequestID BIGINT NOT NULL UNIQUE,
    ResolverUserID BIGINT NULL,
    ResolutionTypeCode VARCHAR(30) NOT NULL, -- WORKAROUND, PERMANENT_FIX, REPLACEMENT
    ResolutionSummary VARCHAR(1000) NOT NULL,
    ActionStepsTaken TEXT NULL,
    ResolvedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    VerificationNotes VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_res_type CHECK (ResolutionTypeCode IN ('WORKAROUND', 'PERMANENT_FIX', 'REPLACEMENT')),
    CONSTRAINT fk_res_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_res_resolver FOREIGN KEY (ResolverUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnownIssue
CREATE TABLE IF NOT EXISTS KnownIssue (
    KnownIssueID BIGINT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(250) NOT NULL,
    Symptoms VARCHAR(2000) NOT NULL,
    Workaround VARCHAR(2000) NULL,
    PermanentSolution VARCHAR(2000) NULL,
    CategoryCode VARCHAR(50) NOT NULL,
    SearchKeywords VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: IssueRequestAttachment
CREATE TABLE IF NOT EXISTS IssueRequestAttachment (
    IssueRequestAttachmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IssueRequestID BIGINT NOT NULL,
    CentralDocumentID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_reqattach_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reqattach_central FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: IssueRequestComment
CREATE TABLE IF NOT EXISTS IssueRequestComment (
    IssueRequestCommentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IssueRequestID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    CommentText VARCHAR(2000) NOT NULL,
    IsInternal TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_comment_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: IssueRequestHistory
CREATE TABLE IF NOT EXISTS IssueRequestHistory (
    IssueRequestHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IssueRequestID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    FieldName VARCHAR(100) NULL,
    OldValue VARCHAR(1000) NULL,
    NewValue VARCHAR(1000) NULL,
    ActionTypeCode VARCHAR(50) NOT NULL, -- STATUS_CHANGED, ASSIGNED, DETAILS_MODIFIED, ROOT_CAUSE_FOUND
    ActionDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    Remarks VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_reqhist_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reqhist_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: IssueRequestWatcher
CREATE TABLE IF NOT EXISTS IssueRequestWatcher (
    IssueRequestWatcherID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IssueRequestID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_issuereq_watcher UNIQUE(IssueRequestID, UserID),
    CONSTRAINT fk_watcher_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_watcher_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: IssueRequestSubscription
CREATE TABLE IF NOT EXISTS IssueRequestSubscription (
    IssueRequestSubscriptionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IssueRequestID BIGINT NOT NULL,
    SubscriberUserID BIGINT NOT NULL,
    NotificationPreferenceCode VARCHAR(30) NOT NULL DEFAULT 'ALL',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_issuereq_subscription UNIQUE(IssueRequestID, SubscriberUserID),
    CONSTRAINT fk_sub_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_sub_user FOREIGN KEY (SubscriberUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: IssueRequestRelationship
CREATE TABLE IF NOT EXISTS IssueRequestRelationship (
    IssueRequestRelationshipID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ParentIssueRequestID BIGINT NOT NULL,
    ChildIssueRequestID BIGINT NOT NULL,
    RelationshipTypeCode VARCHAR(30) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_issuereq_relationship UNIQUE(ParentIssueRequestID, ChildIssueRequestID),
    CONSTRAINT chk_issuereq_rel_type CHECK (RelationshipTypeCode IN ('DUPLICATE_OF', 'DEPENDS_ON', 'RELATED_TO')),
    CONSTRAINT fk_rel_parent_issuereq FOREIGN KEY (ParentIssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_rel_child_issuereq FOREIGN KEY (ChildIssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: GuestIssueRequest
CREATE TABLE IF NOT EXISTS GuestIssueRequest (
    GuestIssueRequestID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IssueRequestID BIGINT NOT NULL UNIQUE,
    GuestName VARCHAR(150) NOT NULL,
    GuestEmail VARCHAR(200) NOT NULL,
    GuestPhoneNumber VARCHAR(50) NULL,
    QRCodeScannedValue VARCHAR(255) NULL,
    VerificationToken VARCHAR(100) NULL,
    IsVerified TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_guest_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 9: APPROVAL MANAGEMENT
-- ============================================================================
-- Table: ApprovalRule
CREATE TABLE IF NOT EXISTS ApprovalRule (
    ApprovalRuleID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    RuleName VARCHAR(150) NOT NULL,
    Description VARCHAR(1000) NULL,
    MinCost DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    MaxCost DECIMAL(18,2) NULL,
    CurrencyCode VARCHAR(10) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_apprule_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ApprovalGroup
CREATE TABLE IF NOT EXISTS ApprovalGroup (
    ApprovalGroupID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    GroupName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_appgroup_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ApprovalMember
CREATE TABLE IF NOT EXISTS ApprovalMember (
    ApprovalMemberID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ApprovalGroupID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_group_member UNIQUE(ApprovalGroupID, UserID),
    CONSTRAINT fk_appmember_group FOREIGN KEY (ApprovalGroupID) REFERENCES ApprovalGroup(ApprovalGroupID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appmember_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Approval
CREATE TABLE IF NOT EXISTS Approval (
    ApprovalID BIGINT AUTO_INCREMENT PRIMARY KEY,
    RequestID BIGINT NOT NULL,
    ApprovalRuleID BIGINT NULL,
    Title VARCHAR(250) NOT NULL,
    Description VARCHAR(1000) NULL,
    TotalStages INT NOT NULL DEFAULT 1,
    CurrentStageNumber INT NOT NULL DEFAULT 1,
    ApprovalStatusCode VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    FinalActionedByUserID BIGINT NULL,
    FinalActionedDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_approval_status CHECK (ApprovalStatusCode IN ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED')),
    CONSTRAINT fk_approval_issuereq FOREIGN KEY (RequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_approval_rule FOREIGN KEY (ApprovalRuleID) REFERENCES ApprovalRule(ApprovalRuleID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_actionedby FOREIGN KEY (FinalActionedByUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ApprovalStage
CREATE TABLE IF NOT EXISTS ApprovalStage (
    ApprovalStageID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ApprovalID BIGINT NOT NULL,
    StageNumber INT NOT NULL,
    ApproverUserID BIGINT NULL,
    ApproverGroupID BIGINT NULL,
    StageStatusCode VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    SequenceNumber INT NOT NULL DEFAULT 1,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_approval_stage UNIQUE(ApprovalID, StageNumber),
    CONSTRAINT chk_stage_status CHECK (StageStatusCode IN ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED')),
    CONSTRAINT fk_appstage_approval FOREIGN KEY (ApprovalID) REFERENCES Approval(ApprovalID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appstage_user FOREIGN KEY (ApproverUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appstage_group FOREIGN KEY (ApproverGroupID) REFERENCES ApprovalGroup(ApprovalGroupID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ApprovalDecision
CREATE TABLE IF NOT EXISTS ApprovalDecision (
    ApprovalDecisionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ApprovalStageID BIGINT NOT NULL,
    DecisionUserID BIGINT NOT NULL,
    DecisionCode VARCHAR(30) NOT NULL,
    Comments VARCHAR(1000) NULL,
    DecisionDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_decision CHECK (DecisionCode IN ('APPROVED', 'REJECTED', 'RETURNED_FOR_CORRECTION')),
    CONSTRAINT fk_decision_stage FOREIGN KEY (ApprovalStageID) REFERENCES ApprovalStage(ApprovalStageID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_decision_user FOREIGN KEY (DecisionUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ApprovalHistory
CREATE TABLE IF NOT EXISTS ApprovalHistory (
    ApprovalHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ApprovalID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    ActionTypeCode VARCHAR(50) NOT NULL,
    ActionDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    Remarks VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_apphist_approval FOREIGN KEY (ApprovalID) REFERENCES Approval(ApprovalID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_apphist_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ApprovalDelegation
CREATE TABLE IF NOT EXISTS ApprovalDelegation (
    ApprovalDelegationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    DelegatorUserID BIGINT NOT NULL,
    DelegateeUserID BIGINT NOT NULL,
    StartDateTime DATETIME(6) NOT NULL,
    EndDateTime DATETIME(6) NOT NULL,
    Reason VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_appdelegate_delegator FOREIGN KEY (DelegatorUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appdelegate_delegatee FOREIGN KEY (DelegateeUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ApprovalThreshold
CREATE TABLE IF NOT EXISTS ApprovalThreshold (
    ApprovalThresholdID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    MaxAutoApproveAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    CurrencyCode VARCHAR(10) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_threshold_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: BackupApprover
CREATE TABLE IF NOT EXISTS BackupApprover (
    BackupApproverID BIGINT AUTO_INCREMENT PRIMARY KEY,
    PrimaryUserID BIGINT NOT NULL,
    BackupUserID BIGINT NOT NULL,
    AssignedDate DATE NOT NULL,
    ExpiryDate DATE NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_backup_primary FOREIGN KEY (PrimaryUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_backup_backup FOREIGN KEY (BackupUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 11: SLA & ESCALATION MANAGEMENT
-- ============================================================================
-- Table: SLAPolicy
CREATE TABLE IF NOT EXISTS SLAPolicy (
    SLAPolicyID BIGINT AUTO_INCREMENT PRIMARY KEY,
    PolicyName VARCHAR(150) NOT NULL UNIQUE,
    Description VARCHAR(1000) NULL,
    BusinessCalendarID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_policy_calendar FOREIGN KEY (BusinessCalendarID) REFERENCES BusinessCalendar(BusinessCalendarID) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SLAStage
CREATE TABLE IF NOT EXISTS SLAStage (
    SLAStageID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SLAPolicyID BIGINT NOT NULL,
    PriorityCode VARCHAR(30) NOT NULL,
    TargetResponseMinutes INT NOT NULL,
    TargetResolutionMinutes INT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_slastage UNIQUE(SLAPolicyID, PriorityCode),
    CONSTRAINT fk_slastage_policy FOREIGN KEY (SLAPolicyID) REFERENCES SLAPolicy(SLAPolicyID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: PauseReason
CREATE TABLE IF NOT EXISTS PauseReason (
    PauseReasonID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ReasonCode VARCHAR(50) NOT NULL UNIQUE,
    ReasonName VARCHAR(150) NOT NULL,
    StopTimer TINYINT NOT NULL DEFAULT 1,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SLAClock
CREATE TABLE IF NOT EXISTS SLAClock (
    SLAClockID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IssueRequestID BIGINT NOT NULL,
    SLAStageID BIGINT NOT NULL,
    ResponseDeadline DATETIME(6) NOT NULL,
    ResolutionDeadline DATETIME(6) NOT NULL,
    ResponseAchievedDateTime DATETIME(6) NULL,
    ResolutionAchievedDateTime DATETIME(6) NULL,
    AccumulatedPausedSeconds INT NOT NULL DEFAULT 0,
    LastPausedDateTime DATETIME(6) NULL,
    CurrentPauseReasonID BIGINT NULL,
    IsResponseBreached TINYINT NOT NULL DEFAULT 0,
    IsResolutionBreached TINYINT NOT NULL DEFAULT 0,
    ClockStatus VARCHAR(30) NOT NULL DEFAULT 'RUNNING',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_slaclock_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_slaclock_stage FOREIGN KEY (SLAStageID) REFERENCES SLAStage(SLAStageID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_slaclock_pausereason FOREIGN KEY (CurrentPauseReasonID) REFERENCES PauseReason(PauseReasonID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SLAHistory
CREATE TABLE IF NOT EXISTS SLAHistory (
    SLAHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SLAClockID BIGINT NOT NULL,
    EventName VARCHAR(100) NOT NULL,
    EventDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PerformedByUserID BIGINT NULL,
    Remarks VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_slahist_clock FOREIGN KEY (SLAClockID) REFERENCES SLAClock(SLAClockID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_slahist_user FOREIGN KEY (PerformedByUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SLABreach
CREATE TABLE IF NOT EXISTS SLABreach (
    SLABreachID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SLAClockID BIGINT NOT NULL,
    BreachType VARCHAR(30) NOT NULL,
    ActualBreachDateTime DATETIME(6) NOT NULL,
    SeverityLevel VARCHAR(30) NOT NULL DEFAULT 'HIGH',
    NotificationSent TINYINT NOT NULL DEFAULT 0,
    IsAcknowledged TINYINT NOT NULL DEFAULT 0,
    AcknowledgedByUserID BIGINT NULL,
    AcknowledgedDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_slabreach_clock FOREIGN KEY (SLAClockID) REFERENCES SLAClock(SLAClockID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_slabreach_user FOREIGN KEY (AcknowledgedByUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: EscalationRule
CREATE TABLE IF NOT EXISTS EscalationRule (
    EscalationRuleID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SLAStageID BIGINT NOT NULL,
    RuleName VARCHAR(150) NOT NULL,
    TriggerOffsetMinutes INT NOT NULL,
    TriggerTypeCode VARCHAR(30) NOT NULL,
    TargetEscalationLevel INT NOT NULL DEFAULT 1,
    ActionTypeCode VARCHAR(50) NOT NULL,
    ReassignedTeamID BIGINT NULL,
    ReassignedUserID BIGINT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_escrule_stage FOREIGN KEY (SLAStageID) REFERENCES SLAStage(SLAStageID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_escrule_team FOREIGN KEY (ReassignedTeamID) REFERENCES Team(TeamID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_escrule_user FOREIGN KEY (ReassignedUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: EscalationRecipient
CREATE TABLE IF NOT EXISTS EscalationRecipient (
    EscalationRecipientID BIGINT AUTO_INCREMENT PRIMARY KEY,
    EscalationRuleID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    NotificationChannelCode VARCHAR(30) NOT NULL DEFAULT 'EMAIL',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_esc_recipient UNIQUE(EscalationRuleID, UserID),
    CONSTRAINT fk_escrecip_rule FOREIGN KEY (EscalationRuleID) REFERENCES EscalationRule(EscalationRuleID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_escrecip_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: EscalationHistory
CREATE TABLE IF NOT EXISTS EscalationHistory (
    EscalationHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IssueRequestID BIGINT NOT NULL,
    EscalationRuleID BIGINT NOT NULL,
    TriggeredDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    Status VARCHAR(30) NOT NULL DEFAULT 'EXECUTED',
    ActionExecutedRemarks VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_eschist_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_eschist_rule FOREIGN KEY (EscalationRuleID) REFERENCES EscalationRule(EscalationRuleID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 10: ASSIGNMENT & DISPATCH MANAGEMENT
-- ============================================================================
-- Table: DispatchQueue
CREATE TABLE IF NOT EXISTS DispatchQueue (
    DispatchQueueID BIGINT AUTO_INCREMENT PRIMARY KEY,
    QueueCode VARCHAR(50) NOT NULL UNIQUE,
    QueueName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Dispatcher
CREATE TABLE IF NOT EXISTS Dispatcher (
    DispatcherID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL UNIQUE,
    DispatchQueueID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_dispatcher_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_dispatcher_queue FOREIGN KEY (DispatchQueueID) REFERENCES DispatchQueue(DispatchQueueID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TechnicianSkill
CREATE TABLE IF NOT EXISTS TechnicianSkill (
    TechnicianSkillID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    SkillCode VARCHAR(50) NOT NULL,
    ExperienceYears INT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_tech_skill UNIQUE(UserID, SkillCode),
    CONSTRAINT fk_techskill_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TechnicianCertification
CREATE TABLE IF NOT EXISTS TechnicianCertification (
    TechnicianCertificationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    CertificationName VARCHAR(200) NOT NULL,
    IssuingOrganization VARCHAR(200) NOT NULL,
    ExpiryDate DATE NULL,
    CentralDocumentID BIGINT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_cert_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cert_document FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TechnicianAvailability
CREATE TABLE IF NOT EXISTS TechnicianAvailability (
    TechnicianAvailabilityID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL UNIQUE,
    AvailabilityStatusCode VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    LastStatusChangeDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_tech_availability CHECK (AvailabilityStatusCode IN ('AVAILABLE', 'BUSY', 'ON_LEAVE', 'OFFLINE')),
    CONSTRAINT fk_avail_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TechnicianSchedule
CREATE TABLE IF NOT EXISTS TechnicianSchedule (
    TechnicianScheduleID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    ScheduleDate DATE NOT NULL,
    ShiftStart TIME NOT NULL,
    ShiftEnd TIME NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_tech_schedule UNIQUE(UserID, ScheduleDate),
    CONSTRAINT fk_schedule_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TechnicianLocation
CREATE TABLE IF NOT EXISTS TechnicianLocation (
    TechnicianLocationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL UNIQUE,
    Latitude DECIMAL(18,8) NOT NULL,
    Longitude DECIMAL(18,8) NOT NULL,
    RecordedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_loc_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Assignment
CREATE TABLE IF NOT EXISTS Assignment (
    AssignmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    RequestID BIGINT NOT NULL,
    AssignedUserID BIGINT NULL,
    AssignedTeamID BIGINT NULL,
    AssignedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    StartDateTime DATETIME(6) NULL,
    CompleteDateTime DATETIME(6) NULL,
    PausedDurationSeconds INT NOT NULL DEFAULT 0,
    AssignmentStatusCode VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_assignment_status CHECK (AssignmentStatusCode IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'REJECTED')),
    CONSTRAINT fk_assign_request FOREIGN KEY (RequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_assign_user FOREIGN KEY (AssignedUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_assign_team FOREIGN KEY (AssignedTeamID) REFERENCES Team(TeamID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssignmentHistory
CREATE TABLE IF NOT EXISTS AssignmentHistory (
    AssignmentHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssignmentID BIGINT NOT NULL,
    ActionUserID BIGINT NOT NULL,
    ActionTypeCode VARCHAR(50) NOT NULL,
    ActionDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    Remarks VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_assignhist_assign FOREIGN KEY (AssignmentID) REFERENCES Assignment(AssignmentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_assignhist_user FOREIGN KEY (ActionUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssignmentRule
CREATE TABLE IF NOT EXISTS AssignmentRule (
    AssignmentRuleID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServiceID BIGINT NULL,
    PriorityCode VARCHAR(30) NULL,
    TargetQueueID BIGINT NULL,
    TargetTeamID BIGINT NULL,
    RoutingLogicCode VARCHAR(50) NOT NULL DEFAULT 'ROUND_ROBIN',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_routing_logic CHECK (RoutingLogicCode IN ('ROUND_ROBIN', 'LOWEST_WORKLOAD')),
    CONSTRAINT fk_rule_service FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_rule_queue FOREIGN KEY (TargetQueueID) REFERENCES DispatchQueue(DispatchQueueID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_rule_team FOREIGN KEY (TargetTeamID) REFERENCES Team(TeamID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssignmentRejection
CREATE TABLE IF NOT EXISTS AssignmentRejection (
    AssignmentRejectionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssignmentID BIGINT NOT NULL,
    TechnicianUserID BIGINT NOT NULL,
    RejectionReason VARCHAR(1000) NOT NULL,
    RejectionDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_rejection_assign FOREIGN KEY (AssignmentID) REFERENCES Assignment(AssignmentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_rejection_user FOREIGN KEY (TechnicianUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TeamAssignment
CREATE TABLE IF NOT EXISTS TeamAssignment (
    TeamAssignmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TeamID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    RoleInTeam VARCHAR(100) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_team_assign UNIQUE(TeamID, UserID),
    CONSTRAINT fk_teamassign_team FOREIGN KEY (TeamID) REFERENCES Team(TeamID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_teamassign_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Workload
CREATE TABLE IF NOT EXISTS Workload (
    WorkloadID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL UNIQUE,
    ActiveAssignmentCount INT NOT NULL DEFAULT 0,
    CompletedAssignmentCount INT NOT NULL DEFAULT 0,
    LastAssignedDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_workload_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 12: ASSET & FACILITY MANAGEMENT
-- ============================================================================
-- Table: AssetManufacturer
CREATE TABLE IF NOT EXISTS AssetManufacturer (
    AssetManufacturerID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ManufacturerName VARCHAR(150) NOT NULL UNIQUE,
    SupportContactEmail VARCHAR(200) NULL,
    SupportContactPhone VARCHAR(50) NULL,
    Website VARCHAR(250) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetCategory
CREATE TABLE IF NOT EXISTS AssetCategory (
    AssetCategoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CategoryCode VARCHAR(50) NOT NULL UNIQUE,
    CategoryName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetType
CREATE TABLE IF NOT EXISTS AssetType (
    AssetTypeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetTypeCode VARCHAR(50) NOT NULL UNIQUE,
    AssetTypeName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetModel
CREATE TABLE IF NOT EXISTS AssetModel (
    AssetModelID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetManufacturerID BIGINT NOT NULL,
    AssetCategoryID BIGINT NOT NULL,
    ModelName VARCHAR(150) NOT NULL,
    ModelNumber VARCHAR(100) NULL,
    TechnicalSpecificationsJson JSON NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_model UNIQUE(AssetManufacturerID, ModelName),
    FOREIGN KEY (AssetManufacturerID) REFERENCES AssetManufacturer(AssetManufacturerID) ON DELETE RESTRICT,
    FOREIGN KEY (AssetCategoryID) REFERENCES AssetCategory(AssetCategoryID) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Asset
CREATE TABLE IF NOT EXISTS Asset (
    AssetID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetModelID BIGINT NOT NULL,
    AssetTypeID BIGINT NOT NULL,
    SerialNumber VARCHAR(100) NULL,
    InventoryTagNumber VARCHAR(100) NOT NULL UNIQUE,
    OfficeSpaceID BIGINT NULL,
    OwnerType VARCHAR(50) NOT NULL DEFAULT 'OPERATOR',
    TenantID BIGINT NULL,
    AssetStatusCode VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    ConditionCode VARCHAR(30) NOT NULL DEFAULT 'GOOD',
    PurchaseDate DATE NULL,
    PurchaseCost DECIMAL(18,2) NULL,
    CurrencyCode VARCHAR(10) NULL,
    WarrantyExpiryDate DATE NULL,
    AssetDetailsJson JSON NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_asset_status CHECK (AssetStatusCode IN ('ACTIVE', 'IN_REPAIR', 'DISPOSED', 'LOST')),
    CONSTRAINT chk_asset_condition CHECK (ConditionCode IN ('NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN')),
    CONSTRAINT fk_asset_model FOREIGN KEY (AssetModelID) REFERENCES AssetModel(AssetModelID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_asset_type FOREIGN KEY (AssetTypeID) REFERENCES AssetType(AssetTypeID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_asset_space FOREIGN KEY (OfficeSpaceID) REFERENCES OfficeSpace(OfficeSpaceID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_asset_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetWarranty
CREATE TABLE IF NOT EXISTS AssetWarranty (
    AssetWarrantyID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetID BIGINT NOT NULL UNIQUE,
    ProviderName VARCHAR(150) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    SupportPhone VARCHAR(50) NULL,
    SupportEmail VARCHAR(200) NULL,
    CentralDocumentID BIGINT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_warranty_asset FOREIGN KEY (AssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_warranty_document FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetQRCode
CREATE TABLE IF NOT EXISTS AssetQRCode (
    AssetQRCodeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetID BIGINT NOT NULL UNIQUE,
    QRCodeValue VARCHAR(255) NOT NULL UNIQUE,
    GeneratedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    QRCodeImagePath VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_qrcode_asset FOREIGN KEY (AssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetMaintenancePlan
CREATE TABLE IF NOT EXISTS AssetMaintenancePlan (
    AssetMaintenancePlanID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetID BIGINT NOT NULL,
    PlanName VARCHAR(150) NOT NULL,
    Description VARCHAR(1000) NULL,
    IntervalDays INT NOT NULL DEFAULT 90,
    EstimatedDurationHours DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_mplan_asset FOREIGN KEY (AssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: MaintenanceSchedule
CREATE TABLE IF NOT EXISTS MaintenanceSchedule (
    MaintenanceScheduleID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetMaintenancePlanID BIGINT NOT NULL,
    ScheduledDate DATE NOT NULL,
    AssignedUserID BIGINT NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_maint_status CHECK (Status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED')),
    CONSTRAINT fk_schedule_plan FOREIGN KEY (AssetMaintenancePlanID) REFERENCES AssetMaintenancePlan(AssetMaintenancePlanID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_schedule_technician FOREIGN KEY (AssignedUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: MaintenanceChecklist
CREATE TABLE IF NOT EXISTS MaintenanceChecklist (
    MaintenanceChecklistID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetMaintenancePlanID BIGINT NOT NULL,
    ChecklistItemDescription VARCHAR(255) NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_checklist_plan FOREIGN KEY (AssetMaintenancePlanID) REFERENCES AssetMaintenancePlan(AssetMaintenancePlanID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetInspection
CREATE TABLE IF NOT EXISTS AssetInspection (
    AssetInspectionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetID BIGINT NOT NULL,
    InspectorUserID BIGINT NOT NULL,
    InspectionDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ConditionStatusCode VARCHAR(30) NOT NULL,
    Notes VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_inspect_condition CHECK (ConditionStatusCode IN ('GOOD', 'FAIR', 'POOR', 'FAIL')),
    CONSTRAINT fk_inspect_asset FOREIGN KEY (AssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_inspect_inspector FOREIGN KEY (InspectorUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: MaintenanceHistory
CREATE TABLE IF NOT EXISTS MaintenanceHistory (
    MaintenanceHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetID BIGINT NOT NULL,
    MaintenanceScheduleID BIGINT NULL,
    IssueRequestID BIGINT NULL,
    ActualMaintenanceDate DATE NOT NULL,
    TechnicianUserID BIGINT NOT NULL,
    ActionSummary VARCHAR(1000) NOT NULL,
    MaterialCosts DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    LaborCosts DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    CurrencyCode VARCHAR(10) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_mainthist_asset FOREIGN KEY (AssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_mainthist_schedule FOREIGN KEY (MaintenanceScheduleID) REFERENCES MaintenanceSchedule(MaintenanceScheduleID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_mainthist_issuereq FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_mainthist_technician FOREIGN KEY (TechnicianUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetFailure
CREATE TABLE IF NOT EXISTS AssetFailure (
    AssetFailureID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetID BIGINT NOT NULL,
    ReporterUserID BIGINT NOT NULL,
    FailureDateTime DATETIME(6) NOT NULL,
    SymptomDescription VARCHAR(1000) NOT NULL,
    RootCauseDescription VARCHAR(1000) NULL,
    ActionTaken VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_failure_asset FOREIGN KEY (AssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_failure_reporter FOREIGN KEY (ReporterUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetDowntime
CREATE TABLE IF NOT EXISTS AssetDowntime (
    AssetDowntimeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetID BIGINT NOT NULL,
    AssetFailureID BIGINT NULL,
    StartDateTime DATETIME(6) NOT NULL,
    EndDateTime DATETIME(6) NULL,
    DowntimeReason VARCHAR(500) NULL,
    CalculatedDowntimeMinutes INT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_downtime_asset FOREIGN KEY (AssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_downtime_failure FOREIGN KEY (AssetFailureID) REFERENCES AssetFailure(AssetFailureID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetMovement
CREATE TABLE IF NOT EXISTS AssetMovement (
    AssetMovementID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetID BIGINT NOT NULL,
    FromOfficeSpaceID BIGINT NULL,
    ToOfficeSpaceID BIGINT NULL,
    MovedByUserID BIGINT NOT NULL,
    MovementDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    Reason VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_movement_asset FOREIGN KEY (AssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_movement_fromspace FOREIGN KEY (FromOfficeSpaceID) REFERENCES OfficeSpace(OfficeSpaceID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_movement_tospace FOREIGN KEY (ToOfficeSpaceID) REFERENCES OfficeSpace(OfficeSpaceID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_movement_user FOREIGN KEY (MovedByUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetDocument
CREATE TABLE IF NOT EXISTS AssetDocument (
    AssetDocumentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetID BIGINT NOT NULL,
    CentralDocumentID BIGINT NOT NULL,
    DocumentTypeCode VARCHAR(50) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_assetdoc_type CHECK (DocumentTypeCode IN ('MANUAL', 'DIAGRAM', 'CERTIFICATE')),
    CONSTRAINT fk_assetdoc_asset FOREIGN KEY (AssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_assetdoc_central FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SparePart
CREATE TABLE IF NOT EXISTS SparePart (
    SparePartID BIGINT AUTO_INCREMENT PRIMARY KEY,
    PartCode VARCHAR(50) NOT NULL UNIQUE,
    PartName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    QuantityInStock INT NOT NULL DEFAULT 0,
    ReorderLevel INT NOT NULL DEFAULT 5,
    UnitPrice DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    CurrencyCode VARCHAR(10) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetSparePart
CREATE TABLE IF NOT EXISTS AssetSparePart (
    AssetSparePartID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AssetID BIGINT NOT NULL,
    SparePartID BIGINT NOT NULL,
    QuantityUsed INT NOT NULL DEFAULT 1,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_asset_spare UNIQUE(AssetID, SparePartID),
    CONSTRAINT fk_assetspare_asset FOREIGN KEY (AssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_assetspare_spare FOREIGN KEY (SparePartID) REFERENCES SparePart(SparePartID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AssetRelationship
CREATE TABLE IF NOT EXISTS AssetRelationship (
    AssetRelationshipID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ParentAssetID BIGINT NOT NULL,
    ChildAssetID BIGINT NOT NULL,
    RelationshipTypeCode VARCHAR(30) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_asset_relation UNIQUE(ParentAssetID, ChildAssetID),
    CONSTRAINT chk_asset_relation_type CHECK (RelationshipTypeCode IN ('COMPONENT_OF', 'REPLACED_BY', 'DEPENDS_ON')),
    CONSTRAINT fk_assetrel_parent FOREIGN KEY (ParentAssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_assetrel_child FOREIGN KEY (ChildAssetID) REFERENCES Asset(AssetID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MODULE 13: COMMUNICATION & COLLABORATION
-- ============================================================================
-- Table: Conversation
CREATE TABLE IF NOT EXISTS Conversation (
    ConversationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    Title VARCHAR(250) NULL,
    ReferenceIssueRequestID BIGINT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_convo_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_convo_issuereq FOREIGN KEY (ReferenceIssueRequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ConversationParticipant
CREATE TABLE IF NOT EXISTS ConversationParticipant (
    ConversationParticipantID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ConversationID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    JoinedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_convo_participant UNIQUE(ConversationID, UserID),
    CONSTRAINT fk_convopart_convo FOREIGN KEY (ConversationID) REFERENCES Conversation(ConversationID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_convopart_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Message
CREATE TABLE IF NOT EXISTS Message (
    MessageID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ConversationID BIGINT NOT NULL,
    SenderUserID BIGINT NOT NULL,
    MessageText TEXT NOT NULL,
    SentDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_msg_convo FOREIGN KEY (ConversationID) REFERENCES Conversation(ConversationID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (SenderUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: MessageAttachment
CREATE TABLE IF NOT EXISTS MessageAttachment (
    MessageAttachmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    MessageID BIGINT NOT NULL,
    CentralDocumentID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_msgattach_msg FOREIGN KEY (MessageID) REFERENCES Message(MessageID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_msgattach_central FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: MessageRead
CREATE TABLE IF NOT EXISTS MessageRead (
    MessageReadID BIGINT AUTO_INCREMENT PRIMARY KEY,
    MessageID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    ReadDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_message_read UNIQUE(MessageID, UserID),
    CONSTRAINT fk_msgread_msg FOREIGN KEY (MessageID) REFERENCES Message(MessageID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_msgread_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Comment
CREATE TABLE IF NOT EXISTS `Comment` (
    CommentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    EntityName VARCHAR(100) NOT NULL,
    EntityID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    CommentText VARCHAR(2000) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_comment_author FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Mention
CREATE TABLE IF NOT EXISTS Mention (
    MentionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SourceTable VARCHAR(100) NOT NULL,
    SourceID BIGINT NOT NULL,
    MentionedUserID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_mention_user FOREIGN KEY (MentionedUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: InternalNote
CREATE TABLE IF NOT EXISTS InternalNote (
    InternalNoteID BIGINT AUTO_INCREMENT PRIMARY KEY,
    RequestID BIGINT NOT NULL,
    AuthorUserID BIGINT NOT NULL,
    NoteText TEXT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_intnote_issuereq FOREIGN KEY (RequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_intnote_author FOREIGN KEY (AuthorUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: EmailMessage
CREATE TABLE IF NOT EXISTS EmailMessage (
    EmailMessageID BIGINT AUTO_INCREMENT PRIMARY KEY,
    RequestID BIGINT NULL,
    SenderAddress VARCHAR(250) NOT NULL,
    RecipientAddress VARCHAR(250) NOT NULL,
    Subject VARCHAR(250) NOT NULL,
    BodyHTML TEXT NOT NULL,
    SentDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_emailmsg_issuereq FOREIGN KEY (RequestID) REFERENCES IssueRequest(IssueRequestID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: EmailQueue
CREATE TABLE IF NOT EXISTS EmailQueue (
    EmailQueueID BIGINT AUTO_INCREMENT PRIMARY KEY,
    RecipientAddress VARCHAR(250) NOT NULL,
    Subject VARCHAR(250) NOT NULL,
    BodyHTML TEXT NOT NULL,
    Status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    RetryCount INT NOT NULL DEFAULT 0,
    ProcessedDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: EmailTemplate
CREATE TABLE IF NOT EXISTS EmailTemplate (
    EmailTemplateID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TemplateCode VARCHAR(50) NOT NULL UNIQUE,
    TemplateName VARCHAR(150) NOT NULL,
    SubjectTemplate VARCHAR(250) NOT NULL,
    BodyTemplate TEXT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SMSQueue
CREATE TABLE IF NOT EXISTS SMSQueue (
    SMSQueueID BIGINT AUTO_INCREMENT PRIMARY KEY,
    RecipientPhone VARCHAR(50) NOT NULL,
    MessageText VARCHAR(500) NOT NULL,
    Status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    RetryCount INT NOT NULL DEFAULT 0,
    ProcessedDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Announcement
CREATE TABLE IF NOT EXISTS Announcement (
    AnnouncementID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BusinessParkID BIGINT NOT NULL,
    TargetTenantID BIGINT NULL,
    Title VARCHAR(250) NOT NULL,
    ContentHTML TEXT NOT NULL,
    PublisherUserID BIGINT NOT NULL,
    PublishDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ExpiryDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_announce_park FOREIGN KEY (BusinessParkID) REFERENCES BusinessPark(BusinessParkID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_announce_tenant FOREIGN KEY (TargetTenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_announce_publisher FOREIGN KEY (PublisherUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DiscussionGroup
CREATE TABLE IF NOT EXISTS DiscussionGroup (
    DiscussionGroupID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    GroupName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_dgroup_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: GroupMember
CREATE TABLE IF NOT EXISTS GroupMember (
    GroupMemberID BIGINT AUTO_INCREMENT PRIMARY KEY,
    DiscussionGroupID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    JoinedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_group_member_assoc UNIQUE(DiscussionGroupID, UserID),
    CONSTRAINT fk_gmember_group FOREIGN KEY (DiscussionGroupID) REFERENCES DiscussionGroup(DiscussionGroupID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_gmember_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: CommunicationLog
CREATE TABLE IF NOT EXISTS CommunicationLog (
    CommunicationLogID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    ChannelCode VARCHAR(30) NOT NULL,
    SenderAddress VARCHAR(250) NULL,
    RecipientAddress VARCHAR(250) NOT NULL,
    Subject VARCHAR(250) NULL,
    DeliveryStatus VARCHAR(30) NOT NULL,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_commlog_channel CHECK (ChannelCode IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    CONSTRAINT chk_commlog_status CHECK (DeliveryStatus IN ('SUCCESS', 'FAILED')),
    CONSTRAINT fk_commlog_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 15: KNOWLEDGE BASE MANAGEMENT
-- ============================================================================
-- Table: KnowledgeCategory
CREATE TABLE IF NOT EXISTS KnowledgeCategory (
    KnowledgeCategoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    ParentCategoryID BIGINT NULL,
    CategoryCode VARCHAR(50) NOT NULL,
    CategoryName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_kb_category UNIQUE(TenantID, CategoryCode),
    CONSTRAINT fk_kbcat_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_kbcat_parent FOREIGN KEY (ParentCategoryID) REFERENCES KnowledgeCategory(KnowledgeCategoryID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnowledgeArticle
CREATE TABLE IF NOT EXISTS KnowledgeArticle (
    KnowledgeArticleID BIGINT AUTO_INCREMENT PRIMARY KEY,
    KnowledgeCategoryID BIGINT NOT NULL,
    Title VARCHAR(250) NOT NULL,
    ContentHTML TEXT NOT NULL,
    ArticleStatusCode VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    AuthorUserID BIGINT NOT NULL,
    SearchKeywords VARCHAR(500) NULL,
    ViewsCount INT NOT NULL DEFAULT 0,
    LikesCount INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_article_status CHECK (ArticleStatusCode IN ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT fk_article_category FOREIGN KEY (KnowledgeCategoryID) REFERENCES KnowledgeCategory(KnowledgeCategoryID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_article_author FOREIGN KEY (AuthorUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnowledgeSection
CREATE TABLE IF NOT EXISTS KnowledgeSection (
    KnowledgeSectionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    KnowledgeArticleID BIGINT NOT NULL,
    Heading VARCHAR(250) NOT NULL,
    BodyText TEXT NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_section_article FOREIGN KEY (KnowledgeArticleID) REFERENCES KnowledgeArticle(KnowledgeArticleID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnowledgeTag
CREATE TABLE IF NOT EXISTS KnowledgeTag (
    KnowledgeTagID BIGINT AUTO_INCREMENT PRIMARY KEY,
    KnowledgeArticleID BIGINT NOT NULL,
    TagName VARCHAR(50) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_kbtag UNIQUE(KnowledgeArticleID, TagName),
    CONSTRAINT fk_kbtag_article FOREIGN KEY (KnowledgeArticleID) REFERENCES KnowledgeArticle(KnowledgeArticleID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnowledgeAttachment
CREATE TABLE IF NOT EXISTS KnowledgeAttachment (
    KnowledgeAttachmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    KnowledgeArticleID BIGINT NOT NULL,
    CentralDocumentID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_kbattach_article FOREIGN KEY (KnowledgeArticleID) REFERENCES KnowledgeArticle(KnowledgeArticleID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_kbattach_central FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnowledgeVersion
CREATE TABLE IF NOT EXISTS KnowledgeVersion (
    KnowledgeVersionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    KnowledgeArticleID BIGINT NOT NULL,
    VersionNumber INT NOT NULL,
    ContentHTML TEXT NOT NULL,
    ChangeSummary VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_kbversion UNIQUE(KnowledgeArticleID, VersionNumber),
    CONSTRAINT fk_kbversion_article FOREIGN KEY (KnowledgeArticleID) REFERENCES KnowledgeArticle(KnowledgeArticleID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnowledgeApproval
CREATE TABLE IF NOT EXISTS KnowledgeApproval (
    KnowledgeApprovalID BIGINT AUTO_INCREMENT PRIMARY KEY,
    KnowledgeArticleID BIGINT NOT NULL,
    ApprovalID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_kbapproval_article FOREIGN KEY (KnowledgeArticleID) REFERENCES KnowledgeArticle(KnowledgeArticleID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_kbapproval_approval FOREIGN KEY (ApprovalID) REFERENCES Approval(ApprovalID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnowledgeRating
CREATE TABLE IF NOT EXISTS KnowledgeRating (
    KnowledgeRatingID BIGINT AUTO_INCREMENT PRIMARY KEY,
    KnowledgeArticleID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    RatingScore INT NOT NULL CHECK (RatingScore BETWEEN 1 AND 5),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_kbrating UNIQUE(KnowledgeArticleID, UserID),
    CONSTRAINT fk_kbrating_article FOREIGN KEY (KnowledgeArticleID) REFERENCES KnowledgeArticle(KnowledgeArticleID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_kbrating_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnowledgeFeedback
CREATE TABLE IF NOT EXISTS KnowledgeFeedback (
    KnowledgeFeedbackID BIGINT AUTO_INCREMENT PRIMARY KEY,
    KnowledgeArticleID BIGINT NOT NULL,
    UserID BIGINT NULL,
    IsHelpful TINYINT NOT NULL,
    FeedbackText VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_kbfeedback_article FOREIGN KEY (KnowledgeArticleID) REFERENCES KnowledgeArticle(KnowledgeArticleID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_kbfeedback_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnowledgeView
CREATE TABLE IF NOT EXISTS KnowledgeView (
    KnowledgeViewID BIGINT AUTO_INCREMENT PRIMARY KEY,
    KnowledgeArticleID BIGINT NOT NULL,
    UserID BIGINT NULL,
    ViewedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IPAddress VARCHAR(50) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_kbview_article FOREIGN KEY (KnowledgeArticleID) REFERENCES KnowledgeArticle(KnowledgeArticleID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_kbview_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: KnowledgeSearch
CREATE TABLE IF NOT EXISTS KnowledgeSearch (
    KnowledgeSearchID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NULL,
    SearchQuery VARCHAR(255) NOT NULL,
    ResultsCount INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_kbsearch_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: FAQ
CREATE TABLE IF NOT EXISTS FAQ (
    FAQID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    Question VARCHAR(1000) NOT NULL,
    AnswerHTML TEXT NOT NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_faq_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SolutionTemplate
CREATE TABLE IF NOT EXISTS SolutionTemplate (
    SolutionTemplateID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TemplateName VARCHAR(150) NOT NULL UNIQUE,
    ResolutionSummary VARCHAR(1000) NOT NULL,
    StepsTaken TEXT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: RelatedArticle
CREATE TABLE IF NOT EXISTS RelatedArticle (
    RelatedArticleID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ArticleID BIGINT NOT NULL,
    RelatedToArticleID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_related_article UNIQUE(ArticleID, RelatedToArticleID),
    CONSTRAINT fk_relarticle_source FOREIGN KEY (ArticleID) REFERENCES KnowledgeArticle(KnowledgeArticleID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_relarticle_target FOREIGN KEY (RelatedToArticleID) REFERENCES KnowledgeArticle(KnowledgeArticleID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 16: NOTIFICATION MANAGEMENT
-- ============================================================================
-- Table: NotificationChannel
CREATE TABLE IF NOT EXISTS NotificationChannel (
    NotificationChannelID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ChannelCode VARCHAR(30) NOT NULL UNIQUE,
    ChannelName VARCHAR(100) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: NotificationType
CREATE TABLE IF NOT EXISTS NotificationType (
    NotificationTypeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TypeCode VARCHAR(50) NOT NULL UNIQUE,
    TypeName VARCHAR(150) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: NotificationTemplate
CREATE TABLE IF NOT EXISTS NotificationTemplate (
    NotificationTemplateID BIGINT AUTO_INCREMENT PRIMARY KEY,
    NotificationTypeID BIGINT NOT NULL,
    NotificationChannelID BIGINT NOT NULL,
    TemplateCode VARCHAR(50) NOT NULL UNIQUE,
    TemplateSubject VARCHAR(250) NULL,
    TemplateBody TEXT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_ntemplate_type FOREIGN KEY (NotificationTypeID) REFERENCES NotificationType(NotificationTypeID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ntemplate_channel FOREIGN KEY (NotificationChannelID) REFERENCES NotificationChannel(NotificationChannelID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Notification
CREATE TABLE IF NOT EXISTS Notification (
    NotificationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    NotificationTypeID BIGINT NOT NULL,
    Title VARCHAR(250) NOT NULL,
    MessageText VARCHAR(2000) NOT NULL,
    TriggeredByTable VARCHAR(100) NULL,
    TriggeredByID BIGINT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_notif_type FOREIGN KEY (NotificationTypeID) REFERENCES NotificationType(NotificationTypeID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: NotificationRecipient
CREATE TABLE IF NOT EXISTS NotificationRecipient (
    NotificationRecipientID BIGINT AUTO_INCREMENT PRIMARY KEY,
    NotificationID BIGINT NOT NULL,
    RecipientUserID BIGINT NOT NULL,
    NotificationChannelID BIGINT NOT NULL,
    SentDateTime DATETIME(6) NULL,
    ReadDateTime DATETIME(6) NULL,
    DeliveryStatusCode VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    ErrorMessage VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_recipient UNIQUE(NotificationID, RecipientUserID, NotificationChannelID),
    CONSTRAINT fk_nrecip_notif FOREIGN KEY (NotificationID) REFERENCES Notification(NotificationID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_nrecip_user FOREIGN KEY (RecipientUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_nrecip_channel FOREIGN KEY (NotificationChannelID) REFERENCES NotificationChannel(NotificationChannelID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: NotificationPreference
CREATE TABLE IF NOT EXISTS NotificationPreference (
    NotificationPreferenceID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    NotificationTypeID BIGINT NOT NULL,
    NotificationChannelID BIGINT NOT NULL,
    IsEnabled TINYINT NOT NULL DEFAULT 1,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_preference UNIQUE(UserID, NotificationTypeID, NotificationChannelID),
    CONSTRAINT fk_npref_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_npref_type FOREIGN KEY (NotificationTypeID) REFERENCES NotificationType(NotificationTypeID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_npref_channel FOREIGN KEY (NotificationChannelID) REFERENCES NotificationChannel(NotificationChannelID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: NotificationQueue
CREATE TABLE IF NOT EXISTS NotificationQueue (
    NotificationQueueID BIGINT AUTO_INCREMENT PRIMARY KEY,
    NotificationRecipientID BIGINT NOT NULL,
    RetryCount INT NOT NULL DEFAULT 0,
    ScheduledDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    Status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_nqueue_recipient FOREIGN KEY (NotificationRecipientID) REFERENCES NotificationRecipient(NotificationRecipientID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: NotificationHistory
CREATE TABLE IF NOT EXISTS NotificationHistory (
    NotificationHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    NotificationRecipientID BIGINT NOT NULL,
    DeliveryAttempts INT NOT NULL DEFAULT 1,
    StatusReport VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_nhist_recipient FOREIGN KEY (NotificationRecipientID) REFERENCES NotificationRecipient(NotificationRecipientID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: NotificationStatus
CREATE TABLE IF NOT EXISTS NotificationStatus (
    NotificationStatusID BIGINT AUTO_INCREMENT PRIMARY KEY,
    StatusCode VARCHAR(30) NOT NULL UNIQUE,
    StatusName VARCHAR(100) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: PushSubscription
CREATE TABLE IF NOT EXISTS PushSubscription (
    PushSubscriptionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    EndpointUrl TEXT NOT NULL,
    AuthKey VARCHAR(255) NOT NULL,
    P256dhKey VARCHAR(255) NOT NULL,
    DeviceModel VARCHAR(100) NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_psub_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: EmailLog
CREATE TABLE IF NOT EXISTS EmailLog (
    EmailLogID BIGINT AUTO_INCREMENT PRIMARY KEY,
    RecipientEmail VARCHAR(250) NOT NULL,
    Subject VARCHAR(250) NOT NULL,
    SentDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    DeliveryStatus VARCHAR(30) NOT NULL,
    ServerResponse VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SMSLog
CREATE TABLE IF NOT EXISTS SMSLog (
    SMSLogID BIGINT AUTO_INCREMENT PRIMARY KEY,
    RecipientPhone VARCHAR(50) NOT NULL,
    MessageBody VARCHAR(500) NOT NULL,
    SentDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    DeliveryStatus VARCHAR(30) NOT NULL,
    GatewayResponse VARCHAR(255) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: WebhookNotification
CREATE TABLE IF NOT EXISTS WebhookNotification (
    WebhookNotificationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    TargetUrl TEXT NOT NULL,
    PayloadFormat VARCHAR(30) NOT NULL DEFAULT 'JSON',
    SecretToken VARCHAR(100) NULL,
    TriggerEvent VARCHAR(100) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_webhook_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: BroadcastNotification
CREATE TABLE IF NOT EXISTS BroadcastNotification (
    BroadcastNotificationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BusinessParkID BIGINT NOT NULL,
    Title VARCHAR(250) NOT NULL,
    MessageBody TEXT NOT NULL,
    StartDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    EndDate DATETIME(6) NULL,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_broadcast_park FOREIGN KEY (BusinessParkID) REFERENCES BusinessPark(BusinessParkID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 17: AUDIT & COMPLIANCE MANAGEMENT
-- ============================================================================
-- Table: AuditAction
CREATE TABLE IF NOT EXISTS AuditAction (
    AuditActionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ActionCode VARCHAR(50) NOT NULL UNIQUE,
    ActionName VARCHAR(100) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AuditEntity
CREATE TABLE IF NOT EXISTS AuditEntity (
    AuditEntityID BIGINT AUTO_INCREMENT PRIMARY KEY,
    EntityName VARCHAR(100) NOT NULL UNIQUE,
    TableName VARCHAR(100) NOT NULL UNIQUE,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AuditLog
CREATE TABLE IF NOT EXISTS AuditLog (
    AuditLogID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    UserID BIGINT NULL,
    AuditActionID BIGINT NOT NULL,
    AuditEntityID BIGINT NOT NULL,
    RecordID BIGINT NOT NULL,
    IPAddress VARCHAR(50) NULL,
    UserAgent VARCHAR(255) NULL,
    AuditDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_auditlog_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_auditlog_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_auditlog_action FOREIGN KEY (AuditActionID) REFERENCES AuditAction(AuditActionID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_auditlog_entity FOREIGN KEY (AuditEntityID) REFERENCES AuditEntity(AuditEntityID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: AuditFieldChange
CREATE TABLE IF NOT EXISTS AuditFieldChange (
    AuditFieldChangeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AuditLogID BIGINT NOT NULL,
    FieldName VARCHAR(100) NOT NULL,
    OldValue TEXT NULL,
    NewValue TEXT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_fieldchange_log FOREIGN KEY (AuditLogID) REFERENCES AuditLog(AuditLogID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: LoginAudit
CREATE TABLE IF NOT EXISTS LoginAudit (
    LoginAuditID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserAccountID BIGINT NOT NULL,
    AttemptDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IPAddress VARCHAR(50) NULL,
    UserAgent VARCHAR(255) NULL,
    LoginStatus VARCHAR(30) NOT NULL,
    Details VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_loginaudit_account FOREIGN KEY (UserAccountID) REFERENCES UserAccount(UserAccountID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SecurityEvent
CREATE TABLE IF NOT EXISTS SecurityEvent (
    SecurityEventID BIGINT AUTO_INCREMENT PRIMARY KEY,
    EventTypeCode VARCHAR(50) NOT NULL,
    EventName VARCHAR(150) NOT NULL,
    Severity VARCHAR(30) NOT NULL,
    DetailsText TEXT NOT NULL,
    IPAddress VARCHAR(50) NULL,
    UserID BIGINT NULL,
    EventDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_secevent_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: CompliancePolicy
CREATE TABLE IF NOT EXISTS CompliancePolicy (
    CompliancePolicyID BIGINT AUTO_INCREMENT PRIMARY KEY,
    PolicyCode VARCHAR(50) NOT NULL UNIQUE,
    PolicyName VARCHAR(150) NOT NULL,
    Description TEXT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ComplianceAssessment
CREATE TABLE IF NOT EXISTS ComplianceAssessment (
    ComplianceAssessmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CompliancePolicyID BIGINT NOT NULL,
    AssessorUserID BIGINT NOT NULL,
    AssessmentDate DATE NOT NULL,
    ComplianceScore DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    FindingsNotes TEXT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_assessment_policy FOREIGN KEY (CompliancePolicyID) REFERENCES CompliancePolicy(CompliancePolicyID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_assessment_assessor FOREIGN KEY (AssessorUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ComplianceViolation
CREATE TABLE IF NOT EXISTS ComplianceViolation (
    ComplianceViolationID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CompliancePolicyID BIGINT NOT NULL,
    TenantID BIGINT NULL,
    Description TEXT NOT NULL,
    Severity VARCHAR(30) NOT NULL,
    Status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    ReportedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ResolvedDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_violation_policy FOREIGN KEY (CompliancePolicyID) REFERENCES CompliancePolicy(CompliancePolicyID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_violation_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: RiskAssessment
CREATE TABLE IF NOT EXISTS RiskAssessment (
    RiskAssessmentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BusinessParkID BIGINT NOT NULL,
    RiskCategory VARCHAR(100) NOT NULL,
    RiskDescription TEXT NOT NULL,
    ProbabilityScore INT NOT NULL CHECK (ProbabilityScore BETWEEN 1 AND 5),
    ImpactScore INT NOT NULL CHECK (ImpactScore BETWEEN 1 AND 5),
    MitigationPlan TEXT NULL,
    AssessmentDate DATE NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_risk_park FOREIGN KEY (BusinessParkID) REFERENCES BusinessPark(BusinessParkID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DataAccessLog
CREATE TABLE IF NOT EXISTS DataAccessLog (
    DataAccessLogID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    AccessedTableName VARCHAR(100) NOT NULL,
    AccessedRecordID BIGINT NOT NULL,
    AccessDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IPAddress VARCHAR(50) NULL,
    ReasonCode VARCHAR(50) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_datalog_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ImpersonationAudit
CREATE TABLE IF NOT EXISTS ImpersonationAudit (
    ImpersonationAuditID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AdminUserID BIGINT NOT NULL,
    TargetUserID BIGINT NOT NULL,
    StartDateTime DATETIME(6) NOT NULL,
    EndDateTime DATETIME(6) NULL,
    ActionSummary TEXT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_impaudit_admin FOREIGN KEY (AdminUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_impaudit_target FOREIGN KEY (TargetUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: DigitalSignature
CREATE TABLE IF NOT EXISTS DigitalSignature (
    DigitalSignatureID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    SignedDocumentID BIGINT NOT NULL,
    SignatureHash VARCHAR(256) NOT NULL,
    PublicKeyUsed TEXT NOT NULL,
    SignedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_signature_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_signature_document FOREIGN KEY (SignedDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: WORMArchive
CREATE TABLE IF NOT EXISTS WORMArchive (
    WORMArchiveID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CentralDocumentID BIGINT NOT NULL UNIQUE,
    ArchivedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    LockedUntilDateTime DATETIME(6) NOT NULL,
    RetentionPolicyCode VARCHAR(50) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_worm_document FOREIGN KEY (CentralDocumentID) REFERENCES CentralDocument(CentralDocumentID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 19: SYSTEM ADMINISTRATION
-- ============================================================================
-- Table: SystemHealth
CREATE TABLE IF NOT EXISTS SystemHealth (
    SystemHealthID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ComponentCode VARCHAR(50) NOT NULL,
    ComponentName VARCHAR(100) NOT NULL,
    HealthStatus VARCHAR(30) NOT NULL DEFAULT 'HEALTHY',
    LastCheckDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    MetricsJson JSON NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServerNode
CREATE TABLE IF NOT EXISTS ServerNode (
    ServerNodeID BIGINT AUTO_INCREMENT PRIMARY KEY,
    NodeCode VARCHAR(50) NOT NULL UNIQUE,
    NodeIPAddress VARCHAR(50) NOT NULL,
    NodeStatus VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    LastHeartbeatDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ServiceInstance
CREATE TABLE IF NOT EXISTS ServiceInstance (
    ServiceInstanceID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ServerNodeID BIGINT NOT NULL,
    ServiceName VARCHAR(100) NOT NULL,
    InstancePort INT NOT NULL,
    InstanceStatus VARCHAR(30) NOT NULL DEFAULT 'RUNNING',
    LastHeartbeatDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_instance_node FOREIGN KEY (ServerNodeID) REFERENCES ServerNode(ServerNodeID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SystemJob
CREATE TABLE IF NOT EXISTS SystemJob (
    SystemJobID BIGINT AUTO_INCREMENT PRIMARY KEY,
    JobCode VARCHAR(50) NOT NULL UNIQUE,
    JobName VARCHAR(150) NOT NULL,
    CronExpression VARCHAR(50) NOT NULL,
    JobType VARCHAR(50) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ScheduledJob
CREATE TABLE IF NOT EXISTS ScheduledJob (
    ScheduledJobID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SystemJobID BIGINT NOT NULL,
    ScheduledDateTime DATETIME(6) NOT NULL,
    JobStatus VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_sjob_job FOREIGN KEY (SystemJobID) REFERENCES SystemJob(SystemJobID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: JobExecution
CREATE TABLE IF NOT EXISTS JobExecution (
    JobExecutionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ScheduledJobID BIGINT NOT NULL,
    ExecutionStartDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ExecutionEndDateTime DATETIME(6) NULL,
    ExecutionStatus VARCHAR(30) NOT NULL,
    ErrorMessage TEXT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_exec_sjob FOREIGN KEY (ScheduledJobID) REFERENCES ScheduledJob(ScheduledJobID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: BackupJob
CREATE TABLE IF NOT EXISTS BackupJob (
    BackupJobID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BackupCode VARCHAR(50) NOT NULL UNIQUE,
    BackupName VARCHAR(150) NOT NULL,
    CronSchedule VARCHAR(50) NOT NULL,
    BackupStoragePath VARCHAR(500) NOT NULL,
    BackupRetentionDays INT NOT NULL DEFAULT 30,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: BackupHistory
CREATE TABLE IF NOT EXISTS BackupHistory (
    BackupHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BackupJobID BIGINT NOT NULL,
    ExecutionDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    BackupFileSizeBytes BIGINT NOT NULL,
    BackupFileName VARCHAR(250) NOT NULL,
    BackupStatus VARCHAR(30) NOT NULL,
    ErrorMessage TEXT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_bhistory_job FOREIGN KEY (BackupJobID) REFERENCES BackupJob(BackupJobID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: RestoreHistory
CREATE TABLE IF NOT EXISTS RestoreHistory (
    RestoreHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    BackupHistoryID BIGINT NOT NULL,
    RestoreDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    TriggeredByUserID BIGINT NOT NULL,
    RestoreStatus VARCHAR(30) NOT NULL,
    LogOutput TEXT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_rhistory_backup FOREIGN KEY (BackupHistoryID) REFERENCES BackupHistory(BackupHistoryID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_rhistory_user FOREIGN KEY (TriggeredByUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: License
CREATE TABLE IF NOT EXISTS License (
    LicenseID BIGINT AUTO_INCREMENT PRIMARY KEY,
    LicenseKey VARCHAR(255) NOT NULL UNIQUE,
    LicenseTypeCode VARCHAR(50) NOT NULL,
    MaxTenantsLimit INT NOT NULL DEFAULT 80,
    IssuedDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    Status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SystemVersion
CREATE TABLE IF NOT EXISTS SystemVersion (
    SystemVersionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    VersionNumber VARCHAR(50) NOT NULL UNIQUE,
    ReleaseDate DATE NOT NULL,
    ReleaseNotesHTML TEXT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Deployment
CREATE TABLE IF NOT EXISTS Deployment (
    DeploymentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SystemVersionID BIGINT NOT NULL,
    DeployedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    EnvironmentName VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
    DeploymentStatus VARCHAR(30) NOT NULL,
    TriggeredByUserID BIGINT NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_deploy_version FOREIGN KEY (SystemVersionID) REFERENCES SystemVersion(SystemVersionID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_deploy_user FOREIGN KEY (TriggeredByUserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: MaintenanceWindow
CREATE TABLE IF NOT EXISTS MaintenanceWindow (
    MaintenanceWindowID BIGINT AUTO_INCREMENT PRIMARY KEY,
    WindowName VARCHAR(150) NOT NULL,
    StartDateTime DATETIME(6) NOT NULL,
    EndDateTime DATETIME(6) NOT NULL,
    PlatformOffline TINYINT NOT NULL DEFAULT 1,
    Description VARCHAR(1000) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: APIClient
CREATE TABLE IF NOT EXISTS APIClient (
    APIClientID BIGINT AUTO_INCREMENT PRIMARY KEY,
    ClientName VARCHAR(150) NOT NULL,
    ClientID VARCHAR(100) NOT NULL UNIQUE,
    ClientSecretHash VARCHAR(255) NOT NULL,
    AllowedIPAddresses VARCHAR(500) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: APIAccessLog
CREATE TABLE IF NOT EXISTS APIAccessLog (
    APIAccessLogID BIGINT AUTO_INCREMENT PRIMARY KEY,
    APIClientID BIGINT NOT NULL,
    EndpointUrl VARCHAR(500) NOT NULL,
    HttpMethod VARCHAR(10) NOT NULL,
    IPAddress VARCHAR(50) NULL,
    ResponseStatusCode INT NOT NULL,
    ExecutionDurationMs INT NOT NULL,
    AccessDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_apilog_client FOREIGN KEY (APIClientID) REFERENCES APIClient(APIClientID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 23: ENTERPRISE SEARCH MANAGEMENT
-- ============================================================================
-- Table: SearchIndex
CREATE TABLE IF NOT EXISTS SearchIndex (
    SearchIndexID BIGINT AUTO_INCREMENT PRIMARY KEY,
    IndexCode VARCHAR(50) NOT NULL UNIQUE,
    IndexName VARCHAR(150) NOT NULL,
    TargetTableName VARCHAR(100) NOT NULL,
    IsIncremental TINYINT NOT NULL DEFAULT 1,
    LastIndexedDateTime DATETIME(6) NULL,
    IndexingFrequencyCode VARCHAR(30) NOT NULL DEFAULT 'REALTIME', -- REALTIME, HOURLY, DAILY
    IndexConfigurationJson JSON NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_index_freq CHECK (IndexingFrequencyCode IN ('REALTIME', 'HOURLY', 'DAILY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SearchCategory
CREATE TABLE IF NOT EXISTS SearchCategory (
    SearchCategoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CategoryCode VARCHAR(50) NOT NULL UNIQUE,
    CategoryName VARCHAR(150) NOT NULL,
    Description VARCHAR(500) NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SearchDocument
CREATE TABLE IF NOT EXISTS SearchDocument (
    SearchDocumentID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SearchIndexID BIGINT NOT NULL,
    SearchCategoryID BIGINT NOT NULL,
    TenantID BIGINT NULL,
    EntityRecordID BIGINT NOT NULL,
    DocumentTitle VARCHAR(250) NOT NULL,
    DocumentContent TEXT NOT NULL,
    MetadataJson JSON NULL,
    BoostFactor DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    LastUpdatedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_sdoc_index FOREIGN KEY (SearchIndexID) REFERENCES SearchIndex(SearchIndexID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_sdoc_category FOREIGN KEY (SearchCategoryID) REFERENCES SearchCategory(SearchCategoryID) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_sdoc_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SearchFilter
CREATE TABLE IF NOT EXISTS SearchFilter (
    SearchFilterID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SearchCategoryID BIGINT NOT NULL,
    FilterCode VARCHAR(50) NOT NULL,
    FilterLabel VARCHAR(100) NOT NULL,
    FilterField VARCHAR(100) NOT NULL,
    FilterType VARCHAR(30) NOT NULL DEFAULT 'TERM', -- TERM, RANGE, MULTIVALUE
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_search_filter UNIQUE(SearchCategoryID, FilterCode),
    CONSTRAINT chk_filter_type CHECK (FilterType IN ('TERM', 'RANGE', 'MULTIVALUE')),
    CONSTRAINT fk_sfilter_category FOREIGN KEY (SearchCategoryID) REFERENCES SearchCategory(SearchCategoryID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SearchHistory
CREATE TABLE IF NOT EXISTS SearchHistory (
    SearchHistoryID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    UserID BIGINT NULL,
    SearchQuery VARCHAR(255) NOT NULL,
    SearchFiltersUsedJson JSON NULL,
    SearchedDateTime DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ResultCount INT NOT NULL DEFAULT 0,
    ExecutionTimeMs INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_shistory_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_shistory_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SavedSearch
CREATE TABLE IF NOT EXISTS SavedSearch (
    SavedSearchID BIGINT AUTO_INCREMENT PRIMARY KEY,
    UserID BIGINT NOT NULL,
    SearchName VARCHAR(150) NOT NULL,
    SearchQuery VARCHAR(255) NOT NULL,
    FiltersJson JSON NULL,
    IsAlertEnabled TINYINT NOT NULL DEFAULT 0,
    AlertFrequencyCode VARCHAR(30) NOT NULL DEFAULT 'IMMEDIATE', -- IMMEDIATE, DAILY, WEEKLY
    LastAlertSentDateTime DATETIME(6) NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_saved_alert_freq CHECK (AlertFrequencyCode IN ('IMMEDIATE', 'DAILY', 'WEEKLY')),
    CONSTRAINT fk_savedsearch_user FOREIGN KEY (UserID) REFERENCES `User`(UserID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SearchSuggestion
CREATE TABLE IF NOT EXISTS SearchSuggestion (
    SearchSuggestionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    SuggestionText VARCHAR(255) NOT NULL,
    SearchCount INT NOT NULL DEFAULT 1,
    IsPromoted TINYINT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_tenant_suggestion UNIQUE(TenantID, SuggestionText),
    CONSTRAINT fk_ssugg_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SearchAnalytics
CREATE TABLE IF NOT EXISTS SearchAnalytics (
    SearchAnalyticsID BIGINT AUTO_INCREMENT PRIMARY KEY,
    TenantID BIGINT NULL,
    DateOnly DATE NOT NULL,
    SearchQuery VARCHAR(255) NOT NULL,
    TotalQueries INT NOT NULL DEFAULT 1,
    ZeroResultsCount INT NOT NULL DEFAULT 0,
    ClickedCount INT NOT NULL DEFAULT 0,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_search_query_day UNIQUE(TenantID, DateOnly, SearchQuery),
    CONSTRAINT fk_sanalytics_tenant FOREIGN KEY (TenantID) REFERENCES Tenant(TenantID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SearchResultCache
CREATE TABLE IF NOT EXISTS SearchResultCache (
    SearchResultCacheID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SearchQueryHash VARCHAR(64) NOT NULL UNIQUE,
    CachedResultJson JSON NOT NULL,
    ExpiryDateTime DATETIME(6) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: SearchPermission
CREATE TABLE IF NOT EXISTS SearchPermission (
    SearchPermissionID BIGINT AUTO_INCREMENT PRIMARY KEY,
    SearchDocumentID BIGINT NOT NULL,
    RoleID BIGINT NOT NULL,
    IsAllowed TINYINT NOT NULL DEFAULT 1,
    IsActive TINYINT NOT NULL DEFAULT 1,
    IsDeleted TINYINT NOT NULL DEFAULT 0,
    CreatedBy BIGINT NOT NULL,
    CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ModifiedBy BIGINT NULL,
    ModifiedDate DATETIME(6) NULL,
    DeletedBy BIGINT NULL,
    DeletedDate DATETIME(6) NULL,
    RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_sperm UNIQUE(SearchDocumentID, RoleID),
    CONSTRAINT fk_sperm_sdoc FOREIGN KEY (SearchDocumentID) REFERENCES SearchDocument(SearchDocumentID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_sperm_role FOREIGN KEY (RoleID) REFERENCES `Role`(RoleID) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_message_convo ON Message(ConversationID);
CREATE INDEX idx_sla_clocks_stage ON SLAClock(SLAStageID);
CREATE INDEX idx_kb_version_article ON KnowledgeVersion(KnowledgeArticleID);
CREATE INDEX idx_message_sender ON Message(SenderUserID);
CREATE INDEX idx_lookup_values_type ON LookupValue(LookupTypeID);
CREATE INDEX idx_deployment_user ON Deployment(TriggeredByUserID);
CREATE INDEX idx_audit_log_record ON AuditLog(RecordID);
CREATE INDEX idx_assets_status ON Asset(AssetStatusCode);
CREATE INDEX idx_asset_warranty_asset ON AssetWarranty(AssetID);
CREATE INDEX idx_convo_part_user ON ConversationParticipant(UserID);
CREATE INDEX idx_discussion_group_tenant ON DiscussionGroup(TenantID);
CREATE INDEX idx_holidays_cal ON HolidayCalendar(BusinessCalendarID);
CREATE INDEX idx_audit_log_tenant ON AuditLog(TenantID);
CREATE INDEX idx_email_queue_status ON EmailQueue(Status);
CREATE INDEX idx_sla_history_clock ON SLAHistory(SLAClockID);
CREATE INDEX idx_attachment_doc ON Attachment(CentralDocumentID);
CREATE INDEX idx_kb_attach_article ON KnowledgeAttachment(KnowledgeArticleID);
CREATE INDEX idx_conversation_issuereq ON Conversation(ReferenceIssueRequestID);
CREATE INDEX idx_maint_schedule_plan ON MaintenanceSchedule(AssetMaintenancePlanID);
CREATE INDEX idx_sla_clocks_status ON SLAClock(ClockStatus);
CREATE INDEX idx_article_rel_source ON RelatedArticle(ArticleID);
CREATE INDEX idx_shistory_query ON SearchHistory(SearchQuery);
CREATE INDEX idx_notif_recip_notif ON NotificationRecipient(NotificationID);
CREATE INDEX idx_job_execution_sched ON JobExecution(ScheduledJobID);
CREATE INDEX idx_kb_view_article ON KnowledgeView(KnowledgeArticleID);
CREATE INDEX idx_kb_article_author ON KnowledgeArticle(AuthorUserID);
CREATE INDEX idx_asset_spare_asset ON AssetSparePart(AssetID);
CREATE INDEX idx_file_storage_doc ON FileStorage(CentralDocumentID);
CREATE INDEX idx_notif_pref_type ON NotificationPreference(NotificationTypeID);
CREATE INDEX idx_deployment_version ON Deployment(SystemVersionID);
CREATE INDEX idx_kb_approval_article ON KnowledgeApproval(KnowledgeArticleID);
CREATE INDEX idx_kb_feedback_article ON KnowledgeFeedback(KnowledgeArticleID);
CREATE INDEX idx_notif_template_type ON NotificationTemplate(NotificationTypeID);
CREATE INDEX idx_backup_history_job ON BackupHistory(BackupJobID);
CREATE INDEX idx_doc_approval_app ON DocumentApproval(ApprovalID);
CREATE INDEX idx_notif_type ON Notification(NotificationTypeID);
CREATE INDEX idx_compliance_assess_policy ON ComplianceAssessment(CompliancePolicyID);
CREATE INDEX idx_sdoc_entity ON SearchDocument(EntityRecordID);
CREATE INDEX idx_notif_queue_recip ON NotificationQueue(NotificationRecipientID);
CREATE INDEX idx_folder_parent ON DocumentFolder(ParentFolderID);
CREATE INDEX idx_security_event_user ON SecurityEvent(UserID);
CREATE INDEX idx_push_sub_user ON PushSubscription(UserID);
CREATE INDEX idx_signature_doc ON DigitalSignature(SignedDocumentID);
CREATE INDEX idx_doc_share_tenant ON DocumentShare(SharedWithTenantID);
CREATE INDEX idx_announcement_park ON Announcement(BusinessParkID);
CREATE INDEX idx_assets_office ON Asset(OfficeSpaceID);
CREATE INDEX idx_language_resources_locale ON LanguageResource(LocalizationID);
CREATE INDEX idx_group_member_user ON GroupMember(UserID);
CREATE INDEX idx_scache_expiry ON SearchResultCache(ExpiryDateTime);
CREATE INDEX idx_file_audit_doc ON FileAudit(CentralDocumentID);
CREATE INDEX idx_assets_tenant ON Asset(TenantID);
CREATE INDEX idx_audit_log_user ON AuditLog(UserID);
CREATE INDEX idx_sms_queue_status ON SMSQueue(Status);
CREATE INDEX idx_sys_settings_cat ON SystemSetting(ConfigurationCategoryID);
CREATE INDEX idx_notif_queue_status ON NotificationQueue(Status);
CREATE INDEX idx_sdoc_boost ON SearchDocument(BoostFactor);
CREATE INDEX idx_compliance_violation_tenant ON ComplianceViolation(TenantID);
CREATE INDEX idx_maint_history_asset ON MaintenanceHistory(AssetID);
CREATE INDEX idx_kb_rating_article ON KnowledgeRating(KnowledgeArticleID);
CREATE INDEX idx_impersonation_audit_target ON ImpersonationAudit(TargetUserID);
CREATE INDEX idx_sperm_role ON SearchPermission(RoleID);
CREATE INDEX idx_attach_ref_target ON AttachmentReference(TargetTableName, TargetID);
CREATE INDEX idx_escalation_history_issuereq ON EscalationHistory(IssueRequestID);
CREATE INDEX idx_notif_pref_user ON NotificationPreference(UserID);
CREATE INDEX idx_sfilter_category ON SearchFilter(SearchCategoryID);
CREATE INDEX idx_asset_qr_asset ON AssetQRCode(AssetID);
CREATE INDEX idx_sdoc_tenant ON SearchDocument(TenantID);
CREATE INDEX idx_escalation_recip_rule ON EscalationRecipient(EscalationRuleID);
CREATE INDEX idx_tenant_settings_tenant ON TenantSetting(TenantID);
CREATE INDEX idx_doc_permission_folder ON DocumentPermission(DocumentFolderID);
CREATE INDEX idx_kb_tag_article ON KnowledgeTag(KnowledgeArticleID);
CREATE INDEX idx_asset_models_mfg ON AssetModel(AssetManufacturerID);
CREATE INDEX idx_service_instance_node ON ServiceInstance(ServerNodeID);
CREATE INDEX idx_savedsearch_user ON SavedSearch(UserID);
CREATE INDEX idx_scheduled_job_job ON ScheduledJob(SystemJobID);
CREATE INDEX idx_asset_movement_asset ON AssetMovement(AssetID);
CREATE INDEX idx_assets_type ON Asset(AssetTypeID);
CREATE INDEX idx_signature_user ON DigitalSignature(UserID);
CREATE INDEX idx_restore_history_user ON RestoreHistory(TriggeredByUserID);
CREATE INDEX idx_article_rel_target ON RelatedArticle(RelatedToArticleID);
CREATE INDEX idx_convo_part_convo ON ConversationParticipant(ConversationID);
CREATE INDEX idx_folder_tenant ON DocumentFolder(TenantID);
CREATE INDEX idx_notif_history_recip ON NotificationHistory(NotificationRecipientID);
CREATE INDEX idx_asset_models_cat ON AssetModel(AssetCategoryID);
CREATE INDEX idx_asset_failure_asset ON AssetFailure(AssetID);
CREATE INDEX idx_sla_stage_policy ON SLAStage(SLAPolicyID);
CREATE INDEX idx_audit_log_action ON AuditLog(AuditActionID);
CREATE INDEX idx_announcement_tenant ON Announcement(TargetTenantID);
CREATE INDEX idx_kb_cat_tenant ON KnowledgeCategory(TenantID);
CREATE INDEX idx_doc_version_doc ON DocumentVersion(CentralDocumentID);
CREATE INDEX idx_notif_recip_channel ON NotificationRecipient(NotificationChannelID);
CREATE INDEX idx_impersonation_audit_admin ON ImpersonationAudit(AdminUserID);
CREATE INDEX idx_api_access_client ON APIAccessLog(APIClientID);
CREATE INDEX idx_ssugg_text ON SearchSuggestion(SuggestionText);
CREATE INDEX idx_sperm_sdoc ON SearchPermission(SearchDocumentID);
CREATE INDEX idx_conversation_tenant ON Conversation(TenantID);
CREATE INDEX idx_kb_article_status ON KnowledgeArticle(ArticleStatusCode);
CREATE INDEX idx_sla_breach_clock ON SLABreach(SLAClockID);
CREATE INDEX idx_login_audit_account ON LoginAudit(UserAccountID);
CREATE INDEX idx_data_access_user ON DataAccessLog(UserID);
CREATE INDEX idx_notif_recip_user ON NotificationRecipient(RecipientUserID);
CREATE INDEX idx_broadcast_notif_park ON BroadcastNotification(BusinessParkID);
CREATE INDEX idx_doc_approval_doc ON DocumentApproval(CentralDocumentID);
CREATE INDEX idx_doc_share_user ON DocumentShare(SharedWithUserID);
CREATE INDEX idx_email_msg_issuereq ON EmailMessage(RequestID);
CREATE INDEX idx_kb_article_cat ON KnowledgeArticle(KnowledgeCategoryID);
CREATE INDEX idx_comms_log_tenant ON CommunicationLog(TenantID);
CREATE INDEX idx_notif_template_channel ON NotificationTemplate(NotificationChannelID);
CREATE INDEX idx_internal_note_issuereq ON InternalNote(RequestID);
CREATE INDEX idx_restore_history_backup ON RestoreHistory(BackupHistoryID);
CREATE INDEX idx_doc_tag_doc ON DocumentTag(CentralDocumentID);
CREATE INDEX idx_sanalytics_date ON SearchAnalytics(DateOnly);
CREATE INDEX idx_sanalytics_tenant ON SearchAnalytics(TenantID);
CREATE INDEX idx_escalation_rules_stage ON EscalationRule(SLAStageID);
CREATE INDEX idx_audit_log_entity ON AuditLog(AuditEntityID);
CREATE INDEX idx_webhook_tenant ON WebhookNotification(TenantID);
CREATE INDEX idx_asset_maint_plan_asset ON AssetMaintenancePlan(AssetID);
CREATE INDEX idx_asset_document_asset ON AssetDocument(AssetID);
CREATE INDEX idx_asset_spare_part ON AssetSparePart(SparePartID);
CREATE INDEX idx_risk_assess_park ON RiskAssessment(BusinessParkID);
CREATE INDEX idx_doc_permission_doc ON DocumentPermission(CentralDocumentID);
CREATE INDEX idx_maint_history_issuereq ON MaintenanceHistory(IssueRequestID);
CREATE INDEX idx_sla_policy_cal ON SLAPolicy(BusinessCalendarID);
CREATE INDEX idx_asset_downtime_asset ON AssetDowntime(AssetID);
CREATE INDEX idx_asset_rel_child ON AssetRelationship(ChildAssetID);
CREATE INDEX idx_msg_read_msg ON MessageRead(MessageID);
CREATE INDEX idx_audit_field_changes_log ON AuditFieldChange(AuditLogID);
CREATE INDEX idx_asset_inspection_asset ON AssetInspection(AssetID);
CREATE INDEX idx_kb_section_article ON KnowledgeSection(KnowledgeArticleID);
CREATE INDEX idx_working_hours_cal ON WorkingHour(BusinessCalendarID);
CREATE INDEX idx_maint_checklist_plan ON MaintenanceChecklist(AssetMaintenancePlanID);
CREATE INDEX idx_sdoc_category ON SearchDocument(SearchCategoryID);
CREATE INDEX idx_faq_tenant ON FAQ(TenantID);
CREATE INDEX idx_assets_model ON Asset(AssetModelID);
CREATE INDEX idx_doc_share_doc ON DocumentShare(CentralDocumentID);
CREATE INDEX idx_doc_version_storage ON DocumentVersion(FileStorageID);
CREATE INDEX idx_attach_ref_attachment ON AttachmentReference(AttachmentID);
CREATE INDEX idx_doc_permission_role ON DocumentPermission(RoleID);
CREATE INDEX idx_file_audit_user ON FileAudit(UserID);
CREATE INDEX idx_compliance_violation_policy ON ComplianceViolation(CompliancePolicyID);
CREATE INDEX idx_sdoc_index ON SearchDocument(SearchIndexID);
CREATE INDEX idx_msg_attach_msg ON MessageAttachment(MessageID);
CREATE INDEX idx_group_member_group ON GroupMember(DiscussionGroupID);
CREATE INDEX idx_sla_clocks_issuereq ON SLAClock(IssueRequestID);
CREATE INDEX idx_asset_rel_parent ON AssetRelationship(ParentAssetID);
CREATE INDEX idx_maint_history_schedule ON MaintenanceHistory(MaintenanceScheduleID);
CREATE INDEX idx_shistory_tenant ON SearchHistory(TenantID);
CREATE INDEX idx_kb_cat_parent ON KnowledgeCategory(ParentCategoryID);
CREATE INDEX idx_shistory_user ON SearchHistory(UserID);
CREATE INDEX idx_ssugg_tenant ON SearchSuggestion(TenantID);

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

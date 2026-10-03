import db from '../../../database/connection.js';
import lookupTypeRepository from '../repositories/lookupType.repository.js';

class BootstrapService {
  async getBootstrapData() {
    const [
      industries,
      tenantTypes,
      officeTypes,
      serviceTypes,
      serviceLevels,
      timezones,
      currencies,
      statuses,
      priorities,
      featureFlags,
      configurationCategories
    ] = await Promise.all([
      db.query(`SELECT IndustryID, IndustryCode, IndustryName FROM Industry WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY IndustryName`),
      db.query(`SELECT TenantTypeID, TenantTypeCode, TenantTypeName FROM TenantType WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY TenantTypeName`),
      db.query(`SELECT OfficeTypeID, OfficeTypeCode, OfficeTypeName FROM OfficeType WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY OfficeTypeName`),
      db.query(`SELECT ServiceTypeID, ServiceTypeCode, ServiceTypeName FROM ServiceType WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY ServiceTypeName`),
      db.query(`SELECT ServiceLevelID, ServiceLevelCode, ServiceLevelName FROM ServiceLevel WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY ServiceLevelName`),
      db.query(`SELECT TimeZoneID, TimeZoneCode, DisplayName, UtcOffsetMinutes FROM TimeZone WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY DisplayName`),
      db.query(`SELECT CurrencyID, CurrencyCode, CurrencyName, Symbol FROM Currency WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY CurrencyName`),
      db.query(`SELECT StatusDefinitionID, StatusCode, StatusName, EntityName FROM StatusDefinition WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY EntityName, StatusName`),
      db.query(`SELECT PriorityDefinitionID, PriorityCode, PriorityName, Weight FROM PriorityDefinition WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY Weight DESC`),
      db.query(`SELECT FlagCode, FlagName, IsEnabled FROM FeatureFlag WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY FlagName`),
      db.query(`SELECT ConfigurationCategoryID, CategoryCode, CategoryName FROM ConfigurationCategory WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY CategoryName`)
    ]);

    const lookupTypes = await db.query(
      `SELECT LookupTypeID, LookupTypeCode, LookupTypeName FROM LookupType WHERE IsDeleted = 0 AND IsActive = 1 ORDER BY LookupTypeName`
    );

    const lookups = {};
    for (const type of lookupTypes) {
      lookups[type.LookupTypeCode] = await lookupTypeRepository.findValuesByTypeId(type.LookupTypeID, true);
    }

    const issueStatuses = statuses.filter((s) => s.EntityName === 'IssueRequest');
    const enabledFlags = Object.fromEntries(featureFlags.map((f) => [f.FlagCode, Boolean(f.IsEnabled)]));

    return {
      industries,
      tenantTypes,
      officeTypes,
      serviceTypes,
      serviceLevels,
      timezones,
      currencies,
      statuses,
      issueStatuses,
      priorities,
      lookups,
      featureFlags: enabledFlags,
      configurationCategories
    };
  }
}

export default new BootstrapService();

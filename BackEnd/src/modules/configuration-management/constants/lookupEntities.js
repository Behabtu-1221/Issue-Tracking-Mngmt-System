export const LOOKUP_ENTITIES = {
  industries: {
    table: 'Industry',
    idColumn: 'IndustryID',
    codeColumn: 'IndustryCode',
    nameColumn: 'IndustryName',
    optionalFields: ['Description'],
    label: 'Industry'
  },
  'tenant-types': {
    table: 'TenantType',
    idColumn: 'TenantTypeID',
    codeColumn: 'TenantTypeCode',
    nameColumn: 'TenantTypeName',
    optionalFields: ['Description'],
    label: 'Tenant Type'
  },
  'office-types': {
    table: 'OfficeType',
    idColumn: 'OfficeTypeID',
    codeColumn: 'OfficeTypeCode',
    nameColumn: 'OfficeTypeName',
    optionalFields: ['Description'],
    label: 'Office Type'
  },
  'service-types': {
    table: 'ServiceType',
    idColumn: 'ServiceTypeID',
    codeColumn: 'ServiceTypeCode',
    nameColumn: 'ServiceTypeName',
    optionalFields: ['Description'],
    label: 'Service Type'
  },
  'service-levels': {
    table: 'ServiceLevel',
    idColumn: 'ServiceLevelID',
    codeColumn: 'ServiceLevelCode',
    nameColumn: 'ServiceLevelName',
    optionalFields: ['Description'],
    label: 'Service Level'
  },
  timezones: {
    table: 'TimeZone',
    idColumn: 'TimeZoneID',
    codeColumn: 'TimeZoneCode',
    nameColumn: 'DisplayName',
    requiredFields: ['UtcOffsetMinutes'],
    label: 'Time Zone'
  },
  currencies: {
    table: 'Currency',
    idColumn: 'CurrencyID',
    codeColumn: 'CurrencyCode',
    nameColumn: 'CurrencyName',
    requiredFields: ['Symbol'],
    label: 'Currency'
  },
  statuses: {
    table: 'StatusDefinition',
    idColumn: 'StatusDefinitionID',
    codeColumn: 'StatusCode',
    nameColumn: 'StatusName',
    requiredFields: ['EntityName'],
    label: 'Status Definition'
  },
  priorities: {
    table: 'PriorityDefinition',
    idColumn: 'PriorityDefinitionID',
    codeColumn: 'PriorityCode',
    nameColumn: 'PriorityName',
    requiredFields: ['Weight'],
    label: 'Priority Definition'
  },
  'configuration-categories': {
    table: 'ConfigurationCategory',
    idColumn: 'ConfigurationCategoryID',
    codeColumn: 'CategoryCode',
    nameColumn: 'CategoryName',
    label: 'Configuration Category'
  }
};

export const getEntityConfig = (entityKey) => LOOKUP_ENTITIES[entityKey] || null;

export const listEntityKeys = () => Object.keys(LOOKUP_ENTITIES);

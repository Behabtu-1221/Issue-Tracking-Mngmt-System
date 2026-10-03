import Joi from 'joi';

export const createParkSchema = Joi.object({
  BusinessParkCode: Joi.string().max(30).required(),
  BusinessParkName: Joi.string().max(200).required(),
  ShortName: Joi.string().max(100).allow('', null),
  Description: Joi.string().max(1000).allow('', null),
  RegistrationNumber: Joi.string().max(100).allow('', null),
  TaxIdentificationNo: Joi.string().max(100).allow('', null),
  Email: Joi.string().email().max(200).allow('', null),
  PhoneNumber: Joi.string().max(50).allow('', null),
  MobileNumber: Joi.string().max(50).allow('', null),
  Website: Joi.string().max(250).allow('', null),
  Country: Joi.string().max(100).default('Ethiopia'),
  Region: Joi.string().max(100).allow('', null),
  City: Joi.string().max(100).default('Addis Ababa'),
  SubCity: Joi.string().max(100).allow('', null),
  Woreda: Joi.string().max(100).allow('', null),
  PostalCode: Joi.string().max(20).allow('', null),
  AddressLine1: Joi.string().max(250).allow('', null),
  AddressLine2: Joi.string().max(250).allow('', null),
  Latitude: Joi.number().allow(null, '').empty(''),
  Longitude: Joi.number().allow(null, '').empty(''),
  TimeZone: Joi.string().max(100).default('UTC+3'),
  CurrencyCode: Joi.string().max(10).default('ETB'),
  LanguageCode: Joi.string().max(10).default('en'),
  LogoPath: Joi.string().max(500).allow('', null),
  TotalAreaSquareMeter: Joi.number().min(0).allow(null, '').empty(''),
  IsOperational: Joi.number().valid(0, 1).default(1),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateParkSchema = createParkSchema.fork(['BusinessParkCode', 'BusinessParkName'], (schema) => schema.optional());

export const createBuildingSchema = Joi.object({
  BusinessParkID: Joi.number().integer().required(),
  FacilityZoneID: Joi.number().integer().required(),
  BuildingCode: Joi.string().max(30).required(),
  BuildingName: Joi.string().max(200).required(),
  ShortName: Joi.string().max(100).allow('', null),
  Description: Joi.string().max(1000).allow('', null),
  TotalFloors: Joi.number().integer().min(1).default(1),
  TotalAreaSquareMeter: Joi.number().min(0).allow(null, '').empty(''),
  Latitude: Joi.number().allow(null, '').empty(''),
  Longitude: Joi.number().allow(null, '').empty(''),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateBuildingSchema = createBuildingSchema.fork(['BusinessParkID', 'FacilityZoneID', 'BuildingCode', 'BuildingName'], (schema) => schema.optional());

export const createFloorSchema = Joi.object({
  BuildingID: Joi.number().integer().required(),
  FloorNumber: Joi.number().integer().min(1).required(),
  FloorCode: Joi.string().max(20).required(),
  FloorName: Joi.string().max(100).required(),
  Description: Joi.string().max(500).allow('', null),
  TotalOfficeSpaces: Joi.number().integer().min(0).default(0),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateFloorSchema = createFloorSchema.fork(['BuildingID', 'FloorNumber', 'FloorCode', 'FloorName'], (schema) => schema.optional());

export const createOfficeSchema = Joi.object({
  FloorID: Joi.number().integer().required(),
  OfficeTypeID: Joi.number().integer().required(),
  OfficeNumber: Joi.string().max(30).required(),
  OfficeName: Joi.string().max(100).required(),
  Description: Joi.string().max(1000).allow('', null),
  SquareMeters: Joi.number().min(0).required(),
  MaxOccupancy: Joi.number().integer().min(1).allow(null, '').empty(''),
  MonthlyRentAmount: Joi.number().min(0).allow(null, '').empty(''),
  AvailabilityStatus: Joi.string().valid('VACANT', 'OCCUPIED', 'MAINTENANCE', 'RESERVED').default('VACANT'),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateOfficeSchema = createOfficeSchema.fork(['FloorID', 'OfficeTypeID', 'OfficeNumber', 'OfficeName', 'SquareMeters'], (schema) => schema.optional());

export const updateOfficeStatusSchema = Joi.object({
  status: Joi.string().valid('VACANT', 'OCCUPIED', 'MAINTENANCE', 'RESERVED').required()
});

export const createLocationSchema = Joi.object({
  BusinessParkID: Joi.number().integer().required(),
  ParentLocationID: Joi.number().integer().allow(null, '').empty(''),
  LocationCode: Joi.string().max(50).required(),
  LocationName: Joi.string().max(200).required(),
  LocationType: Joi.string().valid('CAMPUS', 'PARKING_BAY', 'BLOCK', 'TOWER', 'COMMON_ROOM').default('BLOCK').allow('', null),
  Description: Joi.string().max(1000).allow('', null),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateLocationSchema = createLocationSchema.fork(['BusinessParkID', 'LocationCode', 'LocationName'], (schema) => schema.optional());

export const createFacilityZoneSchema = Joi.object({
  BusinessParkID: Joi.number().integer().required(),
  FacilityZoneCode: Joi.string().max(30).required(),
  FacilityZoneName: Joi.string().max(150).required(),
  ZoneType: Joi.string().valid('GREEN_ZONE', 'PARKING_LOT', 'SECURITY_OFFICE', 'UTILITY_ROOM', 'OPERATIONAL').default('GREEN_ZONE').allow('', null),
  Description: Joi.string().max(1000).allow('', null),
  CapacityLimit: Joi.number().integer().min(0).allow(null, '').empty(''),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateFacilityZoneSchema = createFacilityZoneSchema.fork(['BusinessParkID', 'FacilityZoneCode', 'FacilityZoneName'], (schema) => schema.optional());

export const createFloorPlanSchema = Joi.object({
  FloorID: Joi.number().integer().required(),
  FloorPlanCode: Joi.string().max(50).required(),
  FloorPlanName: Joi.string().max(150).required(),
  FilePath: Joi.string().max(500).required(),
  MimeType: Joi.string().max(100).allow('', null),
  FileSizeKB: Joi.number().allow(null, '').empty(''),
  ScaleFactor: Joi.number().default(1.0),
  MetadataJson: Joi.object().allow(null),
  IsActive: Joi.number().valid(0, 1).default(1)
});

export const updateFloorPlanSchema = createFloorPlanSchema.fork(['FloorID', 'FloorPlanCode', 'FloorPlanName', 'FilePath'], (schema) => schema.optional());

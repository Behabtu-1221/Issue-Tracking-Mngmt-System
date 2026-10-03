import { VALIDATION_LIMITS, REGEX_PATTERNS } from '../constants/validationConstants';
import { VALIDATION_MESSAGES, BUSINESS_PARK_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';

export const parkSchemas = {
  /**
   * Business Park Campus Form Validation
   */
  parkForm: (formData) => {
    const errors = {};
    const parkName = inputSanitizer.normalizeText(formData.BusinessParkName || formData.ParkName || formData.parkName);
    const parkCode = inputSanitizer.normalizeText(formData.BusinessParkCode || formData.ParkCode || formData.parkCode);
    const city = inputSanitizer.normalizeText(formData.City || formData.city || 'Addis Ababa');
    const country = inputSanitizer.normalizeText(formData.Country || formData.country || 'Ethiopia');
    const email = inputSanitizer.normalizeText(formData.Email || formData.email || formData.ContactEmail);

    if (!parkName) {
      errors.BusinessParkName = 'Business park name is required.';
    } else if (parkName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
      errors.BusinessParkName = `Business park name must be at least ${VALIDATION_LIMITS.NAME_MIN_LENGTH} characters.`;
    } else if (parkName.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
      errors.BusinessParkName = `Business park name cannot exceed ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters.`;
    }

    if (!parkCode) {
      errors.BusinessParkCode = 'Business park code is required.';
    } else if (!REGEX_PATTERNS.CODE.test(parkCode)) {
      errors.BusinessParkCode = 'Business park code format is invalid (e.g. BP-01).';
    }

    if (!city) {
      errors.City = 'City is required.';
    }

    if (email && !REGEX_PATTERNS.EMAIL.test(email)) {
      errors.Email = VALIDATION_MESSAGES.invalidEmail;
    }

    const totalArea = formData.TotalAreaSquareMeter !== undefined && formData.TotalAreaSquareMeter !== '' ? Number(formData.TotalAreaSquareMeter) : null;
    if (totalArea !== null && (isNaN(totalArea) || totalArea < 0)) {
      errors.TotalAreaSquareMeter = 'Total campus area must be a positive number.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        BusinessParkCode: parkCode,
        BusinessParkName: parkName,
        ShortName: inputSanitizer.normalizeText(formData.ShortName),
        Description: inputSanitizer.normalizeText(formData.Description),
        RegistrationNumber: inputSanitizer.normalizeText(formData.RegistrationNumber),
        TaxIdentificationNo: inputSanitizer.normalizeText(formData.TaxIdentificationNo),
        Email: email,
        PhoneNumber: inputSanitizer.normalizeText(formData.PhoneNumber || formData.ContactPhone),
        MobileNumber: inputSanitizer.normalizeText(formData.MobileNumber),
        Website: inputSanitizer.normalizeText(formData.Website),
        Country: country,
        Region: inputSanitizer.normalizeText(formData.Region),
        City: city,
        SubCity: inputSanitizer.normalizeText(formData.SubCity),
        Woreda: inputSanitizer.normalizeText(formData.Woreda),
        PostalCode: inputSanitizer.normalizeText(formData.PostalCode),
        AddressLine1: inputSanitizer.normalizeText(formData.AddressLine1),
        AddressLine2: inputSanitizer.normalizeText(formData.AddressLine2),
        Latitude: formData.Latitude !== undefined && formData.Latitude !== '' ? Number(formData.Latitude) : null,
        Longitude: formData.Longitude !== undefined && formData.Longitude !== '' ? Number(formData.Longitude) : null,
        TimeZone: formData.TimeZone || 'Africa/Addis_Ababa',
        CurrencyCode: formData.CurrencyCode || 'ETB',
        LanguageCode: formData.LanguageCode || 'en',
        LogoPath: inputSanitizer.normalizeText(formData.LogoPath),
        TotalAreaSquareMeter: totalArea,
        IsOperational: formData.IsOperational !== undefined ? Number(formData.IsOperational) : 1,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * Subitem: Building Block Form Validation
   */
  buildingForm: (formData) => {
    const errors = {};
    const bldgMsg = BUSINESS_PARK_MESSAGES.building;
    const buildingName = inputSanitizer.normalizeText(formData.BuildingName || formData.buildingName);
    const buildingCode = inputSanitizer.normalizeText(formData.BuildingCode || formData.buildingCode);
    const description = inputSanitizer.normalizeText(formData.Description || formData.description);
    const parkId = formData.ParkID || formData.BusinessParkID ? Number(formData.ParkID || formData.BusinessParkID) : '';
    const zoneId = formData.FacilityZoneID || formData.ZoneID ? Number(formData.FacilityZoneID || formData.ZoneID) : '';

    if (!parkId) {
      errors.BusinessParkID = bldgMsg.parkRequired;
      errors.ParkID = bldgMsg.parkRequired;
    }

    if (!zoneId) {
      errors.FacilityZoneID = bldgMsg.zoneRequired;
    }

    if (!buildingName) {
      errors.BuildingName = bldgMsg.nameRequired;
    } else if (buildingName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
      errors.BuildingName = bldgMsg.nameMinLength(VALIDATION_LIMITS.NAME_MIN_LENGTH);
    } else if (buildingName.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
      errors.BuildingName = bldgMsg.nameMaxLength(VALIDATION_LIMITS.NAME_MAX_LENGTH);
    }

    if (!buildingCode) {
      errors.BuildingCode = bldgMsg.codeRequired;
    } else if (!REGEX_PATTERNS.CODE.test(buildingCode)) {
      errors.BuildingCode = bldgMsg.codeFormat;
    }

    if (description && description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      errors.Description = bldgMsg.descriptionMaxLength(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH);
    }

    const floorsCount = formData.FloorsCount !== undefined && formData.FloorsCount !== '' 
      ? Number(formData.FloorsCount) 
      : (formData.TotalFloors !== undefined && formData.TotalFloors !== '' ? Number(formData.TotalFloors) : null);
    
    if (floorsCount === null || isNaN(floorsCount) || !Number.isInteger(floorsCount)) {
      errors.TotalFloors = bldgMsg.floorsRequired;
      errors.FloorsCount = bldgMsg.floorsRequired;
    } else if (floorsCount < 1 || floorsCount > 200) {
      errors.TotalFloors = bldgMsg.floorsRange(1, 200);
      errors.FloorsCount = bldgMsg.floorsRange(1, 200);
    }

    const area = formData.TotalAreaSquareMeter !== undefined && formData.TotalAreaSquareMeter !== '' && formData.TotalAreaSquareMeter !== null
      ? Number(formData.TotalAreaSquareMeter)
      : null;
    if (area !== null && (isNaN(area) || area < 0)) {
      errors.TotalAreaSquareMeter = bldgMsg.areaPositive;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        BuildingName: buildingName,
        BuildingCode: buildingCode,
        ParkID: parkId,
        BusinessParkID: parkId,
        FacilityZoneID: zoneId,
        FloorsCount: floorsCount || 1,
        TotalFloors: floorsCount || 1,
        TotalAreaSquareMeter: area,
        Description: description,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * Subitem: Floor Level Form Validation
   */
  floorForm: (formData) => {
    const errors = {};
    const flrMsg = BUSINESS_PARK_MESSAGES.floor;
    const floorName = inputSanitizer.normalizeText(formData.FloorName || formData.floorName);
    let floorCode = inputSanitizer.normalizeText(formData.FloorCode || formData.floorCode);
    const buildingId = formData.BuildingID ? Number(formData.BuildingID) : '';
    const floorNumber = formData.FloorNumber !== undefined && formData.FloorNumber !== '' ? Number(formData.FloorNumber) : '';
    const maxFloors = formData.BuildingTotalFloors || formData.MaxFloors || formData.TotalFloors ? Number(formData.BuildingTotalFloors || formData.MaxFloors || formData.TotalFloors) : null;
    const bldgName = formData.BuildingName || 'the building';

    if (!buildingId) {
      errors.BuildingID = flrMsg.buildingRequired;
    }

    if (!floorName) {
      errors.FloorName = flrMsg.nameRequired;
    } else if (floorName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
      errors.FloorName = flrMsg.nameMinLength(VALIDATION_LIMITS.NAME_MIN_LENGTH);
    } else if (floorName.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
      errors.FloorName = flrMsg.nameMaxLength(VALIDATION_LIMITS.NAME_MAX_LENGTH);
    }

    if (floorNumber === '' || isNaN(floorNumber) || !Number.isInteger(floorNumber)) {
      errors.FloorNumber = flrMsg.numberRequired;
    } else if (floorNumber < 1) {
      errors.FloorNumber = flrMsg.numberPositive;
    } else if (maxFloors && floorNumber > maxFloors) {
      errors.FloorNumber = flrMsg.numberExceedsCapacity(floorNumber, maxFloors, bldgName);
    }

    // Auto-generate FloorCode if not provided
    if (!floorCode && floorNumber !== '') {
      floorCode = `FLR-${floorNumber}`;
    } else if (floorCode && !REGEX_PATTERNS.CODE.test(floorCode)) {
      errors.FloorCode = flrMsg.codeFormat;
    } else if (floorCode && floorCode.length > 20) {
      errors.FloorCode = flrMsg.codeMaxLength(20);
    }

    const officeSpaces = formData.TotalOfficeSpaces !== undefined && formData.TotalOfficeSpaces !== '' && formData.TotalOfficeSpaces !== null
      ? Number(formData.TotalOfficeSpaces)
      : 0;
    if (isNaN(officeSpaces) || !Number.isInteger(officeSpaces) || officeSpaces < 0) {
      errors.TotalOfficeSpaces = flrMsg.officeSpacesPositive;
    }

    const sqM = formData.SquareMeters !== undefined && formData.SquareMeters !== '' && formData.SquareMeters !== null
      ? Number(formData.SquareMeters)
      : null;
    if (sqM !== null && (isNaN(sqM) || sqM < 0)) {
      errors.SquareMeters = flrMsg.areaPositive;
    }

    const description = inputSanitizer.normalizeText(formData.Description);
    if (description && description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      errors.Description = flrMsg.descriptionMaxLength(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        FloorName: floorName,
        FloorCode: floorCode || `FLR-${floorNumber || 1}`,
        BuildingID: buildingId,
        FloorNumber: floorNumber,
        TotalOfficeSpaces: officeSpaces,
        SquareMeters: sqM || 0,
        Description: description,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * Subitem: Office Space / Unit Form Validation
   */
  officeSpaceForm: (formData) => {
    const errors = {};
    const ofcMsg = BUSINESS_PARK_MESSAGES.office;
    const officeNumber = inputSanitizer.normalizeText(formData.OfficeNumber || formData.officeNumber);
    const officeName = inputSanitizer.normalizeText(formData.OfficeName || formData.officeName);
    const floorId = formData.FloorID ? Number(formData.FloorID) : '';
    const sqM = formData.SquareMeters !== undefined && formData.SquareMeters !== '' ? Number(formData.SquareMeters) : '';
    const rate = formData.RentalRatePerSqM !== undefined && formData.RentalRatePerSqM !== '' 
      ? Number(formData.RentalRatePerSqM) 
      : (formData.MonthlyRentAmount !== undefined && formData.MonthlyRentAmount !== '' ? Number(formData.MonthlyRentAmount) : 0);
    const maxOcc = formData.MaxOccupancy !== undefined && formData.MaxOccupancy !== '' ? Number(formData.MaxOccupancy) : null;

    if (!floorId) {
      errors.FloorID = ofcMsg.floorRequired;
    }

    if (!officeNumber) {
      errors.OfficeNumber = ofcMsg.numberRequired;
    } else if (officeNumber.length < 1 || officeNumber.length > 20) {
      errors.OfficeNumber = ofcMsg.numberFormat;
    }

    if (officeName) {
      if (officeName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
        errors.OfficeName = ofcMsg.nameMinLength(VALIDATION_LIMITS.NAME_MIN_LENGTH);
      } else if (officeName.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
        errors.OfficeName = ofcMsg.nameMaxLength(VALIDATION_LIMITS.NAME_MAX_LENGTH);
      }
    }

    if (sqM !== '' && (isNaN(sqM) || sqM <= 0)) {
      errors.SquareMeters = ofcMsg.areaPositive;
    }

    if (isNaN(rate) || rate < 0) {
      errors.RentalRatePerSqM = ofcMsg.rentRateNonNegative;
      errors.MonthlyRentAmount = ofcMsg.rentRateNonNegative;
    }

    if (maxOcc !== null && (isNaN(maxOcc) || !Number.isInteger(maxOcc) || maxOcc < 1)) {
      errors.MaxOccupancy = ofcMsg.occupancyPositive;
    }

    const validStatuses = ['VACANT', 'OCCUPIED', 'UNDER_MAINTENANCE', 'RESERVED'];
    const currentStatus = formData.AvailabilityStatus || formData.OccupancyStatus || 'VACANT';
    if (!validStatuses.includes(currentStatus)) {
      errors.AvailabilityStatus = ofcMsg.statusInvalid;
      errors.OccupancyStatus = ofcMsg.statusInvalid;
    }

    const description = inputSanitizer.normalizeText(formData.Description);
    if (description && description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      errors.Description = ofcMsg.descriptionMaxLength(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        OfficeNumber: officeNumber,
        OfficeName: officeName || `Office ${officeNumber}`,
        FloorID: floorId,
        OfficeTypeID: formData.OfficeTypeID ? Number(formData.OfficeTypeID) : 1,
        SquareMeters: sqM ? Number(sqM) : 0,
        RentalRatePerSqM: rate,
        MonthlyRentAmount: rate,
        MaxOccupancy: maxOcc,
        AvailabilityStatus: currentStatus,
        OccupancyStatus: currentStatus,
        Description: description,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * Subitem: Facility Zone Form Validation
   */
  facilityZoneForm: (formData) => {
    const errors = {};
    const znMsg = BUSINESS_PARK_MESSAGES.zone;
    const zoneName = inputSanitizer.normalizeText(formData.FacilityZoneName || formData.ZoneName || formData.zoneName);
    const zoneCode = inputSanitizer.normalizeText(formData.FacilityZoneCode || formData.ZoneCode || formData.zoneCode);
    const parkId = formData.BusinessParkID || formData.ParkID ? Number(formData.BusinessParkID || formData.ParkID) : '';
    const cap = formData.CapacityLimit !== undefined && formData.CapacityLimit !== null && String(formData.CapacityLimit).trim() !== ''
      ? Number(formData.CapacityLimit)
      : null;

    if (!parkId) {
      errors.BusinessParkID = znMsg.parkRequired;
      errors.ParkID = znMsg.parkRequired;
    }

    if (!zoneName) {
      errors.FacilityZoneName = znMsg.nameRequired;
      errors.ZoneName = znMsg.nameRequired;
    } else if (zoneName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
      errors.FacilityZoneName = znMsg.nameMinLength(VALIDATION_LIMITS.NAME_MIN_LENGTH);
      errors.ZoneName = znMsg.nameMinLength(VALIDATION_LIMITS.NAME_MIN_LENGTH);
    } else if (zoneName.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
      errors.FacilityZoneName = znMsg.nameMaxLength(VALIDATION_LIMITS.NAME_MAX_LENGTH);
      errors.ZoneName = znMsg.nameMaxLength(VALIDATION_LIMITS.NAME_MAX_LENGTH);
    }

    if (!zoneCode) {
      errors.FacilityZoneCode = znMsg.codeRequired;
      errors.ZoneCode = znMsg.codeRequired;
    } else if (!REGEX_PATTERNS.CODE.test(zoneCode)) {
      errors.FacilityZoneCode = znMsg.codeFormat;
      errors.ZoneCode = znMsg.codeFormat;
    }

    if (cap !== null && (isNaN(cap) || !Number.isInteger(cap) || cap < 1)) {
      errors.CapacityLimit = znMsg.capacityLimitPositive;
    }

    const description = inputSanitizer.normalizeText(formData.Description);
    if (description && description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      errors.Description = znMsg.descriptionMaxLength(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        BusinessParkID: parkId,
        ParkID: parkId,
        FacilityZoneName: zoneName,
        ZoneName: zoneName,
        FacilityZoneCode: zoneCode,
        ZoneCode: zoneCode,
        ZoneType: formData.ZoneType || formData.ZoneTypeCode || 'OPERATIONAL',
        ZoneTypeCode: formData.ZoneTypeCode || formData.ZoneType || 'OPERATIONAL',
        CapacityLimit: cap,
        Description: description,
        SecurityLevel: formData.SecurityLevel || 'STANDARD',
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * Subitem: Campus Location / Landmark Form Validation
   */
  campusLocationForm: (formData) => {
    const errors = {};
    const locMsg = BUSINESS_PARK_MESSAGES.campusLocation;
    const locationName = inputSanitizer.normalizeText(formData.LocationName || formData.locationName);
    const locationCode = inputSanitizer.normalizeText(formData.LocationCode || formData.locationCode);
    const parkId = formData.BusinessParkID || formData.ParkID ? Number(formData.BusinessParkID || formData.ParkID) : '';
    const gps = inputSanitizer.normalizeText(formData.GPSCoordinates);

    if (!parkId) {
      errors.BusinessParkID = locMsg.parkRequired;
      errors.ParkID = locMsg.parkRequired;
    }

    if (!locationName) {
      errors.LocationName = locMsg.nameRequired;
    } else if (locationName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
      errors.LocationName = locMsg.nameMinLength(VALIDATION_LIMITS.NAME_MIN_LENGTH);
    } else if (locationName.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
      errors.LocationName = locMsg.nameMaxLength(VALIDATION_LIMITS.NAME_MAX_LENGTH);
    }

    if (!locationCode) {
      errors.LocationCode = locMsg.codeRequired;
    } else if (!REGEX_PATTERNS.CODE.test(locationCode)) {
      errors.LocationCode = locMsg.codeFormat;
    }

    if (gps) {
      const gpsPattern = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
      if (!gpsPattern.test(gps)) {
        errors.GPSCoordinates = locMsg.gpsFormat;
      }
    }

    const description = inputSanitizer.normalizeText(formData.Description);
    if (description && description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      errors.Description = locMsg.descriptionMaxLength(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        LocationName: locationName,
        LocationCode: locationCode,
        ParkID: parkId,
        BusinessParkID: parkId,
        LocationType: formData.LocationType || formData.LocationCategory || 'BLOCK',
        LocationCategory: formData.LocationCategory || formData.LocationType || 'LANDMARK',
        ParentLocationID: formData.ParentLocationID ? Number(formData.ParentLocationID) : null,
        GPSCoordinates: gps,
        Description: description,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  }
};

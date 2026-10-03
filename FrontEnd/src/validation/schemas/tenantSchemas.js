import { inputSanitizer } from '../sanitizers/inputSanitizer';
import { REGEX_PATTERNS } from '../constants/validationConstants';
import { TENANT_LEASING_MESSAGES } from '../messages/validationMessages';

export const tenantSchemas = {
  /**
   * Tenant Onboarding & Profile Form
   */
  tenantForm: (formData) => {
    const errors = {};
    const tMsg = TENANT_LEASING_MESSAGES.tenant;
    const companyName = inputSanitizer.normalizeText(formData.CompanyName || formData.companyName);
    const tenantCode = inputSanitizer.normalizeText(formData.TenantCode || formData.tenantCode);
    const parkId = formData.BusinessParkID ? Number(formData.BusinessParkID) : (formData.ParkID ? Number(formData.ParkID) : 1);
    const tenantTypeId = formData.TenantTypeID ? Number(formData.TenantTypeID) : 1;
    const email = inputSanitizer.normalizeText(formData.PrimaryEmail || formData.email || '');
    const phone = inputSanitizer.normalizeText(formData.PrimaryPhone || formData.phone || '');
    const regNo = inputSanitizer.normalizeText(formData.RegistrationNumber || '');
    const taxNo = inputSanitizer.normalizeText(formData.TaxIdentificationNo || formData.TaxIdentificationNumber || '');
    const website = inputSanitizer.normalizeText(formData.Website || '');
    const description = inputSanitizer.normalizeText(formData.Description || '');

    if (!companyName) {
      errors.CompanyName = tMsg.companyNameRequired;
    } else if (companyName.length < 2 || companyName.length > 150) {
      errors.CompanyName = tMsg.companyNameLength(2, 150);
    }

    if (!tenantCode) {
      errors.TenantCode = tMsg.tenantCodeRequired;
    } else if (!REGEX_PATTERNS.CODE.test(tenantCode) || tenantCode.length < 2 || tenantCode.length > 30) {
      errors.TenantCode = tMsg.tenantCodeFormat;
    }

    if (!parkId) {
      errors.BusinessParkID = tMsg.parkRequired;
    }

    if (regNo && (regNo.length < 3 || regNo.length > 50)) {
      errors.RegistrationNumber = tMsg.registrationNumberLength(3, 50);
    }

    if (taxNo && (taxNo.length < 5 || taxNo.length > 30)) {
      errors.TaxIdentificationNo = tMsg.taxIdLength(5, 30);
    }

    if (email && !REGEX_PATTERNS.EMAIL.test(email)) {
      errors.PrimaryEmail = tMsg.emailFormat;
    }

    if (phone && !REGEX_PATTERNS.PHONE.test(phone)) {
      errors.PrimaryPhone = tMsg.phoneFormat;
    }

    const urlRegex = REGEX_PATTERNS.URL || /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
    if (website && !urlRegex.test(website)) {
      errors.Website = tMsg.websiteFormat;
    }

    if (description && description.length > 1000) {
      errors.Description = tMsg.descriptionMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        CompanyName: companyName,
        TenantCode: tenantCode,
        BusinessParkID: parkId,
        TenantTypeID: tenantTypeId,
        IndustryID: formData.IndustryID ? Number(formData.IndustryID) : undefined,
        RegistrationNumber: regNo,
        TaxIdentificationNo: taxNo,
        PrimaryEmail: email,
        PrimaryPhone: phone,
        Website: website,
        Status: formData.Status || 'ONBOARDING',
        Description: description
      }
    };
  },

  /**
   * Lease Agreement Contract Form
   */
  leaseForm: (formData) => {
    const errors = {};
    const lMsg = TENANT_LEASING_MESSAGES.lease;
    const tenantId = formData.TenantID ? Number(formData.TenantID) : '';
    const agreementNumber = inputSanitizer.normalizeText(formData.AgreementNumber || formData.LeaseAgreementNumber || '');
    const startDate = formData.StartDate || '';
    const endDate = formData.EndDate || '';
    const executionDate = formData.ExecutionDate || '';
    const rent = formData.MonthlyRentAmount !== undefined && formData.MonthlyRentAmount !== '' ? Number(formData.MonthlyRentAmount) : '';
    const deposit = formData.SecurityDepositAmount !== undefined && formData.SecurityDepositAmount !== '' ? Number(formData.SecurityDepositAmount) : 0;
    const graceDays = formData.GracePeriodDays !== undefined && formData.GracePeriodDays !== '' ? Number(formData.GracePeriodDays) : 0;

    if (!tenantId) {
      errors.TenantID = lMsg.tenantRequired;
    }

    if (!agreementNumber) {
      errors.AgreementNumber = lMsg.agreementNumberRequired;
      errors.LeaseAgreementNumber = lMsg.agreementNumberRequired;
    } else if (agreementNumber.length < 3 || agreementNumber.length > 50) {
      errors.AgreementNumber = lMsg.agreementNumberLength(3, 50);
      errors.LeaseAgreementNumber = lMsg.agreementNumberLength(3, 50);
    }

    if (!startDate) {
      errors.StartDate = lMsg.startDateRequired;
    }

    if (!endDate) {
      errors.EndDate = lMsg.endDateRequired;
    } else if (startDate && new Date(endDate) <= new Date(startDate)) {
      errors.EndDate = lMsg.endDateAfterStart;
    }

    if (!executionDate) {
      errors.ExecutionDate = lMsg.executionDateRequired;
    } else if (startDate && new Date(executionDate) > new Date(startDate)) {
      errors.ExecutionDate = lMsg.executionDateBeforeStart;
    }

    if (rent === '' || isNaN(rent)) {
      errors.MonthlyRentAmount = lMsg.monthlyRentRequired;
    } else if (rent <= 0) {
      errors.MonthlyRentAmount = lMsg.monthlyRentPositive;
    }

    if (deposit !== '' && (isNaN(deposit) || deposit < 0)) {
      errors.SecurityDepositAmount = lMsg.securityDepositNonNegative;
    }

    if (graceDays !== '' && (isNaN(graceDays) || !Number.isInteger(graceDays) || graceDays < 0)) {
      errors.GracePeriodDays = lMsg.gracePeriodNonNegative;
    } else if (graceDays > 365) {
      errors.GracePeriodDays = lMsg.gracePeriodLimit;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        TenantID: tenantId,
        AgreementNumber: agreementNumber,
        LeaseAgreementNumber: agreementNumber,
        StartDate: startDate,
        EndDate: endDate,
        ExecutionDate: executionDate,
        MonthlyRentAmount: rent,
        SecurityDepositAmount: deposit || 0,
        GracePeriodDays: graceDays || 0,
        CurrencyCode: formData.CurrencyCode || 'ETB',
        Status: formData.Status || 'DRAFT',
        TermsConditions: inputSanitizer.normalizeText(formData.TermsConditions || '')
      }
    };
  },

  /**
   * Lease Status Transition Form
   */
  leaseStatusForm: (formData) => {
    const errors = {};
    const lMsg = TENANT_LEASING_MESSAGES.lease;
    const status = formData.Status || formData.status || '';
    const reason = inputSanitizer.normalizeText(formData.TerminationReason || formData.terminationReason || '');

    if (!status) {
      errors.Status = lMsg.statusInvalid;
    }

    if (status === 'TERMINATED') {
      if (!reason) {
        errors.TerminationReason = lMsg.terminationReasonRequired;
      } else if (reason.length < 5) {
        errors.TerminationReason = lMsg.terminationReasonMin(5);
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        Status: status,
        TerminationReason: reason
      }
    };
  },

  /**
   * Space Allocation Form
   */
  allocationForm: (formData) => {
    const errors = {};
    const aMsg = TENANT_LEASING_MESSAGES.allocation;
    const tenantId = formData.TenantID ? Number(formData.TenantID) : '';
    const scope = formData.AllocationScope || 'OFFICE';
    const officeId = formData.OfficeSpaceID ? Number(formData.OfficeSpaceID) : '';
    const floorId = formData.FloorID ? Number(formData.FloorID) : '';
    const buildingId = formData.BuildingID ? Number(formData.BuildingID) : '';
    const allocatedDate = formData.AllocatedDate || '';

    if (!tenantId) {
      errors.TenantID = aMsg.tenantRequired;
    }

    if (!scope) {
      errors.AllocationScope = aMsg.scopeRequired;
    }

    if (scope === 'OFFICE') {
      if (!officeId) {
        errors.OfficeSpaceID = aMsg.officeRequired;
      }
    }

    if (scope === 'FLOOR') {
      if (!buildingId) {
        errors.BuildingID = aMsg.buildingRequired;
      }
      if (!floorId) {
        errors.FloorID = aMsg.floorRequired;
      }
    }

    if (scope === 'BUILDING') {
      if (!buildingId) {
        errors.BuildingID = aMsg.buildingRequired;
      }
    }

    if (!allocatedDate) {
      errors.AllocatedDate = aMsg.allocatedDateRequired;
    }

    if (formData.availableCount !== undefined && Number(formData.availableCount) === 0) {
      if (scope === 'OFFICE') errors.OfficeSpaceID = aMsg.noVacantOffices;
      else if (scope === 'FLOOR') errors.FloorID = aMsg.noVacantOffices;
      else if (scope === 'BUILDING') errors.BuildingID = aMsg.noVacantOffices;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        TenantID: tenantId,
        AllocationScope: scope,
        OfficeSpaceID: scope === 'OFFICE' ? officeId : undefined,
        FloorID: scope === 'FLOOR' ? floorId : undefined,
        BuildingID: (scope === 'BUILDING' || scope === 'FLOOR') ? buildingId : undefined,
        LeaseAgreementID: (formData.LeaseAgreementID && Number(formData.LeaseAgreementID) > 0) ? Number(formData.LeaseAgreementID) : null,
        AllocatedDate: allocatedDate
      }
    };
  },

  /**
   * Release Allocation Form
   */
  releaseAllocationForm: (formData) => {
    const errors = {};
    const aMsg = TENANT_LEASING_MESSAGES.allocation;
    const remarks = inputSanitizer.normalizeText(formData.Remarks || formData.remarks || '');

    if (!remarks) {
      errors.Remarks = aMsg.releaseRemarksRequired;
    } else if (remarks.length < 3) {
      errors.Remarks = aMsg.releaseRemarksMin(3);
    } else if (remarks.length > 1000) {
      errors.Remarks = aMsg.releaseRemarksMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        Remarks: remarks
      }
    };
  },

  /**
   * Tenant Contact Channel Form
   */
  contactForm: (formData) => {
    const errors = {};
    const cMsg = TENANT_LEASING_MESSAGES.contact;
    const tenantId = formData.TenantID ? Number(formData.TenantID) : '';
    const contactType = formData.ContactType || 'EMAIL';
    const label = inputSanitizer.normalizeText(formData.Label || '');
    const value = inputSanitizer.normalizeText(formData.ContactValue || '');

    if (!tenantId) {
      errors.TenantID = cMsg.tenantRequired;
    }

    if (!contactType) {
      errors.ContactType = cMsg.typeRequired;
    }

    if (!label) {
      errors.Label = cMsg.labelRequired;
    } else if (label.length < 2 || label.length > 100) {
      errors.Label = cMsg.labelLength(2, 100);
    }

    if (!value) {
      errors.ContactValue = cMsg.valueRequired;
    } else {
      if (contactType === 'EMAIL') {
        if (!REGEX_PATTERNS.EMAIL.test(value)) {
          errors.ContactValue = cMsg.emailInvalid;
        }
      } else if (contactType === 'PHONE' || contactType === 'MOBILE') {
        if (!REGEX_PATTERNS.PHONE.test(value) || value.replace(/\D/g, '').length < 7) {
          errors.ContactValue = cMsg.phoneInvalid;
        }
      } else if (contactType === 'FAX') {
        if (value.replace(/\D/g, '').length < 7) {
          errors.ContactValue = 'Please enter a valid fax number (at least 7 digits).';
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        TenantID: tenantId,
        ContactType: contactType,
        Label: label,
        ContactValue: value,
        IsPrimary: formData.IsPrimary ? 1 : 0
      }
    };
  },

  /**
   * Tenant Physical Address Form
   */
  addressForm: (formData) => {
    const errors = {};
    const dMsg = TENANT_LEASING_MESSAGES.address;
    const tenantId = formData.TenantID ? Number(formData.TenantID) : '';
    const addressType = formData.AddressType || 'LEGAL';
    const country = inputSanitizer.normalizeText(formData.Country || '');
    const city = inputSanitizer.normalizeText(formData.City || '');
    const addressLine1 = inputSanitizer.normalizeText(formData.AddressLine1 || '');
    const postalCode = inputSanitizer.normalizeText(formData.PostalCode || '');

    if (!tenantId) {
      errors.TenantID = dMsg.tenantRequired;
    }

    if (!addressType) {
      errors.AddressType = dMsg.typeRequired;
    }

    if (!country) {
      errors.Country = dMsg.countryRequired;
    } else if (country.length < 2 || country.length > 100) {
      errors.Country = dMsg.countryLength(2, 100);
    }

    if (!city) {
      errors.City = dMsg.cityRequired;
    } else if (city.length < 2 || city.length > 100) {
      errors.City = dMsg.cityLength(2, 100);
    }

    if (!addressLine1) {
      errors.AddressLine1 = dMsg.addressLine1Required;
    } else if (addressLine1.length < 3 || addressLine1.length > 255) {
      errors.AddressLine1 = dMsg.addressLine1Length(3, 255);
    }

    if (postalCode && postalCode.length > 20) {
      errors.PostalCode = 'Postal code cannot exceed 20 characters.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        TenantID: tenantId,
        AddressType: addressType,
        Country: country,
        Region: inputSanitizer.normalizeText(formData.Region || ''),
        City: city,
        SubCity: inputSanitizer.normalizeText(formData.SubCity || ''),
        Woreda: inputSanitizer.normalizeText(formData.Woreda || ''),
        PostalCode: postalCode,
        AddressLine1: addressLine1,
        AddressLine2: inputSanitizer.normalizeText(formData.AddressLine2 || '')
      }
    };
  },

  /**
   * Sub-Tenant Entity Form
   */
  subTenantForm: (formData) => {
    const errors = {};
    const sMsg = TENANT_LEASING_MESSAGES.subTenant;
    const parentId = formData.ParentTenantID ? Number(formData.ParentTenantID) : '';
    const companyName = inputSanitizer.normalizeText(formData.CompanyName || formData.SubTenantName || '');
    const relationshipType = inputSanitizer.normalizeText(formData.RelationshipType || 'SUBSIDIARY');
    const regNo = inputSanitizer.normalizeText(formData.RegistrationNumber || '');
    const description = inputSanitizer.normalizeText(formData.Description || '');

    if (!parentId) {
      errors.ParentTenantID = sMsg.parentTenantRequired;
    }

    if (!companyName) {
      errors.CompanyName = sMsg.companyNameRequired;
      errors.SubTenantName = sMsg.companyNameRequired;
    } else if (companyName.length < 2 || companyName.length > 150) {
      errors.CompanyName = sMsg.companyNameLength(2, 150);
      errors.SubTenantName = sMsg.companyNameLength(2, 150);
    }

    if (!relationshipType) {
      errors.RelationshipType = sMsg.relationshipTypeRequired;
    }

    if (regNo && (regNo.length < 3 || regNo.length > 50)) {
      errors.RegistrationNumber = sMsg.registrationNumberLength(3, 50);
    }

    if (description && description.length > 1000) {
      errors.Description = 'Description cannot exceed 1000 characters.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        ParentTenantID: parentId,
        CompanyName: companyName,
        RelationshipType: relationshipType,
        RegistrationNumber: regNo,
        Description: description,
        Status: formData.Status || 'ACTIVE'
      }
    };
  }
};

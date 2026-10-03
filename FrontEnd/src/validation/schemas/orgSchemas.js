import { VALIDATION_LIMITS, REGEX_PATTERNS } from '../constants/validationConstants';
import { VALIDATION_MESSAGES, ORGANIZATION_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';

export const orgSchemas = {
  /**
   * 1. Department & Unit Form Schema
   */
  departmentForm: (formData) => {
    const errors = {};
    const name = inputSanitizer.normalizeText(formData.DepartmentName);
    const code = inputSanitizer.normalizeText(formData.DepartmentCode);
    const description = inputSanitizer.normalizeText(formData.Description);

    // Department Code
    if (!code) {
      errors.DepartmentCode = ORGANIZATION_MESSAGES.department.codeRequired;
    } else if (code.length < 2 || code.length > 30 || !REGEX_PATTERNS.CODE.test(code)) {
      errors.DepartmentCode = ORGANIZATION_MESSAGES.department.codeFormat;
    }

    // Department Name
    if (!name) {
      errors.DepartmentName = ORGANIZATION_MESSAGES.department.nameRequired;
    } else if (name.length < 2 || name.length > 100) {
      errors.DepartmentName = ORGANIZATION_MESSAGES.department.nameLength(2, 100);
    }

    // Description (Optional)
    if (description && description.length > 1000) {
      errors.Description = ORGANIZATION_MESSAGES.department.descriptionMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        DepartmentName: name,
        DepartmentCode: code.toUpperCase(),
        Description: description || undefined,
        BusinessParkID: formData.BusinessParkID ? Number(formData.BusinessParkID) : undefined,
        ManagerUserID: formData.ManagerUserID ? Number(formData.ManagerUserID) : null,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 2. Department Office Location Mapping Schema
   */
  departmentLocationForm: (formData) => {
    const errors = {};
    const officeSpaceId = formData.OfficeSpaceID || formData.officeSpaceId;

    if (!officeSpaceId) {
      errors.OfficeSpaceID = ORGANIZATION_MESSAGES.location.officeRequired;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        OfficeSpaceID: Number(officeSpaceId)
      }
    };
  },

  /**
   * 3. Operational Team Form Schema
   */
  teamForm: (formData) => {
    const errors = {};
    const departmentId = formData.DepartmentID;
    const code = inputSanitizer.normalizeText(formData.TeamCode);
    const name = inputSanitizer.normalizeText(formData.TeamName);
    const description = inputSanitizer.normalizeText(formData.Description);

    if (!departmentId) {
      errors.DepartmentID = ORGANIZATION_MESSAGES.team.departmentRequired;
    }

    if (!code) {
      errors.TeamCode = ORGANIZATION_MESSAGES.team.codeRequired;
    } else if (code.length < 2 || code.length > 30 || !REGEX_PATTERNS.CODE.test(code)) {
      errors.TeamCode = ORGANIZATION_MESSAGES.team.codeFormat;
    }

    if (!name) {
      errors.TeamName = ORGANIZATION_MESSAGES.team.nameRequired;
    } else if (name.length < 2 || name.length > 100) {
      errors.TeamName = ORGANIZATION_MESSAGES.team.nameLength(2, 100);
    }

    if (description && description.length > 500) {
      errors.Description = ORGANIZATION_MESSAGES.team.descriptionMaxLength(500);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        DepartmentID: Number(departmentId),
        TeamCode: code.toUpperCase(),
        TeamName: name,
        Description: description || undefined,
        LeaderUserID: formData.LeaderUserID ? Number(formData.LeaderUserID) : null,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 4. Job Position Form Schema
   */
  positionForm: (formData) => {
    const errors = {};
    const code = inputSanitizer.normalizeText(formData.PositionCode);
    const title = inputSanitizer.normalizeText(formData.PositionTitle);
    const description = inputSanitizer.normalizeText(formData.Description);

    if (!code) {
      errors.PositionCode = ORGANIZATION_MESSAGES.position.codeRequired;
    } else if (code.length < 2 || code.length > 30 || !REGEX_PATTERNS.CODE.test(code)) {
      errors.PositionCode = ORGANIZATION_MESSAGES.position.codeFormat;
    }

    if (!title) {
      errors.PositionTitle = ORGANIZATION_MESSAGES.position.titleRequired;
    } else if (title.length < 2 || title.length > 100) {
      errors.PositionTitle = ORGANIZATION_MESSAGES.position.titleLength(2, 100);
    }

    if (description && description.length > 500) {
      errors.Description = ORGANIZATION_MESSAGES.position.descriptionMaxLength(500);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        PositionCode: code.toUpperCase(),
        PositionTitle: title,
        Description: description || undefined,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 5. Employee Assignment Form Schema
   */
  assignmentForm: (formData, isEditing = false) => {
    const errors = {};
    const userId = formData.UserID;
    const departmentId = formData.DepartmentID;
    const joinedDate = formData.JoinedDate;

    if (!isEditing && !userId) {
      errors.UserID = ORGANIZATION_MESSAGES.assignment.userRequired;
    }

    if (!departmentId) {
      errors.DepartmentID = ORGANIZATION_MESSAGES.assignment.departmentRequired;
    }

    if (!joinedDate) {
      errors.JoinedDate = ORGANIZATION_MESSAGES.assignment.joinedDateRequired;
    } else if (isNaN(Date.parse(joinedDate))) {
      errors.JoinedDate = ORGANIZATION_MESSAGES.assignment.joinedDateFormat;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        UserID: userId ? Number(userId) : undefined,
        DepartmentID: Number(departmentId),
        TeamID: formData.TeamID ? Number(formData.TeamID) : null,
        PositionID: formData.PositionID ? Number(formData.PositionID) : null,
        JoinedDate: joinedDate,
        IsPrimary: formData.IsPrimary !== undefined ? Number(formData.IsPrimary) : 1,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 6. Reporting Hierarchy Form Schema
   * Includes business rule: Employee cannot report to themselves.
   */
  hierarchyForm: (formData) => {
    const errors = {};
    const empId = formData.EmployeeUserID;
    const supId = formData.SupervisorUserID;
    const type = formData.ReportingTypeCode || 'DIRECT';

    if (!empId) {
      errors.EmployeeUserID = ORGANIZATION_MESSAGES.hierarchy.employeeRequired;
    }

    if (!supId) {
      errors.SupervisorUserID = ORGANIZATION_MESSAGES.hierarchy.supervisorRequired;
    }

    // Business Rule: An employee cannot report to themselves
    if (empId && supId && String(empId) === String(supId)) {
      errors.SupervisorUserID = ORGANIZATION_MESSAGES.hierarchy.cannotReportToSelf;
    }

    if (!type) {
      errors.ReportingTypeCode = ORGANIZATION_MESSAGES.hierarchy.reportingTypeRequired;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        EmployeeUserID: Number(empId),
        SupervisorUserID: Number(supId),
        ReportingTypeCode: type,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 7. Cost Center Form Schema
   */
  costCenterForm: (formData) => {
    const errors = {};
    const code = inputSanitizer.normalizeText(formData.CostCenterCode);
    const name = inputSanitizer.normalizeText(formData.CostCenterName);
    const description = inputSanitizer.normalizeText(formData.Description);

    if (!code) {
      errors.CostCenterCode = ORGANIZATION_MESSAGES.costCenter.codeRequired;
    } else if (code.length < 2 || code.length > 30 || !REGEX_PATTERNS.CODE.test(code)) {
      errors.CostCenterCode = ORGANIZATION_MESSAGES.costCenter.codeFormat;
    }

    if (!name) {
      errors.CostCenterName = ORGANIZATION_MESSAGES.costCenter.nameRequired;
    } else if (name.length < 2 || name.length > 100) {
      errors.CostCenterName = ORGANIZATION_MESSAGES.costCenter.nameLength(2, 100);
    }

    if (description && description.length > 500) {
      errors.Description = ORGANIZATION_MESSAGES.costCenter.descriptionMaxLength(500);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        CostCenterCode: code.toUpperCase(),
        CostCenterName: name,
        Description: description || undefined,
        TenantID: formData.TenantID ? Number(formData.TenantID) : null,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 8. Department Budget Allocation Schema
   * Includes business rule: Remaining amount cannot exceed allocated amount.
   */
  budgetForm: (formData, isEditing = false) => {
    const errors = {};
    const departmentId = formData.DepartmentID;
    const fiscalYear = Number(formData.FiscalYear);
    const allocated = formData.AllocatedAmount !== '' && formData.AllocatedAmount !== undefined
      ? Number(formData.AllocatedAmount)
      : NaN;

    if (!departmentId) {
      errors.DepartmentID = ORGANIZATION_MESSAGES.budget.departmentRequired;
    }

    if (!formData.FiscalYear || isNaN(fiscalYear)) {
      errors.FiscalYear = ORGANIZATION_MESSAGES.budget.fiscalYearRequired;
    } else if (fiscalYear < 2000 || fiscalYear > 2100) {
      errors.FiscalYear = ORGANIZATION_MESSAGES.budget.fiscalYearRange(2000, 2100);
    }

    if (isNaN(allocated)) {
      errors.AllocatedAmount = ORGANIZATION_MESSAGES.budget.allocatedAmountRequired;
    } else if (allocated <= 0) {
      errors.AllocatedAmount = ORGANIZATION_MESSAGES.budget.allocatedAmountPositive;
    }

    // Remaining Amount handling & validation
    let remaining = allocated;
    if (formData.RemainingAmount !== '' && formData.RemainingAmount !== undefined) {
      remaining = Number(formData.RemainingAmount);
      if (isNaN(remaining) || remaining < 0) {
        errors.RemainingAmount = ORGANIZATION_MESSAGES.budget.remainingAmountInvalid;
      } else if (!isNaN(allocated) && remaining > allocated) {
        // Business Rule: Remaining cannot exceed Allocated
        errors.RemainingAmount = ORGANIZATION_MESSAGES.budget.remainingExceedsAllocated;
      }
    }

    const currency = (formData.CurrencyCode || 'ETB').trim().toUpperCase();
    if (!currency || currency.length !== 3) {
      errors.CurrencyCode = ORGANIZATION_MESSAGES.budget.currencyRequired;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        DepartmentID: Number(departmentId),
        CostCenterID: formData.CostCenterID ? Number(formData.CostCenterID) : null,
        FiscalYear: fiscalYear,
        AllocatedAmount: allocated,
        RemainingAmount: remaining,
        CurrencyCode: currency,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 9. Tenant Form Schema (Compatibility)
   */
  tenantForm: (formData) => {
    const errors = {};
    const tenantName = inputSanitizer.normalizeText(formData.TenantName);
    const tenantCode = inputSanitizer.normalizeText(formData.TenantCode);
    const email = inputSanitizer.normalizeText(formData.ContactEmail || formData.email);
    const phone = inputSanitizer.normalizeText(formData.ContactPhone || formData.phone);

    if (!tenantName) {
      errors.TenantName = VALIDATION_MESSAGES.required('Tenant Organization Name');
    } else if (tenantName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
      errors.TenantName = VALIDATION_MESSAGES.minLength('Tenant Organization Name', VALIDATION_LIMITS.NAME_MIN_LENGTH);
    }

    if (tenantCode && !REGEX_PATTERNS.CODE.test(tenantCode)) {
      errors.TenantCode = VALIDATION_MESSAGES.invalidFormat('Tenant Code');
    }

    if (email && !REGEX_PATTERNS.EMAIL.test(email)) {
      errors.ContactEmail = VALIDATION_MESSAGES.invalidEmail;
    }

    if (phone && !REGEX_PATTERNS.PHONE.test(phone)) {
      errors.ContactPhone = VALIDATION_MESSAGES.invalidPhone;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        TenantName: tenantName,
        TenantCode: tenantCode,
        ContactEmail: email,
        ContactPhone: phone,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  }
};

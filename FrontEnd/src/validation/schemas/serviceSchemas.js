import { VALIDATION_LIMITS, REGEX_PATTERNS } from '../constants/validationConstants';
import { SERVICE_CATALOG_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';

const IDENTIFIER_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const EXTENSION_LIST_REGEX = /^[a-zA-Z0-9]+(,\s*[a-zA-Z0-9]+)*$/;

export const serviceSchemas = {
  /**
   * 1. Service Category Form Schema
   * Validates Category Name, Code, Description, and Tenant Scoping.
   */
  categoryForm: (formData, isEditing = false) => {
    const errors = {};
    const categoryName = inputSanitizer.normalizeText(formData.CategoryName || '');
    const categoryCode = inputSanitizer.normalizeText(formData.CategoryCode || '').toUpperCase();
    const description = inputSanitizer.normalizeText(formData.Description || '');
    const tenantId = formData.TenantID !== '' && formData.TenantID !== null && formData.TenantID !== undefined
      ? Number(formData.TenantID)
      : null;

    // Category Name
    if (!categoryName) {
      errors.CategoryName = SERVICE_CATALOG_MESSAGES.category.nameRequired;
    } else if (categoryName.length < 2 || categoryName.length > 150) {
      errors.CategoryName = SERVICE_CATALOG_MESSAGES.category.nameLength(2, 150);
    }

    // Category Code
    if (!categoryCode) {
      errors.CategoryCode = SERVICE_CATALOG_MESSAGES.category.codeRequired;
    } else if (categoryCode.length < 2 || categoryCode.length > 50) {
      errors.CategoryCode = SERVICE_CATALOG_MESSAGES.category.codeLength(2, 50);
    } else if (!REGEX_PATTERNS.CODE.test(categoryCode)) {
      errors.CategoryCode = SERVICE_CATALOG_MESSAGES.category.codeFormat;
    }

    // Description
    if (description && description.length > 1000) {
      errors.Description = SERVICE_CATALOG_MESSAGES.category.descriptionMaxLength(1000);
    }

    // Tenant Scoping check
    if (tenantId !== null && (isNaN(tenantId) || tenantId <= 0)) {
      errors.TenantID = SERVICE_CATALOG_MESSAGES.category.tenantInvalid;
    }

    const departmentId = formData.DepartmentID !== '' && formData.DepartmentID !== null && formData.DepartmentID !== undefined
      ? Number(formData.DepartmentID)
      : null;

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        CategoryName: categoryName,
        CategoryCode: categoryCode,
        Description: description || null,
        TenantID: tenantId,
        DepartmentID: departmentId,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 2. Core Service Offering Form Schema
   * Validates Category association, Service Code, Title, Costs, Currency, and Scope.
   */
  serviceOfferingForm: (formData, isEditing = false) => {
    const errors = {};
    const categoryId = formData.ServiceCategoryID !== '' && formData.ServiceCategoryID !== undefined
      ? Number(formData.ServiceCategoryID)
      : null;
    const serviceCode = inputSanitizer.normalizeText(formData.ServiceCode || '').toUpperCase();
    const serviceName = inputSanitizer.normalizeText(formData.ServiceName || '');
    const description = inputSanitizer.normalizeText(formData.Description || '');
    const rawCost = formData.EstimatedCost !== undefined && formData.EstimatedCost !== ''
      ? Number(formData.EstimatedCost)
      : 0;
    const currencyCode = inputSanitizer.normalizeText(formData.CurrencyCode || 'ETB').toUpperCase();

    // Category
    if (!categoryId || isNaN(categoryId) || categoryId <= 0) {
      errors.ServiceCategoryID = SERVICE_CATALOG_MESSAGES.offering.categoryRequired;
    }

    // Service Code
    if (!serviceCode) {
      errors.ServiceCode = SERVICE_CATALOG_MESSAGES.offering.codeRequired;
    } else if (serviceCode.length < 2 || serviceCode.length > 50) {
      errors.ServiceCode = SERVICE_CATALOG_MESSAGES.offering.codeLength(2, 50);
    } else if (!REGEX_PATTERNS.CODE.test(serviceCode)) {
      errors.ServiceCode = SERVICE_CATALOG_MESSAGES.offering.codeFormat;
    }

    // Service Name
    if (!serviceName) {
      errors.ServiceName = SERVICE_CATALOG_MESSAGES.offering.nameRequired;
    } else if (serviceName.length < 3 || serviceName.length > 150) {
      errors.ServiceName = SERVICE_CATALOG_MESSAGES.offering.nameLength(3, 150);
    }

    // Estimated Unit Cost
    if (isNaN(rawCost) || rawCost < 0) {
      errors.EstimatedCost = SERVICE_CATALOG_MESSAGES.offering.costNegative;
    } else {
      // Check 2 decimal places precision
      const costStr = String(formData.EstimatedCost || '');
      if (costStr.includes('.') && costStr.split('.')[1].length > 2) {
        errors.EstimatedCost = SERVICE_CATALOG_MESSAGES.offering.costPrecision;
      }
    }

    // Currency Code
    if (!currencyCode) {
      errors.CurrencyCode = SERVICE_CATALOG_MESSAGES.offering.currencyRequired;
    }

    // Description
    if (description && description.length > 1000) {
      errors.Description = SERVICE_CATALOG_MESSAGES.offering.descriptionMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        ServiceCategoryID: categoryId,
        ServiceCode: serviceCode,
        ServiceName: serviceName,
        Description: description || null,
        EstimatedCost: isNaN(rawCost) ? 0 : Number(rawCost.toFixed(2)),
        CurrencyCode: currencyCode,
        ServiceTypeID: formData.ServiceTypeID ? Number(formData.ServiceTypeID) : 1,
        ServiceLevelID: formData.ServiceLevelID ? Number(formData.ServiceLevelID) : 1,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 3. Category Department Mapping Schema
   * Validates Category and Department selection, and prevents duplicate mappings.
   */
  categoryMappingForm: (formData, existingMappings = [], currentMappingId = null) => {
    const errors = {};
    const serviceCategoryId = formData.ServiceCategoryID !== '' && formData.ServiceCategoryID !== undefined
      ? Number(formData.ServiceCategoryID)
      : null;
    const departmentId = formData.DepartmentID !== '' && formData.DepartmentID !== undefined
      ? Number(formData.DepartmentID)
      : null;

    if (!serviceCategoryId || isNaN(serviceCategoryId) || serviceCategoryId <= 0) {
      errors.ServiceCategoryID = SERVICE_CATALOG_MESSAGES.mapping.categoryRequired;
    }

    if (!departmentId || isNaN(departmentId) || departmentId <= 0) {
      errors.DepartmentID = SERVICE_CATALOG_MESSAGES.mapping.departmentRequired;
    }

    // Business Rule: A service category can only be mapped to one responsible department
    if (serviceCategoryId && Array.isArray(existingMappings)) {
      const existingMapping = existingMappings.find(m => {
        const mId = m.MappingID || m.id;
        if (currentMappingId && Number(mId) === Number(currentMappingId)) return false;
        return Number(m.ServiceCategoryID) === serviceCategoryId && (m.IsDeleted === 0 || m.IsDeleted === undefined);
      });

      if (existingMapping) {
        errors.ServiceCategoryID = `This category is already routed to "${existingMapping.DepartmentName || 'a department'}". Edit that mapping to reassign.`;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        ServiceCategoryID: serviceCategoryId,
        DepartmentID: departmentId,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  }
};

export default serviceSchemas;



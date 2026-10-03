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
  },

  /**
   * 4. Service Pricing Matrix Schema
   * Validates Service selector, Pricing Model, Unit Price, Billing Type, and decimal precision.
   */
  servicePricingForm: (formData) => {
    const errors = {};
    const serviceId = formData.ServiceID !== '' && formData.ServiceID !== undefined
      ? Number(formData.ServiceID)
      : null;
    const pricingModel = formData.PricingModel || '';
    const billingType = formData.BillingType || '';
    const rawPrice = formData.UnitPrice !== undefined && formData.UnitPrice !== ''
      ? Number(formData.UnitPrice)
      : 0;
    const currencyCode = inputSanitizer.normalizeText(formData.CurrencyCode || 'ETB').toUpperCase();

    if (!serviceId || isNaN(serviceId) || serviceId <= 0) {
      errors.ServiceID = SERVICE_CATALOG_MESSAGES.pricing.serviceRequired;
    }

    if (!pricingModel) {
      errors.PricingModel = SERVICE_CATALOG_MESSAGES.pricing.pricingModelRequired;
    }

    if (!billingType) {
      errors.BillingType = SERVICE_CATALOG_MESSAGES.pricing.billingTypeRequired;
    }

    // Unit Price validation & business rules
    if (isNaN(rawPrice) || rawPrice < 0) {
      errors.UnitPrice = SERVICE_CATALOG_MESSAGES.pricing.unitPriceNegative;
    } else {
      const priceStr = String(formData.UnitPrice || '');
      if (priceStr.includes('.') && priceStr.split('.')[1].length > 2) {
        errors.UnitPrice = SERVICE_CATALOG_MESSAGES.pricing.unitPricePrecision;
      } else if (pricingModel === 'FREE' && rawPrice > 0) {
        errors.UnitPrice = SERVICE_CATALOG_MESSAGES.pricing.unitPriceFreeWarning;
      } else if (pricingModel !== 'FREE' && billingType === 'BILLABLE' && rawPrice <= 0) {
        errors.UnitPrice = SERVICE_CATALOG_MESSAGES.pricing.unitPriceRequiredForBillable;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        ServiceID: serviceId,
        PricingModel: pricingModel,
        UnitPrice: isNaN(rawPrice) ? 0 : Number(rawPrice.toFixed(2)),
        CurrencyCode: currencyCode,
        BillingType: billingType,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 5. Service Requirement: Custom Dynamic Field Schema
   * Validates Field Name identifier, Label, Type, and Display Order.
   */
  serviceRequirementFieldForm: (formData) => {
    const errors = {};
    const fieldName = inputSanitizer.normalizeText(formData.FieldName || '').toLowerCase();
    const fieldLabel = inputSanitizer.normalizeText(formData.FieldLabel || '');
    const fieldType = formData.FieldType || '';
    const displayOrder = formData.DisplayOrder !== '' && formData.DisplayOrder !== undefined
      ? Number(formData.DisplayOrder)
      : 0;

    // Field Name Identifier
    if (!fieldName) {
      errors.FieldName = SERVICE_CATALOG_MESSAGES.requirementField.fieldNameRequired;
    } else if (fieldName.length < 2 || fieldName.length > 100) {
      errors.FieldName = SERVICE_CATALOG_MESSAGES.requirementField.fieldNameLength(2, 100);
    } else if (!IDENTIFIER_REGEX.test(fieldName)) {
      errors.FieldName = SERVICE_CATALOG_MESSAGES.requirementField.fieldNameFormat;
    }

    // Field Label
    if (!fieldLabel) {
      errors.FieldLabel = SERVICE_CATALOG_MESSAGES.requirementField.fieldLabelRequired;
    } else if (fieldLabel.length < 2 || fieldLabel.length > 100) {
      errors.FieldLabel = SERVICE_CATALOG_MESSAGES.requirementField.fieldLabelLength(2, 100);
    }

    // Field Type
    if (!fieldType) {
      errors.FieldType = SERVICE_CATALOG_MESSAGES.requirementField.fieldTypeRequired;
    }

    // Display Order
    if (isNaN(displayOrder) || displayOrder < 0 || !Number.isInteger(displayOrder)) {
      errors.DisplayOrder = SERVICE_CATALOG_MESSAGES.requirementField.displayOrderPositive;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        FieldName: fieldName,
        FieldLabel: fieldLabel,
        FieldType: fieldType,
        IsRequired: formData.IsRequired ? 1 : 0,
        ValidationRegex: formData.ValidationRegex?.trim() || null,
        DisplayOrder: isNaN(displayOrder) ? 0 : displayOrder,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 6. Service Requirement: Attachment Requirement Schema
   * Validates Attachment Name, Allowed Extensions, and Max File Size.
   */
  serviceRequirementAttachmentForm: (formData) => {
    const errors = {};
    const attachmentName = inputSanitizer.normalizeText(formData.AttachmentName || '');
    const description = inputSanitizer.normalizeText(formData.Description || '');
    const allowedExtensions = inputSanitizer.normalizeText(formData.AllowedExtensions || '').toLowerCase();
    const maxFileSizeMB = formData.MaxFileSizeMB !== '' && formData.MaxFileSizeMB !== undefined
      ? Number(formData.MaxFileSizeMB)
      : 10;

    // Attachment Name
    if (!attachmentName) {
      errors.AttachmentName = SERVICE_CATALOG_MESSAGES.requirementAttachment.attachmentNameRequired;
    } else if (attachmentName.length < 2 || attachmentName.length > 100) {
      errors.AttachmentName = SERVICE_CATALOG_MESSAGES.requirementAttachment.attachmentNameLength(2, 100);
    }

    // Allowed Extensions
    if (!allowedExtensions) {
      errors.AllowedExtensions = SERVICE_CATALOG_MESSAGES.requirementAttachment.allowedExtensionsRequired;
    } else if (!EXTENSION_LIST_REGEX.test(allowedExtensions.replace(/\./g, ''))) {
      errors.AllowedExtensions = SERVICE_CATALOG_MESSAGES.requirementAttachment.allowedExtensionsFormat;
    }

    // Max File Size
    if (isNaN(maxFileSizeMB) || maxFileSizeMB < 1 || maxFileSizeMB > 100 || !Number.isInteger(maxFileSizeMB)) {
      errors.MaxFileSizeMB = SERVICE_CATALOG_MESSAGES.requirementAttachment.maxFileSizeRange(1, 100);
    }

    // Description
    if (description && description.length > 500) {
      errors.Description = SERVICE_CATALOG_MESSAGES.requirementAttachment.descriptionMaxLength(500);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        AttachmentName: attachmentName,
        Description: description || null,
        AllowedExtensions: allowedExtensions.replace(/\s+/g, ''),
        MaxFileSizeMB: isNaN(maxFileSizeMB) ? 10 : maxFileSizeMB,
        IsRequired: formData.IsRequired ? 1 : 0,
        IsActive: formData.IsActive !== undefined ? Number(formData.IsActive) : 1
      }
    };
  },

  /**
   * 7. Service Governance: Department Assignment Schema
   * Validates Department selection and duplicate prevention.
   */
  serviceDepartmentAssignForm: (formData, existingAssignments = []) => {
    const errors = {};
    const deptId = formData.DepartmentID !== '' && formData.DepartmentID !== undefined
      ? Number(formData.DepartmentID)
      : null;

    if (!deptId || isNaN(deptId) || deptId <= 0) {
      errors.DepartmentID = SERVICE_CATALOG_MESSAGES.governance.departmentRequired;
    } else if (Array.isArray(existingAssignments) && existingAssignments.some(a => Number(a.DepartmentID) === deptId)) {
      errors.DepartmentID = SERVICE_CATALOG_MESSAGES.governance.departmentAlreadyAssigned;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        DepartmentID: deptId,
        IsPrimary: formData.IsPrimary ? 1 : 0
      }
    };
  },

  /**
   * 8. Service Governance: Approval Rule Schema
   * Validates Rule Name, Required Stages Count, and Auto-Approve Limit.
   */
  serviceApprovalRuleForm: (formData) => {
    const errors = {};
    const ruleName = inputSanitizer.normalizeText(formData.ApprovalRuleName || '');
    const stagesCount = formData.RequiredStagesCount !== '' && formData.RequiredStagesCount !== undefined
      ? Number(formData.RequiredStagesCount)
      : 1;
    const autoLimit = formData.AutoApproveLimit !== '' && formData.AutoApproveLimit !== null && formData.AutoApproveLimit !== undefined
      ? Number(formData.AutoApproveLimit)
      : null;

    if (!ruleName) {
      errors.ApprovalRuleName = SERVICE_CATALOG_MESSAGES.governance.ruleNameRequired;
    } else if (ruleName.length < 3 || ruleName.length > 150) {
      errors.ApprovalRuleName = SERVICE_CATALOG_MESSAGES.governance.ruleNameLength(3, 150);
    }

    if (isNaN(stagesCount) || stagesCount < 1 || stagesCount > 10 || !Number.isInteger(stagesCount)) {
      errors.RequiredStagesCount = SERVICE_CATALOG_MESSAGES.governance.stagesCountRange(1, 10);
    }

    if (autoLimit !== null) {
      if (isNaN(autoLimit) || autoLimit < 0) {
        errors.AutoApproveLimit = SERVICE_CATALOG_MESSAGES.governance.autoApproveNonNegative;
      } else {
        const limitStr = String(formData.AutoApproveLimit);
        if (limitStr.includes('.') && limitStr.split('.')[1].length > 2) {
          errors.AutoApproveLimit = SERVICE_CATALOG_MESSAGES.governance.autoApprovePrecision;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        ApprovalRuleName: ruleName,
        RequiredStagesCount: isNaN(stagesCount) ? 1 : stagesCount,
        AutoApproveLimit: autoLimit === null || isNaN(autoLimit) ? null : Number(autoLimit.toFixed(2))
      }
    };
  }
};

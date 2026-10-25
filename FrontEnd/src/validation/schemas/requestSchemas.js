import { VALIDATION_LIMITS } from '../constants/validationConstants';
import { VALIDATION_MESSAGES, ISSUE_MANAGEMENT_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';
import { fileSchemas } from './fileSchemas';

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'];
const VALID_REQUEST_TYPES = ['COMPLAINT', 'MAINTENANCE', 'INCIDENT', 'DISRUPTION', 'SERVICE_REQUEST', 'GENERAL'];
const VALID_RESOLUTION_TYPES = ['WORKAROUND', 'PERMANENT_FIX', 'REPLACEMENT'];

export const requestSchemas = {
  /**
   * 1. Create Issue Request Schema
   * Validates Title, Description, Service/Category, Priority, Request Type, Requester, and Attachments.
   */
  createIssueRequest: (formData, files = []) => {
    const errors = {};
    const title = inputSanitizer.normalizeText(formData.Title || formData.subject || formData.title);
    const description = inputSanitizer.normalizeText(formData.Description || formData.description);
    const location = inputSanitizer.normalizeText(formData.Location || formData.location);
    const serviceCategoryId = formData.ServiceCategoryID !== undefined && formData.ServiceCategoryID !== '' && formData.ServiceCategoryID !== null
      ? Number(formData.ServiceCategoryID)
      : null;
    const serviceId = formData.ServiceID !== undefined && formData.ServiceID !== '' && formData.ServiceID !== null
      ? Number(formData.ServiceID)
      : null;
    const priorityCode = (formData.PriorityCode || formData.priority || 'MEDIUM').toUpperCase();
    const requestTypeCode = (formData.RequestTypeCode || formData.type || 'INCIDENT').toUpperCase();
    const requesterUserId = formData.RequesterUserID !== undefined && formData.RequesterUserID !== '' && formData.RequesterUserID !== null
      ? Number(formData.RequesterUserID)
      : null;
    const categoryCode = inputSanitizer.normalizeText(formData.CategoryCode || '').toUpperCase();

    // Title validation
    if (!title) {
      errors.Title = ISSUE_MANAGEMENT_MESSAGES.request.titleRequired;
    } else if (title.length < 3 || title.length > 255) {
      errors.Title = ISSUE_MANAGEMENT_MESSAGES.request.titleLength(3, 255);
    }

    // Description validation
    if (!description) {
      errors.Description = ISSUE_MANAGEMENT_MESSAGES.request.descriptionRequired;
    } else if (description.length < 10 || description.length > 2000) {
      errors.Description = ISSUE_MANAGEMENT_MESSAGES.request.descriptionLength(10, 2000);
    }

    // Service Item (ServiceID) is optional for ad-hoc / typed requests
    if (!serviceCategoryId && !categoryCode) {
      errors.ServiceCategoryID = ISSUE_MANAGEMENT_MESSAGES.request.categoryRequired;
    }

    // Priority
    if (priorityCode && !VALID_PRIORITIES.includes(priorityCode)) {
      errors.PriorityCode = ISSUE_MANAGEMENT_MESSAGES.request.priorityRequired;
    }

    // Request Type
    if (requestTypeCode && !VALID_REQUEST_TYPES.includes(requestTypeCode)) {
      errors.RequestTypeCode = ISSUE_MANAGEMENT_MESSAGES.request.requestTypeRequired;
    }

    // Requester User ID
    if (requesterUserId !== null && (isNaN(requesterUserId) || requesterUserId <= 0)) {
      errors.RequesterUserID = ISSUE_MANAGEMENT_MESSAGES.request.requesterRequired;
    }

    // Location length
    if (location && location.length > 150) {
      errors.Location = ISSUE_MANAGEMENT_MESSAGES.request.locationLength(150);
    }

    // Category Code length
    if (categoryCode && categoryCode.length > 50) {
      errors.CategoryCode = ISSUE_MANAGEMENT_MESSAGES.request.categoryCodeLength(50);
    }

    // Validate uploaded attachments if provided
    if (files && files.length > 0) {
      const fileValidation = fileSchemas.validateAttachments(files);
      if (!fileValidation.isValid) {
        errors.Attachments = fileValidation.error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        Title: title,
        Description: description,
        ServiceCategoryID: serviceCategoryId,
        ServiceID: serviceId,
        PriorityCode: priorityCode,
        RequestTypeCode: requestTypeCode,
        RequesterUserID: requesterUserId || undefined,
        Location: location || undefined,
        CategoryCode: categoryCode || undefined,
        TenantID: formData.TenantID ? Number(formData.TenantID) : undefined,
        BuildingID: formData.BuildingID ? Number(formData.BuildingID) : undefined,
        OfficeSpaceID: formData.OfficeSpaceID ? Number(formData.OfficeSpaceID) : undefined,
        AssignedDepartmentID: formData.AssignedDepartmentID ? Number(formData.AssignedDepartmentID) : undefined,
        IsMajorIncident: formData.IsMajorIncident ? 1 : 0,
        EstimatedCost: formData.EstimatedCost ? Number(formData.EstimatedCost) : 0
      }
    };
  },

  /**
   * 2. Assign Department Form Schema
   * Validates target department selection and optional assignment remarks.
   */
  assignDepartmentForm: (formData) => {
    const errors = {};
    const deptId = formData.assignedDepartmentId !== undefined && formData.assignedDepartmentId !== '' && formData.assignedDepartmentId !== null
      ? Number(formData.assignedDepartmentId)
      : null;
    const remarks = inputSanitizer.normalizeText(formData.remarks || formData.Remarks || '');

    if (!deptId || isNaN(deptId) || deptId <= 0) {
      errors.assignedDepartmentId = ISSUE_MANAGEMENT_MESSAGES.assignment.departmentRequired;
    }

    if (remarks && remarks.length > 1000) {
      errors.remarks = ISSUE_MANAGEMENT_MESSAGES.assignment.remarksMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        assignedDepartmentId: deptId,
        remarks: remarks || undefined
      }
    };
  },

  /**
   * 3. Status Transition Form Schema
   * Validates status transition selection and enforces required justification on hold/cancellation.
   */
  statusUpdateForm: (formData, currentStatus = null) => {
    const errors = {};
    const status = formData.Status || formData.status || formData.statusCode || '';
    const remarks = inputSanitizer.normalizeText(formData.Remarks || formData.remarks || '');

    if (!status) {
      errors.Status = ISSUE_MANAGEMENT_MESSAGES.statusUpdate.statusRequired;
    }

    // Business rule: Hold/Pending or Cancellation require justification
    if ((status === 'PENDING' || status === 'CANCELLED' || status === 'REJECTED') && !remarks) {
      errors.Remarks = ISSUE_MANAGEMENT_MESSAGES.statusUpdate.remarksRequiredForHoldOrCancel;
    } else if (remarks && remarks.length > 1000) {
      errors.Remarks = ISSUE_MANAGEMENT_MESSAGES.statusUpdate.remarksMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        Status: status,
        Remarks: remarks || undefined
      }
    };
  },

  /**
   * 4. Cancel Issue Schema
   * Validates cancellation reason with length constraints.
   */
  cancelIssueForm: (formData) => {
    const errors = {};
    const reason = inputSanitizer.normalizeText(formData.cancellationReason || formData.reason || '');

    if (!reason) {
      errors.cancellationReason = ISSUE_MANAGEMENT_MESSAGES.cancellation.reasonRequired;
    } else if (reason.length < 5 || reason.length > 1000) {
      errors.cancellationReason = ISSUE_MANAGEMENT_MESSAGES.cancellation.reasonLength(5, 1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        cancellationReason: reason
      }
    };
  },

  /**
   * 5. Root Cause Investigation Schema
   * Validates summary, details, and action plans.
   */
  investigationForm: (formData) => {
    const errors = {};
    const summary = inputSanitizer.normalizeText(formData.RootCauseSummary || '');
    const details = inputSanitizer.normalizeText(formData.RootCauseDetails || '');
    const corrective = inputSanitizer.normalizeText(formData.CorrectiveActionsTaken || '');
    const preventive = inputSanitizer.normalizeText(formData.PreventiveActionsProposed || '');

    if (!summary) {
      errors.RootCauseSummary = ISSUE_MANAGEMENT_MESSAGES.investigation.rootCauseSummaryRequired;
    } else if (summary.length < 5 || summary.length > 1000) {
      errors.RootCauseSummary = ISSUE_MANAGEMENT_MESSAGES.investigation.rootCauseSummaryLength(5, 1000);
    }

    if (details && details.length > 5000) {
      errors.RootCauseDetails = ISSUE_MANAGEMENT_MESSAGES.investigation.detailsMaxLength(5000);
    }

    if (corrective && corrective.length > 2000) {
      errors.CorrectiveActionsTaken = ISSUE_MANAGEMENT_MESSAGES.investigation.correctiveActionsMaxLength(2000);
    }

    if (preventive && preventive.length > 2000) {
      errors.PreventiveActionsProposed = ISSUE_MANAGEMENT_MESSAGES.investigation.preventiveActionsMaxLength(2000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        RootCauseSummary: summary,
        RootCauseDetails: details || null,
        CorrectiveActionsTaken: corrective || null,
        PreventiveActionsProposed: preventive || null
      }
    };
  },

  /**
   * 6. Issue Resolution Schema
   * Validates resolution type, summary, action steps, and verification notes.
   */
  resolutionForm: (formData) => {
    const errors = {};
    const typeCode = formData.ResolutionTypeCode || 'PERMANENT_FIX';
    const summary = inputSanitizer.normalizeText(formData.ResolutionSummary || '');
    const actionSteps = inputSanitizer.normalizeText(formData.ActionStepsTaken || '');
    const notes = inputSanitizer.normalizeText(formData.VerificationNotes || '');

    if (!typeCode || !VALID_RESOLUTION_TYPES.includes(typeCode)) {
      errors.ResolutionTypeCode = ISSUE_MANAGEMENT_MESSAGES.resolution.typeRequired;
    }

    if (!summary) {
      errors.ResolutionSummary = ISSUE_MANAGEMENT_MESSAGES.resolution.summaryRequired;
    } else if (summary.length < 5 || summary.length > 1000) {
      errors.ResolutionSummary = ISSUE_MANAGEMENT_MESSAGES.resolution.summaryLength(5, 1000);
    }

    if (actionSteps && actionSteps.length > 5000) {
      errors.ActionStepsTaken = ISSUE_MANAGEMENT_MESSAGES.resolution.actionStepsMaxLength(5000);
    }

    if (notes && notes.length > 1000) {
      errors.VerificationNotes = ISSUE_MANAGEMENT_MESSAGES.resolution.verificationNotesMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        ResolutionTypeCode: typeCode,
        ResolutionSummary: summary,
        ActionStepsTaken: actionSteps || null,
        VerificationNotes: notes || null
      }
    };
  },

  /**
   * 7. Comment Form Schema
   * Validates non-empty comment body and length constraints.
   */
  commentForm: (formData) => {
    const errors = {};
    const commentText = inputSanitizer.normalizeText(formData.CommentText || formData.comment);

    if (!commentText) {
      errors.CommentText = ISSUE_MANAGEMENT_MESSAGES.comment.textRequired;
    } else if (commentText.length > 2000) {
      errors.CommentText = ISSUE_MANAGEMENT_MESSAGES.comment.textMaxLength(2000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        CommentText: commentText,
        IsInternal: Boolean(formData.IsInternal)
      }
    };
  },

  /**
   * 8. Feedback Rating Schema
   * Validates satisfaction score (1-5) and feedback commentary.
   */
  feedbackForm: (formData) => {
    const errors = {};
    const rating = formData.Rating !== undefined && formData.Rating !== ''
      ? Number(formData.Rating)
      : (formData.OverallRating !== undefined ? Number(formData.OverallRating) : 5);
    const comments = inputSanitizer.normalizeText(formData.Comments || formData.comments || '');

    if (isNaN(rating) || rating < 1 || rating > 5) {
      errors.Rating = ISSUE_MANAGEMENT_MESSAGES.feedback.ratingRequired;
    }

    if (comments && comments.length > 1000) {
      errors.Comments = ISSUE_MANAGEMENT_MESSAGES.feedback.commentsMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        Rating: rating,
        TimelinessRating: formData.TimelinessRating ? Number(formData.TimelinessRating) : rating,
        QualityRating: formData.QualityRating ? Number(formData.QualityRating) : rating,
        Comments: comments || null
      }
    };
  },

  /**
   * 10. Assign Technician Schema
   */
  assignTechnicianForm: (formData) => {
    const errors = {};
    const techId = formData.TechnicianUserID ? Number(formData.TechnicianUserID) : '';
    const teamId = formData.TechnicianTeamID ? Number(formData.TechnicianTeamID) : '';

    if (!techId && !teamId) {
      errors.Assignment = ISSUE_MANAGEMENT_MESSAGES.assignment.technicianRequired;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        TechnicianUserID: techId || undefined,
        TechnicianTeamID: teamId || undefined,
        Remarks: inputSanitizer.normalizeText(formData.Remarks || '')
      }
    };
  }
};

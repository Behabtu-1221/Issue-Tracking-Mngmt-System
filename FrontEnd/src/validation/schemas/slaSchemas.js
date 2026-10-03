import { inputSanitizer } from '../sanitizers/inputSanitizer';
import { VALIDATION_MESSAGES, SLA_ESCALATION_MESSAGES } from '../messages/validationMessages';

const VALID_RESOLUTION_TYPES = ['PERMANENT_FIX', 'WORKAROUND', 'REPLACEMENT'];

export const slaSchemas = {
  /**
   * 1. SLA Policy Configuration Form Schema
   * Validates policy metadata and priority-specific target response/resolution tiers.
   */
  policyForm: (formData, stages = []) => {
    const errors = {};
    const name = inputSanitizer.normalizeText(formData.PolicyName || formData.policyName || '');
    const desc = inputSanitizer.normalizeText(formData.Description || formData.description || '');

    // Policy Name
    if (!name) {
      errors.PolicyName = SLA_ESCALATION_MESSAGES.policy.nameRequired;
    } else if (name.length < 3 || name.length > 100) {
      errors.PolicyName = SLA_ESCALATION_MESSAGES.policy.nameLength(3, 100);
    }

    // Description
    if (desc && desc.length > 1000) {
      errors.Description = SLA_ESCALATION_MESSAGES.policy.descriptionMaxLength(1000);
    }

    // Stages / Priority Target Deadlines
    const stageList = Array.isArray(stages) ? stages : [];
    if (stageList.length === 0) {
      errors.stages = SLA_ESCALATION_MESSAGES.policy.stagesRequired;
    } else {
      const seenPriorities = new Set();
      const sanitizedStages = [];

      stageList.forEach((stage, idx) => {
        const priorityCode = (stage.PriorityCode || '').toString().trim().toUpperCase();
        const respMin = stage.TargetResponseMinutes !== undefined && stage.TargetResponseMinutes !== ''
          ? Number(stage.TargetResponseMinutes)
          : NaN;
        const resolMin = stage.TargetResolutionMinutes !== undefined && stage.TargetResolutionMinutes !== ''
          ? Number(stage.TargetResolutionMinutes)
          : NaN;

        // Priority code
        if (!priorityCode) {
          errors[`stage_${idx}_PriorityCode`] = SLA_ESCALATION_MESSAGES.policy.priorityCodeRequired;
        } else if (seenPriorities.has(priorityCode)) {
          errors[`stage_${idx}_PriorityCode`] = SLA_ESCALATION_MESSAGES.policy.stageDuplicatePriority(priorityCode);
        } else {
          seenPriorities.add(priorityCode);
        }

        // Response target
        if (isNaN(respMin)) {
          errors[`stage_${idx}_TargetResponseMinutes`] = SLA_ESCALATION_MESSAGES.policy.targetResponseRequired;
        } else if (respMin < 1) {
          errors[`stage_${idx}_TargetResponseMinutes`] = SLA_ESCALATION_MESSAGES.policy.targetResponsePositive;
        } else if (respMin > 43200) {
          errors[`stage_${idx}_TargetResponseMinutes`] = SLA_ESCALATION_MESSAGES.policy.targetResponseMax(43200);
        }

        // Resolution target
        if (isNaN(resolMin)) {
          errors[`stage_${idx}_TargetResolutionMinutes`] = SLA_ESCALATION_MESSAGES.policy.targetResolutionRequired;
        } else if (resolMin < 1) {
          errors[`stage_${idx}_TargetResolutionMinutes`] = SLA_ESCALATION_MESSAGES.policy.targetResolutionPositive;
        } else if (resolMin > 43200) {
          errors[`stage_${idx}_TargetResolutionMinutes`] = SLA_ESCALATION_MESSAGES.policy.targetResolutionMax(43200);
        }

        // Business Rule: Resolution Target must be >= Response Target
        if (!isNaN(respMin) && !isNaN(resolMin) && resolMin < respMin) {
          errors[`stage_${idx}_TargetResolutionMinutes`] = SLA_ESCALATION_MESSAGES.policy.resolutionMustBeGreaterOrEqual;
        }

        sanitizedStages.push({
          PriorityCode: priorityCode,
          TargetResponseMinutes: isNaN(respMin) ? 60 : Math.round(respMin),
          TargetResolutionMinutes: isNaN(resolMin) ? 240 : Math.round(resolMin)
        });
      });

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitized: {
          PolicyName: name,
          Description: desc || undefined,
          BusinessCalendarID: formData.BusinessCalendarID ? Number(formData.BusinessCalendarID) : 1,
          stages: sanitizedStages
        }
      };
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        PolicyName: name,
        Description: desc || undefined,
        BusinessCalendarID: formData.BusinessCalendarID ? Number(formData.BusinessCalendarID) : 1,
        stages: stageList
      }
    };
  },

  /**
   * 2. Pause SLA Clock Countdown Schema
   * Validates blocker justification reason when pausing an active SLA countdown timer.
   */
  pauseClockForm: (formData) => {
    const errors = {};
    const reason = inputSanitizer.normalizeText(formData.pauseReason || formData.Reason || '');

    if (!reason) {
      errors.pauseReason = SLA_ESCALATION_MESSAGES.clock.pauseReasonRequired;
    } else if (reason.length < 5 || reason.length > 500) {
      errors.pauseReason = SLA_ESCALATION_MESSAGES.clock.pauseReasonLength(5, 500);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        pauseReason: reason
      }
    };
  },

  /**
   * 3. Work Order Escalation Schema
   * Validates mandatory reason and technical explanation when escalating to management.
   */
  escalateForm: (formData) => {
    const errors = {};
    const reason = inputSanitizer.normalizeText(formData.reason || '');
    const details = inputSanitizer.normalizeText(formData.details || '');

    if (!reason) {
      errors.reason = SLA_ESCALATION_MESSAGES.escalation.reasonRequired;
    } else if (reason.length < 5 || reason.length > 250) {
      errors.reason = SLA_ESCALATION_MESSAGES.escalation.reasonLength(5, 250);
    }

    if (details && details.length > 1000) {
      errors.details = SLA_ESCALATION_MESSAGES.escalation.detailsMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        reason,
        details: details || undefined
      }
    };
  },

  /**
   * 4. Diagnostic Technical Investigation Schema
   * Validates root cause summary, diagnostic details, and corrective actions.
   */
  investigationForm: (formData) => {
    const errors = {};
    const summary = inputSanitizer.normalizeText(formData.RootCauseSummary || '');
    const details = inputSanitizer.normalizeText(formData.RootCauseDetails || '');
    const actions = inputSanitizer.normalizeText(formData.CorrectiveActionsTaken || '');

    if (!summary) {
      errors.RootCauseSummary = SLA_ESCALATION_MESSAGES.investigation.rootCauseSummaryRequired;
    } else if (summary.length < 5 || summary.length > 500) {
      errors.RootCauseSummary = SLA_ESCALATION_MESSAGES.investigation.rootCauseSummaryLength(5, 500);
    }

    if (details && details.length > 2000) {
      errors.RootCauseDetails = SLA_ESCALATION_MESSAGES.investigation.rootCauseDetailsMaxLength(2000);
    }

    if (actions && actions.length > 2000) {
      errors.CorrectiveActionsTaken = SLA_ESCALATION_MESSAGES.investigation.correctiveActionsMaxLength(2000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        RootCauseSummary: summary,
        RootCauseDetails: details || undefined,
        CorrectiveActionsTaken: actions || undefined
      }
    };
  },

  /**
   * 5. Structured Resolution Schema
   * Validates resolution summary, resolution type, action steps, and verification notes.
   */
  resolutionForm: (formData) => {
    const errors = {};
    const summary = inputSanitizer.normalizeText(formData.ResolutionSummary || formData.workNotes || '');
    const type = formData.ResolutionTypeCode || 'PERMANENT_FIX';
    const actionSteps = inputSanitizer.normalizeText(formData.ActionStepsTaken || '');
    const verificationNotes = inputSanitizer.normalizeText(formData.VerificationNotes || '');

    if (!summary) {
      errors.ResolutionSummary = SLA_ESCALATION_MESSAGES.resolution.summaryRequired;
    } else if (summary.length < 5 || summary.length > 2000) {
      errors.ResolutionSummary = SLA_ESCALATION_MESSAGES.resolution.summaryLength(5, 2000);
    }

    if (type && !VALID_RESOLUTION_TYPES.includes(type)) {
      errors.ResolutionTypeCode = SLA_ESCALATION_MESSAGES.resolution.typeRequired;
    }

    if (actionSteps && actionSteps.length > 2000) {
      errors.ActionStepsTaken = SLA_ESCALATION_MESSAGES.resolution.actionStepsMaxLength(2000);
    }

    if (verificationNotes && verificationNotes.length > 1000) {
      errors.VerificationNotes = SLA_ESCALATION_MESSAGES.resolution.verificationNotesMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        ResolutionSummary: summary,
        ResolutionTypeCode: type,
        ActionStepsTaken: actionSteps || undefined,
        VerificationNotes: verificationNotes || undefined
      }
    };
  },

  /**
   * 6. Requester Information Request Schema
   * Validates inquiry message sent back to the customer/tenant.
   */
  requestInfoForm: (formData) => {
    const errors = {};
    const message = inputSanitizer.normalizeText(formData.infoMessage || '');

    if (!message) {
      errors.infoMessage = SLA_ESCALATION_MESSAGES.infoRequest.messageRequired;
    } else if (message.length < 5 || message.length > 1000) {
      errors.infoMessage = SLA_ESCALATION_MESSAGES.infoRequest.messageLength(5, 1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        infoMessage: message
      }
    };
  }
};

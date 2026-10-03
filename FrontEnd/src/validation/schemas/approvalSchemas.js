import { VALIDATION_MESSAGES, APPROVAL_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';

const VALID_DECISION_CODES = ['APPROVED', 'REJECTED', 'RETURNED_FOR_CORRECTION'];

export const approvalSchemas = {
  /**
   * 1. Create Approval Workflow Schema
   * Validates RequestID, Title, Description, and Stages Pipeline.
   */
  createWorkflowForm: (formData) => {
    const errors = {};
    const requestId = formData.RequestID !== undefined && formData.RequestID !== '' && formData.RequestID !== null
      ? Number(formData.RequestID)
      : null;
    const title = inputSanitizer.normalizeText(formData.Title || formData.title);
    const description = inputSanitizer.normalizeText(formData.Description || formData.description);
    const stages = Array.isArray(formData.stages) ? formData.stages : [];

    // RequestID validation
    if (!requestId) {
      errors.RequestID = APPROVAL_MESSAGES.workflow.requestIdRequired;
    } else if (isNaN(requestId) || !Number.isInteger(requestId) || requestId <= 0) {
      errors.RequestID = APPROVAL_MESSAGES.workflow.requestIdPositive;
    }

    // Title validation
    if (!title) {
      errors.Title = APPROVAL_MESSAGES.workflow.titleRequired;
    } else if (title.length < 3 || title.length > 250) {
      errors.Title = APPROVAL_MESSAGES.workflow.titleLength(3, 250);
    }

    // Description validation
    if (description && description.length > 1000) {
      errors.Description = APPROVAL_MESSAGES.workflow.descriptionMaxLength(1000);
    }

    // Stages validation
    if (!stages || stages.length === 0) {
      errors.stages = APPROVAL_MESSAGES.workflow.stagesMinLength;
    } else {
      stages.forEach((st, idx) => {
        const stageNum = st.StageNumber || idx + 1;
        const approverUser = st.ApproverUserID !== undefined && st.ApproverUserID !== '' && st.ApproverUserID !== null
          ? Number(st.ApproverUserID)
          : null;
        const approverGroup = st.ApproverGroupID !== undefined && st.ApproverGroupID !== '' && st.ApproverGroupID !== null
          ? Number(st.ApproverGroupID)
          : null;

        if (!approverUser && !approverGroup) {
          errors[`stage_${idx}`] = APPROVAL_MESSAGES.workflow.approverRequired(stageNum);
        } else {
          if (approverUser !== null && (isNaN(approverUser) || !Number.isInteger(approverUser) || approverUser <= 0)) {
            errors[`stage_${idx}_ApproverUserID`] = APPROVAL_MESSAGES.workflow.approverUserIdPositive(stageNum);
          }
          if (approverGroup !== null && (isNaN(approverGroup) || !Number.isInteger(approverGroup) || approverGroup <= 0)) {
            errors[`stage_${idx}_ApproverGroupID`] = APPROVAL_MESSAGES.workflow.approverGroupIdPositive(stageNum);
          }
        }
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        RequestID: requestId,
        Title: title,
        Description: description || undefined,
        stages: stages.map((s, idx) => ({
          StageNumber: s.StageNumber || idx + 1,
          ApproverUserID: s.ApproverUserID ? Number(s.ApproverUserID) : null,
          ApproverGroupID: s.ApproverGroupID ? Number(s.ApproverGroupID) : null
        }))
      }
    };
  },

  /**
   * 2. Submit Decision Schema
   * Validates DecisionCode, Comments (enforces mandatory comments for rejection or return).
   */
  decisionForm: (formData) => {
    const errors = {};
    const decisionCode = (formData.DecisionCode || '').toUpperCase().trim();
    const comments = inputSanitizer.normalizeText(formData.Comments || formData.comments || '');

    // DecisionCode validation
    if (!decisionCode) {
      errors.DecisionCode = APPROVAL_MESSAGES.decision.decisionRequired;
    } else if (!VALID_DECISION_CODES.includes(decisionCode)) {
      errors.DecisionCode = APPROVAL_MESSAGES.decision.decisionInvalid;
    }

    // Comments validation
    if (decisionCode && decisionCode !== 'APPROVED') {
      if (!comments || comments.length === 0) {
        errors.Comments = APPROVAL_MESSAGES.decision.commentsRequiredForRejectOrReturn;
      }
    }

    if (comments && comments.length > 1000) {
      errors.Comments = APPROVAL_MESSAGES.decision.commentsMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        DecisionCode: decisionCode,
        Comments: comments || ''
      }
    };
  },

  /**
   * 3. Approval Delegation Schema
   * Validates Delegator, Delegatee, Date range, and Reason.
   */
  delegationForm: (formData) => {
    const errors = {};
    const delegatorId = formData.DelegatorUserID !== undefined && formData.DelegatorUserID !== '' && formData.DelegatorUserID !== null
      ? Number(formData.DelegatorUserID)
      : null;
    const delegateeId = formData.DelegateeUserID !== undefined && formData.DelegateeUserID !== '' && formData.DelegateeUserID !== null
      ? Number(formData.DelegateeUserID)
      : null;
    const startStr = formData.StartDateTime;
    const endStr = formData.EndDateTime;
    const reason = inputSanitizer.normalizeText(formData.Reason || '');

    // Delegator validation
    if (!delegatorId) {
      errors.DelegatorUserID = APPROVAL_MESSAGES.delegation.delegatorRequired;
    } else if (isNaN(delegatorId) || !Number.isInteger(delegatorId) || delegatorId <= 0) {
      errors.DelegatorUserID = APPROVAL_MESSAGES.delegation.delegatorPositive;
    }

    // Delegatee validation
    if (!delegateeId) {
      errors.DelegateeUserID = APPROVAL_MESSAGES.delegation.delegateeRequired;
    } else if (isNaN(delegateeId) || !Number.isInteger(delegateeId) || delegateeId <= 0) {
      errors.DelegateeUserID = APPROVAL_MESSAGES.delegation.delegateePositive;
    }

    // Delegator !== Delegatee
    if (delegatorId && delegateeId && delegatorId === delegateeId) {
      errors.DelegateeUserID = APPROVAL_MESSAGES.delegation.sameUserDelegation;
    }

    // Start Date validation
    let startDate = null;
    if (!startStr) {
      errors.StartDateTime = APPROVAL_MESSAGES.delegation.startDateRequired;
    } else {
      startDate = new Date(startStr);
      if (isNaN(startDate.getTime())) {
        errors.StartDateTime = VALIDATION_MESSAGES.invalidFormat('start date & time');
      }
    }

    // End Date validation
    let endDate = null;
    if (!endStr) {
      errors.EndDateTime = APPROVAL_MESSAGES.delegation.endDateRequired;
    } else {
      endDate = new Date(endStr);
      if (isNaN(endDate.getTime())) {
        errors.EndDateTime = VALIDATION_MESSAGES.invalidFormat('end date & time');
      }
    }

    // Chronology check
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (endDate <= startDate) {
        errors.EndDateTime = APPROVAL_MESSAGES.delegation.endDateAfterStartDate;
      }
    }

    // Reason validation
    if (reason && reason.length > 500) {
      errors.Reason = APPROVAL_MESSAGES.delegation.reasonMaxLength(500);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        DelegatorUserID: delegatorId,
        DelegateeUserID: delegateeId,
        StartDateTime: startDate ? startDate.toISOString() : startStr,
        EndDateTime: endDate ? endDate.toISOString() : endStr,
        Reason: reason || undefined
      }
    };
  },

  /**
   * 4. Governance Rule Schema
   * Validates RuleName, MinCost, MaxCost, CurrencyCode.
   */
  approvalRuleForm: (formData) => {
    const errors = {};
    const ruleName = inputSanitizer.normalizeText(formData.RuleName || formData.ruleName);
    const description = inputSanitizer.normalizeText(formData.Description || formData.description);
    const minCostRaw = formData.MinCost !== undefined && formData.MinCost !== '' && formData.MinCost !== null
      ? Number(formData.MinCost)
      : 0;
    const maxCostRaw = formData.MaxCost !== undefined && formData.MaxCost !== '' && formData.MaxCost !== null
      ? Number(formData.MaxCost)
      : null;
    const currency = (formData.CurrencyCode || 'USD').toUpperCase().trim();

    // Rule name
    if (!ruleName) {
      errors.RuleName = APPROVAL_MESSAGES.rule.ruleNameRequired;
    } else if (ruleName.length < 3 || ruleName.length > 150) {
      errors.RuleName = APPROVAL_MESSAGES.rule.ruleNameLength(3, 150);
    }

    // Description
    if (description && description.length > 1000) {
      errors.Description = APPROVAL_MESSAGES.rule.descriptionMaxLength(1000);
    }

    // Min Cost
    if (isNaN(minCostRaw) || minCostRaw < 0) {
      errors.MinCost = APPROVAL_MESSAGES.rule.minCostNegative;
    } else {
      const minCostStr = minCostRaw.toString();
      if (minCostStr.includes('.') && minCostStr.split('.')[1].length > 2) {
        errors.MinCost = APPROVAL_MESSAGES.rule.minCostPrecision;
      }
    }

    // Max Cost
    if (maxCostRaw !== null) {
      if (isNaN(maxCostRaw) || maxCostRaw < 0) {
        errors.MaxCost = APPROVAL_MESSAGES.rule.maxCostNegative;
      } else {
        const maxCostStr = maxCostRaw.toString();
        if (maxCostStr.includes('.') && maxCostStr.split('.')[1].length > 2) {
          errors.MaxCost = APPROVAL_MESSAGES.rule.maxCostPrecision;
        } else if (!isNaN(minCostRaw) && maxCostRaw < minCostRaw) {
          errors.MaxCost = APPROVAL_MESSAGES.rule.maxCostGreaterThanMin;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        RuleName: ruleName,
        Description: description || undefined,
        MinCost: minCostRaw,
        MaxCost: maxCostRaw,
        CurrencyCode: currency
      }
    };
  },

  /**
   * 5. Approver Group Schema
   * Validates GroupName, Description.
   */
  approvalGroupForm: (formData) => {
    const errors = {};
    const groupName = inputSanitizer.normalizeText(formData.GroupName || formData.groupName);
    const description = inputSanitizer.normalizeText(formData.Description || formData.description);

    // Group name
    if (!groupName) {
      errors.GroupName = APPROVAL_MESSAGES.group.groupNameRequired;
    } else if (groupName.length < 2 || groupName.length > 150) {
      errors.GroupName = APPROVAL_MESSAGES.group.groupNameLength(2, 150);
    }

    // Description
    if (description && description.length > 500) {
      errors.Description = APPROVAL_MESSAGES.group.descriptionMaxLength(500);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        GroupName: groupName,
        Description: description || undefined
      }
    };
  }
};

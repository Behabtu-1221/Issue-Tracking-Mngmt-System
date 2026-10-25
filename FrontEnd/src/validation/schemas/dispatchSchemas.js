import { VALIDATION_MESSAGES, DISPATCH_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';

const VALID_RESOLUTION_TYPES = ['PERMANENT_FIX', 'WORKAROUND', 'REPLACEMENT'];
const TEAM_CODE_REGEX = /^[A-Za-z0-9_-]{2,50}$/;

export const dispatchSchemas = {
  /**
   * 1. Manual Dispatch Assignment Schema
   * Validates RequestID, Assign Mode (Individual vs Team), Target ID, and Remarks.
   */
  manualAssignForm: (formData) => {
    const errors = {};
    const requestId = formData.RequestID !== undefined && formData.RequestID !== '' && formData.RequestID !== null
      ? Number(formData.RequestID)
      : null;
    const assignMode = (formData.assignMode || 'INDIVIDUAL').toUpperCase();
    const assignedUserId = formData.AssignedUserID !== undefined && formData.AssignedUserID !== '' && formData.AssignedUserID !== null
      ? Number(formData.AssignedUserID)
      : null;
    const assignedTeamId = formData.AssignedTeamID !== undefined && formData.AssignedTeamID !== '' && formData.AssignedTeamID !== null
      ? Number(formData.AssignedTeamID)
      : null;
    const remarks = inputSanitizer.normalizeText(formData.Remarks || '');

    // RequestID validation
    if (!requestId) {
      errors.RequestID = DISPATCH_MESSAGES.assignment.requestIdRequired;
    } else if (isNaN(requestId) || !Number.isInteger(requestId) || requestId <= 0) {
      errors.RequestID = DISPATCH_MESSAGES.assignment.requestIdPositive;
    }

    // Target Selection validation based on mode
    if (assignMode === 'TEAM') {
      if (!assignedTeamId || isNaN(assignedTeamId) || assignedTeamId <= 0) {
        errors.AssignedTeamID = DISPATCH_MESSAGES.assignment.teamRequired;
      }
    } else {
      if (!assignedUserId || isNaN(assignedUserId) || assignedUserId <= 0) {
        errors.AssignedUserID = DISPATCH_MESSAGES.assignment.technicianRequired;
      }
    }

    // Remarks length
    if (remarks && remarks.length > 1000) {
      errors.Remarks = DISPATCH_MESSAGES.assignment.remarksMaxLength(1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        RequestID: requestId,
        AssignedUserID: assignMode === 'INDIVIDUAL' ? assignedUserId : (assignedUserId || undefined),
        AssignedTeamID: assignMode === 'TEAM' ? assignedTeamId : undefined,
        Remarks: remarks || undefined
      }
    };
  },

  /**
   * 2. Decline / Reject Dispatch Assignment Schema
   * Enforces mandatory, descriptive reason when technician declines a job.
   */
  declineAssignmentForm: (formData) => {
    const errors = {};
    const reason = inputSanitizer.normalizeText(formData.rejectionReason || formData.Reason || '');

    if (!reason) {
      errors.rejectionReason = DISPATCH_MESSAGES.execution.rejectionReasonRequired;
    } else if (reason.length < 5 || reason.length > 500) {
      errors.rejectionReason = DISPATCH_MESSAGES.execution.rejectionReasonLength(5, 500);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        rejectionReason: reason
      }
    };
  },

  /**
   * 3. Pause Field Work Schema
   * Enforces mandatory reason when technician pauses on-site work.
   */
  pauseWorkForm: (formData) => {
    const errors = {};
    const reason = inputSanitizer.normalizeText(formData.pauseReason || formData.Reason || '');

    if (!reason) {
      errors.pauseReason = DISPATCH_MESSAGES.execution.pauseReasonRequired;
    } else if (reason.length < 3 || reason.length > 500) {
      errors.pauseReason = DISPATCH_MESSAGES.execution.pauseReasonLength(3, 500);
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
   * 4. Complete Field Work Schema
   * Validates work completion notes, resolution summary, and actions taken.
   */
  completeWorkForm: (formData) => {
    const errors = {};
    const notes = inputSanitizer.normalizeText(formData.workNotes || formData.ResolutionSummary || '');
    const resolutionType = formData.ResolutionTypeCode || 'PERMANENT_FIX';
    const actionSteps = inputSanitizer.normalizeText(formData.ActionStepsTaken || '');
    const verificationNotes = inputSanitizer.normalizeText(formData.VerificationNotes || '');

    if (!notes) {
      errors.workNotes = DISPATCH_MESSAGES.execution.workNotesRequired;
    } else if (notes.length < 5 || notes.length > 2000) {
      errors.workNotes = DISPATCH_MESSAGES.execution.workNotesLength(5, 2000);
    }

    if (resolutionType && !VALID_RESOLUTION_TYPES.includes(resolutionType)) {
      errors.ResolutionTypeCode = DISPATCH_MESSAGES.execution.resolutionTypeRequired;
    }

    if (actionSteps && actionSteps.length > 2000) {
      errors.ActionStepsTaken = VALIDATION_MESSAGES.maxLength('Action steps', 2000);
    }

    if (verificationNotes && verificationNotes.length > 1000) {
      errors.VerificationNotes = VALIDATION_MESSAGES.maxLength('Verification notes', 1000);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        workNotes: notes,
        ResolutionSummary: notes,
        ResolutionTypeCode: resolutionType,
        ActionStepsTaken: actionSteps || undefined,
        VerificationNotes: verificationNotes || undefined
      }
    };
  },

  /**
   * 5. Update Field Work Progress Schema
   * Validates technician milestone, completion percentage, and progress log notes.
   */
  updateProgressForm: (formData) => {
    const errors = {};
    const rawPct = formData.progressPercentage ?? formData.percentage ?? 0;
    const progressPercentage = Number(rawPct);
    const milestone = inputSanitizer.normalizeText(formData.milestone || formData.progressMilestone || 'Field Work Execution');
    const notes = inputSanitizer.normalizeText(formData.remarks || formData.notes || formData.workNotes || '');

    if (isNaN(progressPercentage) || progressPercentage < 0 || progressPercentage > 100) {
      errors.progressPercentage = 'Progress must be a valid percentage between 0 and 100%';
    }

    if (!notes) {
      errors.remarks = 'Progress remarks / work notes are required to inform requester and approvers';
    } else if (notes.length < 3 || notes.length > 2000) {
      errors.remarks = 'Progress remarks must be between 3 and 2000 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        progressPercentage,
        milestone,
        remarks: notes,
        estimatedCompletion: formData.estimatedCompletion || null,
        timeSpentMinutes: formData.timeSpentMinutes ? Number(formData.timeSpentMinutes) : null
      }
    };
  },

  /**
   * 6. Escalate Field Work Schema
   * Validates escalation reason and technical details.
   */
  escalateWorkForm: (formData) => {
    const errors = {};
    const reason = inputSanitizer.normalizeText(formData.reason || '');
    const details = inputSanitizer.normalizeText(formData.details || '');

    if (!reason) {
      errors.reason = DISPATCH_MESSAGES.execution.escalateReasonRequired;
    } else if (reason.length < 5 || reason.length > 250) {
      errors.reason = DISPATCH_MESSAGES.execution.escalateReasonLength(5, 250);
    }

    if (details && details.length > 1000) {
      errors.details = DISPATCH_MESSAGES.execution.escalateDetailsMaxLength(1000);
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
   * 6. Technician Work Team Schema
   * Validates TeamName, TeamCode, Description, LeaderUserID, and IsActive.
   */
  teamForm: (formData) => {
    const errors = {};
    const teamName = inputSanitizer.normalizeText(formData.TeamName);
    const teamCode = inputSanitizer.normalizeText(formData.TeamCode).toUpperCase();
    const description = inputSanitizer.normalizeText(formData.Description);
    const leaderUserId = formData.LeaderUserID !== undefined && formData.LeaderUserID !== '' && formData.LeaderUserID !== null
      ? Number(formData.LeaderUserID)
      : null;
    const isActive = formData.IsActive !== undefined ? Number(formData.IsActive) : 1;

    // TeamName validation
    if (!teamName) {
      errors.TeamName = DISPATCH_MESSAGES.team.teamNameRequired;
    } else if (teamName.length < 3 || teamName.length > 150) {
      errors.TeamName = DISPATCH_MESSAGES.team.teamNameLength(3, 150);
    }

    // TeamCode validation
    if (!teamCode) {
      errors.TeamCode = DISPATCH_MESSAGES.team.teamCodeRequired;
    } else if (teamCode.length < 2 || teamCode.length > 50) {
      errors.TeamCode = DISPATCH_MESSAGES.team.teamCodeLength(2, 50);
    } else if (!TEAM_CODE_REGEX.test(teamCode)) {
      errors.TeamCode = DISPATCH_MESSAGES.team.teamCodeFormat;
    }

    // Description validation
    if (description && description.length > 1000) {
      errors.Description = DISPATCH_MESSAGES.team.descriptionMaxLength(1000);
    }

    // LeaderUserID validation
    if (leaderUserId !== null && (isNaN(leaderUserId) || leaderUserId <= 0)) {
      errors.LeaderUserID = DISPATCH_MESSAGES.team.leaderInvalid;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        TeamName: teamName,
        TeamCode: teamCode,
        Description: description || undefined,
        LeaderUserID: leaderUserId || null,
        IsActive: isActive === 0 ? 0 : 1
      }
    };
  },

  /**
   * 7. Add Team Member Schema
   * Validates selected technician and checks for duplicates.
   */
  addTeamMemberForm: (formData, currentMembers = []) => {
    const errors = {};
    const techId = formData.selectedTechId !== undefined && formData.selectedTechId !== '' && formData.selectedTechId !== null
      ? Number(formData.selectedTechId)
      : null;

    if (!techId || isNaN(techId) || techId <= 0) {
      errors.selectedTechId = DISPATCH_MESSAGES.team.memberSelectRequired;
    } else if (currentMembers.some(m => m.UserID === techId)) {
      errors.selectedTechId = DISPATCH_MESSAGES.team.memberAlreadyExists;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        UserID: techId
      }
    };
  }
};

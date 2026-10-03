import { VALIDATION_LIMITS } from '../constants/validationConstants';
import { VALIDATION_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';

export const teamSchemas = {
  teamForm: (formData) => {
    const errors = {};
    const teamName = inputSanitizer.normalizeText(formData.TeamName);
    const description = inputSanitizer.normalizeText(formData.Description);
    const departmentId = formData.DepartmentID ? Number(formData.DepartmentID) : '';

    if (!teamName) {
      errors.TeamName = VALIDATION_MESSAGES.required('Team Name');
    } else if (teamName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
      errors.TeamName = VALIDATION_MESSAGES.minLength('Team Name', VALIDATION_LIMITS.NAME_MIN_LENGTH);
    }

    if (!departmentId) {
      errors.DepartmentID = VALIDATION_MESSAGES.selectRequired('Department');
    }

    if (description && description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      errors.Description = VALIDATION_MESSAGES.maxLength('Description', VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        TeamName: teamName,
        DepartmentID: departmentId,
        Description: description,
        LeadTechnicianID: formData.LeadTechnicianID ? Number(formData.LeadTechnicianID) : null
      }
    };
  }
};

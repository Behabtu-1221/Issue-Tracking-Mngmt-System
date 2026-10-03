import { VALIDATION_LIMITS, REGEX_PATTERNS } from '../constants/validationConstants';
import { VALIDATION_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';

export const authSchemas = {
  login: (formData) => {
    const errors = {};
    const username = inputSanitizer.normalizeText(formData.username);
    const password = formData.password || '';

    if (!username) {
      errors.username = VALIDATION_MESSAGES.required('Username or Email');
    }

    if (!password) {
      errors.password = VALIDATION_MESSAGES.required('Password');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        username,
        password,
        rememberMe: Boolean(formData.rememberMe)
      }
    };
  },

  changePassword: (formData) => {
    const errors = {};
    const currentPassword = formData.currentPassword || '';
    const newPassword = formData.newPassword || '';
    const confirmPassword = formData.confirmPassword || '';

    if (!currentPassword && formData.requireCurrentPassword) {
      errors.currentPassword = VALIDATION_MESSAGES.required('Current Password');
    }

    if (!newPassword) {
      errors.newPassword = VALIDATION_MESSAGES.required('New Password');
    } else if (newPassword.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
      errors.newPassword = VALIDATION_MESSAGES.passwordMinLength(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH);
    } else if (newPassword.length > VALIDATION_LIMITS.PASSWORD_MAX_LENGTH) {
      errors.newPassword = VALIDATION_MESSAGES.maxLength('New Password', VALIDATION_LIMITS.PASSWORD_MAX_LENGTH);
    }

    if (!confirmPassword) {
      errors.confirmPassword = VALIDATION_MESSAGES.required('Confirm Password');
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = VALIDATION_MESSAGES.passwordMismatch;
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = 'New password must be different from current password.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        currentPassword,
        newPassword,
        confirmPassword
      }
    };
  }
};

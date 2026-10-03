import { VALIDATION_LIMITS, REGEX_PATTERNS } from '../constants/validationConstants';
import { VALIDATION_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';

export const userSchemas = {
  userForm: (formData, isEdit = false) => {
    const errors = {};
    const username = inputSanitizer.normalizeText(formData.Username || formData.username);
    const email = inputSanitizer.normalizeText(formData.Email || formData.email);
    const firstName = inputSanitizer.normalizeText(formData.FirstName || formData.firstName);
    const lastName = inputSanitizer.normalizeText(formData.LastName || formData.lastName);
    const phoneNumber = inputSanitizer.normalizeText(formData.PhoneNumber || formData.phoneNumber);

    if (!username) {
      errors.Username = VALIDATION_MESSAGES.required('Username');
    } else if (username.length < VALIDATION_LIMITS.USERNAME_MIN_LENGTH) {
      errors.Username = VALIDATION_MESSAGES.minLength('Username', VALIDATION_LIMITS.USERNAME_MIN_LENGTH);
    } else if (username.length > VALIDATION_LIMITS.USERNAME_MAX_LENGTH) {
      errors.Username = VALIDATION_MESSAGES.maxLength('Username', VALIDATION_LIMITS.USERNAME_MAX_LENGTH);
    } else if (!REGEX_PATTERNS.USERNAME.test(username)) {
      errors.Username = VALIDATION_MESSAGES.invalidUsername;
    }

    if (!email) {
      errors.Email = VALIDATION_MESSAGES.required('Email address');
    } else if (!REGEX_PATTERNS.EMAIL.test(email)) {
      errors.Email = VALIDATION_MESSAGES.invalidEmail;
    } else if (email.length > VALIDATION_LIMITS.EMAIL_MAX_LENGTH) {
      errors.Email = VALIDATION_MESSAGES.maxLength('Email address', VALIDATION_LIMITS.EMAIL_MAX_LENGTH);
    }

    if (!firstName) {
      errors.FirstName = VALIDATION_MESSAGES.required('First Name');
    } else if (firstName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
      errors.FirstName = VALIDATION_MESSAGES.minLength('First Name', VALIDATION_LIMITS.NAME_MIN_LENGTH);
    } else if (firstName.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
      errors.FirstName = VALIDATION_MESSAGES.maxLength('First Name', VALIDATION_LIMITS.NAME_MAX_LENGTH);
    }

    if (!lastName) {
      errors.LastName = VALIDATION_MESSAGES.required('Last Name');
    } else if (lastName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
      errors.LastName = VALIDATION_MESSAGES.minLength('Last Name', VALIDATION_LIMITS.NAME_MIN_LENGTH);
    } else if (lastName.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
      errors.LastName = VALIDATION_MESSAGES.maxLength('Last Name', VALIDATION_LIMITS.NAME_MAX_LENGTH);
    }

    if (phoneNumber && !REGEX_PATTERNS.PHONE.test(phoneNumber)) {
      errors.PhoneNumber = VALIDATION_MESSAGES.invalidPhone;
    }

    if (!isEdit && !formData.Password) {
      errors.Password = VALIDATION_MESSAGES.required('Password');
    } else if (formData.Password && formData.Password.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
      errors.Password = VALIDATION_MESSAGES.passwordMinLength(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        Username: username,
        Email: email,
        FirstName: firstName,
        LastName: lastName,
        PhoneNumber: phoneNumber,
        Password: formData.Password,
        UserTypeCode: formData.UserTypeCode || 'EMPLOYEE',
        TenantID: formData.TenantID ? Number(formData.TenantID) : null,
        DepartmentID: formData.DepartmentID ? Number(formData.DepartmentID) : null
      }
    };
  }
};

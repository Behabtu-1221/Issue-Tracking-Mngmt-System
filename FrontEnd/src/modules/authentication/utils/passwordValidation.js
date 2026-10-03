import { PASSWORD_POLICIES } from '../constants/authConstants';

/**
 * Enterprise Password Complexity Validator & Strength Calculator
 */
export function validatePasswordComplexity(password = '') {
  const hasMinLength = password.length >= PASSWORD_POLICIES.MIN_LENGTH;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  let score = 0;
  if (hasMinLength) score += 20;
  if (password.length >= 12) score += 10;
  if (hasUppercase) score += 20;
  if (hasLowercase) score += 20;
  if (hasNumber) score += 15;
  if (hasSpecialChar) score += 15;

  let label = 'Weak';
  let color = '#ef4444'; // Danger red

  if (score >= 80) {
    label = 'Strong';
    color = '#10b981'; // Emerald green
  } else if (score >= 50) {
    label = 'Fair';
    color = '#f59e0b'; // Amber yellow
  }

  return {
    isValid,
    score,
    label,
    color,
    rules: {
      minLength: hasMinLength,
      uppercase: hasUppercase,
      lowercase: hasLowercase,
      number: hasNumber,
      specialChar: hasSpecialChar
    }
  };
}

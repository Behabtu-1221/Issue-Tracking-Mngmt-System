import { VALIDATION_LIMITS, ALLOWED_FILE_TYPES } from '../constants/validationConstants';
import { VALIDATION_MESSAGES } from '../messages/validationMessages';
import { inputSanitizer } from '../sanitizers/inputSanitizer';

export const fileSchemas = {
  validateFile: (file) => {
    if (!file) {
      return { isValid: false, error: 'No file provided.' };
    }

    const cleanFilename = inputSanitizer.sanitizeFilename(file.name);
    const ext = '.' + cleanFilename.split('.').pop().toLowerCase();

    if (cleanFilename.length > VALIDATION_LIMITS.MAX_FILENAME_LENGTH) {
      return { isValid: false, error: VALIDATION_MESSAGES.filenameTooLong(VALIDATION_LIMITS.MAX_FILENAME_LENGTH) };
    }

    if (file.size > VALIDATION_LIMITS.MAX_FILE_SIZE_BYTES) {
      return { isValid: false, error: VALIDATION_MESSAGES.fileTooLarge(VALIDATION_LIMITS.MAX_FILE_SIZE_MB) };
    }

    const isExtensionAllowed = ALLOWED_FILE_TYPES.ALLOWED_EXTENSIONS.includes(ext);
    const isMimeAllowed = ALLOWED_FILE_TYPES.IMAGES.includes(file.type) || ALLOWED_FILE_TYPES.DOCUMENTS.includes(file.type);

    if (!isExtensionAllowed && !isMimeAllowed) {
      return { isValid: false, error: VALIDATION_MESSAGES.fileTypeNotAllowed };
    }

    return {
      isValid: true,
      cleanFilename,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2)
    };
  },

  validateAttachments: (files = []) => {
    if (!files || files.length === 0) {
      return { isValid: true, sanitizedFiles: [] };
    }

    if (files.length > VALIDATION_LIMITS.MAX_FILE_COUNT) {
      return {
        isValid: false,
        error: VALIDATION_MESSAGES.fileCountExceeded(VALIDATION_LIMITS.MAX_FILE_COUNT)
      };
    }

    for (let i = 0; i < files.length; i++) {
      const check = fileSchemas.validateFile(files[i]);
      if (!check.isValid) {
        return { isValid: false, error: `File "${files[i].name}": ${check.error}` };
      }
    }

    return {
      isValid: true,
      sanitizedFiles: Array.from(files)
    };
  }
};

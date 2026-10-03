import { VALIDATION_LIMITS, REGEX_PATTERNS } from '../constants/validationConstants';

export const inputSanitizer = {
  /**
   * Safely trims surrounding whitespace from text input
   * Preserves legitimate internal spaces.
   */
  normalizeText: (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val !== 'string') return String(val);
    return val.trim();
  },

  /**
   * Normalizes search queries with maximum length constraint
   */
  normalizeSearch: (val) => {
    const text = inputSanitizer.normalizeText(val);
    return text.substring(0, VALIDATION_LIMITS.SEARCH_MAX_LENGTH);
  },

  /**
   * Sanitizes filenames to prevent path traversal & invalid filesystem chars
   */
  sanitizeFilename: (filename) => {
    if (!filename || typeof filename !== 'string') return 'unnamed_file';
    // Strip path traversal attempts and keep safe base filename
    const base = filename.replace(/^.*[\\/]/, '');
    const clean = base
      .replace(REGEX_PATTERNS.PATH_TRAVERSAL, '')
      .replace(/[^\w\s\.\-()]/gi, '_')
      .trim();
    return clean.substring(0, VALIDATION_LIMITS.MAX_FILENAME_LENGTH) || 'unnamed_file';
  },

  /**
   * Escapes HTML special characters to prevent XSS injection
   */
  escapeHtml: (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Clamps numeric inputs to min/max boundaries
   */
  clampNumber: (val, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) => {
    const num = Number(val);
    if (isNaN(num)) return min;
    return Math.min(Math.max(num, min), max);
  }
};

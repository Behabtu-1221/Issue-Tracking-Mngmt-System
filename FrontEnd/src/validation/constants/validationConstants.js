/**
 * Centralized Enterprise Platform Validation Constants
 * All limits align with backend DB column constraints & business rules.
 */

export const VALIDATION_LIMITS = {
  // String length limits
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  CODE_MIN_LENGTH: 2,
  CODE_MAX_LENGTH: 50,
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 150,
  DESCRIPTION_MIN_LENGTH: 5,
  DESCRIPTION_MAX_LENGTH: 2000,
  COMMENT_MIN_LENGTH: 1,
  COMMENT_MAX_LENGTH: 1000,
  SEARCH_MAX_LENGTH: 200,
  URL_MAX_LENGTH: 500,
  EMAIL_MAX_LENGTH: 254,
  PHONE_MAX_LENGTH: 25,
  LOCATION_MAX_LENGTH: 200,

  // File Upload Limits
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_FILE_COUNT: 5,
  MAX_FILENAME_LENGTH: 150,

  // SLA & Numeric Limits
  SLA_HOURS_MIN: 1,
  SLA_HOURS_MAX: 720, // 30 days max
  MONETARY_COST_MIN: 0,
  MONETARY_COST_MAX: 100000000
};

export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv']
};

export const REGEX_PATTERNS = {
  // International Standards-Aware Email Regex
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
  
  // International E.164 & standard phone formats
  PHONE: /^\+?[0-9\s\-()]{7,25}$/,
  
  // Alphanumeric + underscores/hyphens/dots for codes/usernames
  USERNAME: /^[a-zA-Z0-9._-]+$/,
  CODE: /^[a-zA-Z0-9._-]+$/,
  
  // Safe navigational URLs (HTTP/HTTPS only)
  SAFE_URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  
  // General Web URLs (supports optional protocol and domain structure)
  URL: /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i,
  
  // Path traversal prevention pattern
  PATH_TRAVERSAL: /(\.\.|\/|\\)/g
};

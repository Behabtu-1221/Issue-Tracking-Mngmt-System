/**
 * Enterprise Authentication Constants & Configuration
 * Serves as the single source of truth for auth keys, status codes, and security policies.
 */

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'itms_access_token',
  REFRESH_TOKEN: 'itms_refresh_token',
  USER_PROFILE: 'itms_user_profile',
  REMEMBER_USERNAME: 'itms_remembered_username',
  THEME: 'theme'
};

export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',
  MUST_CHANGE_PASSWORD: 'MUST_CHANGE_PASSWORD',
  LOCKED: 'LOCKED',
  SUSPENDED: 'SUSPENDED',
  PENDING_MFA: 'PENDING_MFA'
};

export const DEFAULT_DASHBOARD_ROUTES = {
  PARK_ADMIN: 'parks',
  PARK_SUPER_ADMIN: 'parks',
  SUPER_ADMIN: 'parks',
  TENANT_REPRESENTATIVE: 'issues',
  COMPANY_ADMIN: 'issues',
  TENANT_ADMIN: 'issues',
  DEPARTMENT_MANAGER: 'approvals',
  DISPATCHER: 'dispatch',
  PARK_DISPATCHER: 'dispatch',
  TECHNICIAN: 'issues',
  PARK_TECHNICIAN: 'issues',
  PARK_STAFF: 'services',
  EMPLOYEE: 'services'
};

export const PASSWORD_POLICIES = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true
};

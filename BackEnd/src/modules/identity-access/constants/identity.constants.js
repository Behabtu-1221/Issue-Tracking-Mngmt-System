export const MODULE_NAME = 'identity-access';
export const API_BASE_PATH = '/api';

export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',
  MUST_CHANGE_PASSWORD: 'MUST_CHANGE_PASSWORD',
  LOCKED: 'LOCKED',
  SUSPENDED: 'SUSPENDED',
  PENDING_MFA: 'PENDING_MFA'
};

export const LOGIN_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED'
};

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 30;

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh'
};

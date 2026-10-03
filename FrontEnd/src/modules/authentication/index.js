// Authentication Module — Barrel Export
export { AuthProvider, AuthContext, useAuth } from './contexts/AuthContext';
export { RequireAuth, GuestOnly } from './guards/AuthGuards';
export { default as LoginPage } from './pages/LoginPage';
export { default as FirstLoginPasswordChangePage } from './pages/FirstLoginPasswordChangePage';
export { default as ForgotPasswordPage } from './pages/ForgotPasswordPage';
export { default as ResetPasswordPage } from './pages/ResetPasswordPage';
export { default as authApi } from './api/authApi';
export { default as tokenManager } from './utils/tokenManager';
export { default as sessionManager } from './utils/sessionManager';
export { STORAGE_KEYS, ACCOUNT_STATUS, DEFAULT_DASHBOARD_ROUTES, PASSWORD_POLICIES } from './constants/authConstants';
export { validatePasswordComplexity } from './utils/passwordValidation';

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authApi from '../api/authApi';
import tokenManager from '../utils/tokenManager';
import sessionManager from '../utils/sessionManager';
import { ACCOUNT_STATUS, DEFAULT_DASHBOARD_ROUTES, STORAGE_KEYS } from '../constants/authConstants';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const loadUserProfile = useCallback(async () => {
    if (!tokenManager.hasValidToken()) {
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.data?.status === 'success') {
        const profile = res.data.data;
        setUser(profile);
        setIsAuthenticated(true);
        setMustChangePassword(!!profile.mustChangePassword);
        sessionManager.setUserProfile(profile, !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN));
      }
    } catch (err) {
      console.warn('Session expired or invalid token, clearing auth state.');
      tokenManager.clearTokens();
      sessionManager.clearSession();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const login = async (username, password, rememberMe = false) => {
    const res = await authApi.login({ username, password });
    if (res.data?.status !== 'success') {
      throw new Error(res.data?.message || 'Authentication failed');
    }

    const data = res.data.data;
    tokenManager.setTokens(data.accessToken, data.refreshToken, rememberMe);

    if (rememberMe) {
      sessionManager.setRememberedUsername(username);
    } else {
      sessionManager.setRememberedUsername('');
    }

    if (data.mustChangePassword) {
      setUser({
        userId: data.userId,
        userAccountId: data.userAccountId,
        username: data.username,
        userTypeCode: data.userTypeCode,
        mustChangePassword: true
      });
      setIsAuthenticated(true);
      setMustChangePassword(true);
      return { mustChangePassword: true };
    }

    await loadUserProfile();
    return { mustChangePassword: false };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch { /* best effort */ }
    tokenManager.clearTokens();
    sessionManager.clearSession();
    setUser(null);
    setIsAuthenticated(false);
    setMustChangePassword(false);
  };

  const completePasswordChange = async () => {
    setMustChangePassword(false);
    tokenManager.clearTokens();
    sessionManager.clearSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  const getDefaultDashboard = () => {
    if (!user) return 'dashboard';
    const assignedRoleCode = (user.roles && user.roles.length > 0)
      ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].RoleCode || user.roles[0].code || user.roles[0].name)
      : null;
    const typeCode = (assignedRoleCode || user.userTypeCode || '').toUpperCase();
    return DEFAULT_DASHBOARD_ROUTES[typeCode] || 'dashboard';
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    mustChangePassword,
    login,
    logout,
    completePasswordChange,
    refreshProfile: loadUserProfile,
    getDefaultDashboard
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

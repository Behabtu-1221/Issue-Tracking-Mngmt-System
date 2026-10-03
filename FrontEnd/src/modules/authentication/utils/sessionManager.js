import { STORAGE_KEYS } from '../constants/authConstants';
import tokenManager from './tokenManager';

export const sessionManager = {
  getUserProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || sessionStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUserProfile(profile, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    if (profile) {
      storage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    }
  },

  clearSession() {
    tokenManager.clearTokens();
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    sessionStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  },

  getRememberedUsername() {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_USERNAME) || '';
  },

  setRememberedUsername(username) {
    if (username) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_USERNAME, username);
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_USERNAME);
    }
  }
};

export default sessionManager;

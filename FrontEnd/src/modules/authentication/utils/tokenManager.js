import { STORAGE_KEYS } from '../constants/authConstants';

let inMemoryAccessToken = null;

export const tokenManager = {
  getAccessToken() {
    if (inMemoryAccessToken) return inMemoryAccessToken;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setTokens(accessToken, refreshToken, rememberMe = false) {
    inMemoryAccessToken = accessToken;
    const storage = rememberMe ? localStorage : sessionStorage;
    
    if (accessToken) {
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  clearTokens() {
    inMemoryAccessToken = null;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  hasValidToken() {
    return !!this.getAccessToken();
  }
};

export default tokenManager;

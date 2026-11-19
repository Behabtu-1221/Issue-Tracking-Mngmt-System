import axios from 'axios';
import { STORAGE_KEYS } from '../modules/authentication/constants/authConstants';

/**
 * Resolves the API Base URL dynamically and robustly:
 * 1. Explicit environment variable: import.meta.env.VITE_API_URL
 *    (Automatically normalizes trailing slashes and ensures /api is included)
 * 2. In browser environments: resolves to current origin with /api, or port 5000 in local dev
 * 3. Fallback: http://localhost:5000/api
 */
export const getApiBaseUrl = () => {
  // 1. Runtime override in localStorage (allows instant hot-configuration without rebuild)
  if (typeof window !== 'undefined' && window.localStorage) {
    const runtimeUrl = window.localStorage.getItem('ITMS_API_URL');
    if (runtimeUrl && typeof runtimeUrl === 'string' && runtimeUrl.trim()) {
      let url = runtimeUrl.trim().replace(/\/+$/, '');
      if (!url.endsWith('/api')) {
        url += '/api';
      }
      return url;
    }
  }

  // 2. Build-time environment variable baked in by Vite
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let url = envUrl.trim().replace(/\/+$/, '');
    if (!url.endsWith('/api')) {
      url += '/api';
    }
    return url;
  }

  // 3. Browser environment fallback
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, origin } = window.location;
    // Local development mode: default to backend port 5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:5000/api`;
    }
    // Deployed to Vercel but VITE_API_URL was omitted in Vercel settings:
    // Default to known Render backend rather than calling Vercel itself
    if (hostname.includes('vercel.app')) {
      return 'https://issue-tracking-mngmt-system.onrender.com/api';
    }
    // Generic deployed origin
    if (origin && origin !== 'null') {
      return `${origin.replace(/\/+$/, '')}/api`;
    }
  }

  return 'http://localhost:5000/api';
};

/**
 * Returns the Server Root URL (without /api suffix) for preview streams and static media.
 */
export const getServerBaseUrl = () => {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 90000, // 90s timeout to accommodate Render free-tier cold starts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach access token only for authenticated requests
api.interceptors.request.use((config) => {
  // Keep baseURL synchronized with any dynamic runtime resolution
  config.baseURL = getApiBaseUrl();

  const url = config.url || '';
  const isPublicAuthCall = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/health'].some(
    (p) => url.includes(p)
  );

  if (isPublicAuthCall) {
    // Explicitly do not send Authorization header for unauthenticated endpoints
    delete config.headers.Authorization;
  } else {
    const token =
      sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Response interceptor — auto-refresh on 401, redirect on session expiry
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for login, forgot-password, reset-password
      const skipPaths = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/refresh'];
      if (skipPaths.some(p => originalRequest.url?.includes(p))) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken =
        sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
        localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        isRefreshing = false;
        sessionStorage.clear();
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        if (typeof window !== 'undefined' && window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
          window.location.href = '/?session_expired=true';
        }
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${getApiBaseUrl()}/auth/refresh`, { refreshToken });
        const newAccessToken = res.data?.data?.accessToken;

        if (newAccessToken) {
          const storage = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ? localStorage : sessionStorage;
          storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.clear();
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        if (typeof window !== 'undefined' && window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
          window.location.href = '/?session_expired=true';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

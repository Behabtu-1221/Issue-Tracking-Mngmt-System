import axios from 'axios';
import { STORAGE_KEYS } from '../modules/authentication/constants/authConstants';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
        window.location.href = '/?session_expired=true';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post('http://localhost:5000/api/auth/refresh', { refreshToken });
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
        window.location.href = '/?session_expired=true';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

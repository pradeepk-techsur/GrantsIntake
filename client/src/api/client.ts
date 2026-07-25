import axios from 'axios';
import { useAuthStore } from '../store/authStore';

/**
 * Axios instance with:
 * - baseURL pointing to /api/v1 (proxied to backend in dev, served directly in prod)
 * - Authorization: Bearer {accessToken} interceptor
 * - 401 interceptor that attempts token refresh and retries once
 */
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send httpOnly refresh token cookie
});

// Request interceptor: attach access token from Zustand store
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track ongoing refresh to avoid concurrent refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// Response interceptor: on 401, attempt refresh once then retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried and not a refresh endpoint call itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue subsequent requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt refresh using httpOnly cookie (sent automatically via withCredentials)
        const response = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const newToken = response.data.access_token;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;

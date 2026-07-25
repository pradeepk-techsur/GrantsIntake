import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    user_id: string;
    email: string;
    full_name: string;
    roles: string[];
  };
  access_token: string;
  refresh_token: string;
}

/**
 * Hook providing login, logout, and register actions.
 * Access token stored in Zustand memory state ONLY (T-02-04 mitigation).
 * Refresh token stored in httpOnly cookie set by server.
 */
export function useAuth() {
  const { setAccessToken, clearAuth, accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      setAccessToken(response.data.access_token);
      return response.data;
    },
    [setAccessToken],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Always clear local state even if server call fails
    } finally {
      clearAuth();
      queryClient.clear();
    }
  }, [clearAuth, queryClient]);

  const register = useCallback(
    async (data: { email: string; password: string; full_name: string }) => {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      setAccessToken(response.data.access_token);
      return response.data;
    },
    [setAccessToken],
  );

  return {
    login,
    logout,
    register,
    isAuthenticated: !!accessToken,
  };
}

import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';

export interface GrantorMembership {
  org_id: string;
  org_name: string;
  org_type: string | null;
  roles: string[];
}

export interface AuthUser {
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_login_at: string | null;
}

interface MeResponse {
  user: AuthUser;
  grantor_memberships: GrantorMembership[];
  org_memberships: unknown[];
}

/**
 * Hook to fetch and cache the current authenticated user.
 * Returns user, grantor_memberships, org_memberships, isLoading.
 * Caches for 5 minutes. Only fetches when access token is present.
 */
export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data, isLoading, error } = useQuery<MeResponse>({
    queryKey: ['currentUser', accessToken],
    queryFn: async () => {
      const response = await apiClient.get<MeResponse>('/auth/me');
      return response.data;
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  return {
    user: data?.user ?? null,
    grantor_memberships: data?.grantor_memberships ?? [],
    org_memberships: data?.org_memberships ?? [],
    isLoading: !!accessToken && isLoading,
    error,
  };
}

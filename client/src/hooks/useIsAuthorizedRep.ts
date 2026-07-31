import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useCurrentUser } from './useCurrentUser';

interface OrgRole {
  role_id: string;
  org_id: string;
  user_id: string;
  roles: string[];
  revoked_at: string | null;
}

/**
 * useIsAuthorizedRep — checks if the current user has the authorized_representative
 * role in their applicant organization.
 *
 * Reads org_id from localStorage `applicant_org_id`, fetches org roles,
 * and checks if the current user's entry includes 'authorized_representative'.
 */
export function useIsAuthorizedRep(): boolean {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { user } = useCurrentUser();
  const orgId = typeof window !== 'undefined' ? localStorage.getItem('applicant_org_id') : null;

  const { data: roles } = useQuery<OrgRole[]>({
    queryKey: ['org-roles', orgId],
    queryFn: async () => {
      const res = await apiClient.get<OrgRole[]>(`/organizations/${orgId}/roles`);
      return res.data;
    },
    enabled: !!accessToken && !!orgId && !!user,
    staleTime: 60_000,
  });

  if (!user || !roles) return false;

  const myRole = roles.find((r) => r.user_id === user.user_id && !r.revoked_at);
  return myRole?.roles?.includes('authorized_representative') ?? false;
}

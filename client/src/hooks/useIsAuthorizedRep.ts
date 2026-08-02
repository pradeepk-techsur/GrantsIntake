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
 * Accepts orgId as a prop (caller must provide from workspace data or similar source).
 * Does NOT read localStorage — avoids the stale-closure problem where localStorage
 * is set in a useEffect AFTER this hook has already captured orgId=null.
 */
export function useIsAuthorizedRep(orgId?: string | null): boolean {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { user } = useCurrentUser();

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

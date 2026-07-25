import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export interface OpportunityTemplate {
  template_id: string;
  template_name: string;
  template_type: string;
  grant_market: string | null;
  default_sections: unknown;
  default_metadata: unknown;
  is_system_template: boolean;
}

/**
 * Hook to fetch all opportunity templates.
 * Caches for 5 minutes (templates change rarely).
 * T-03-06: Results cached so modal open doesn't re-query.
 */
export function useOpportunityTemplates() {
  const { data, isLoading, error } = useQuery<OpportunityTemplate[]>({
    queryKey: ['opportunityTemplates'],
    queryFn: async () => {
      const response = await apiClient.get<OpportunityTemplate[]>('/opportunity-templates');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  return {
    templates: data ?? [],
    isLoading,
    error,
  };
}

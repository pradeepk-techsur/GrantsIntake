import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';

export interface Opportunity {
  opportunity_id: string;
  program_id: string;
  template_id: string | null;
  title: string;
  funding_source: string;
  announcement_type: string;
  opportunity_number: string;
  assistance_listing_number: string | null;
  funding_amount_min: number | null;
  funding_amount_max: number;
  total_program_funding: number | null;
  expected_awards_min: number | null;
  expected_awards_max: number | null;
  eligibility_summary: string;
  executive_summary: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  contact_title: string | null;
  program_area: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOpportunityPayload {
  template_id?: string;
  title: string;
  funding_source: string;
  announcement_type: string;
  opportunity_number: string;
  assistance_listing_number?: string;
  funding_amount_min?: number;
  funding_amount_max: number;
  total_program_funding?: number;
  expected_awards_min?: number;
  expected_awards_max?: number;
  eligibility_summary: string;
  executive_summary: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_title?: string;
  program_area: string;
}

export type UpdateOpportunityPayload = Partial<CreateOpportunityPayload>;

/**
 * Hook to fetch a single opportunity by ID.
 */
export function useOpportunity(id: string | null) {
  const { data, isLoading, error } = useQuery<Opportunity>({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const response = await apiClient.get<Opportunity>(`/opportunities/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    retry: false,
  });

  return {
    opportunity: data ?? null,
    isLoading: !!id && isLoading,
    error,
  };
}

/**
 * Hook to create a new opportunity.
 * Returns mutation for POST /api/v1/programs/:programId/opportunities
 */
export function useCreateOpportunity(programId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<Opportunity, Error, CreateOpportunityPayload>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Opportunity>(
        `/programs/${programId}/opportunities`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

/**
 * Hook to update an opportunity.
 * Returns mutation for PATCH /api/v1/opportunities/:id
 */
export function useUpdateOpportunity(id: string | null) {
  const queryClient = useQueryClient();

  return useMutation<Opportunity, Error, UpdateOpportunityPayload>({
    mutationFn: async (patch) => {
      const response = await apiClient.patch<Opportunity>(`/opportunities/${id}`, patch);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['opportunity', id], data);
    },
  });
}

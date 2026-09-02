import apiClient from './client';
import type {
  ExternalOpportunity,
  ExternalOpportunityFilterParams,
  PaginatedExternalOpportunities,
  SavedListResponse,
  AlertsResponse,
  VersionsResponse,
  ImportOpportunityResponse,
  ImportedListResponse,
} from '../types/externalOpportunity';

/**
 * API client for the Grants.gov external opportunity endpoints
 * (backend router mounted at /api/v1/external-opportunities, plan 08-01).
 *
 * - List / detail / versions are public (no auth required).
 * - Save / unsave / saved list / alerts require an authenticated applicant.
 */
export const externalOpportunitiesApi = {
  listExternalOpportunities: (params?: ExternalOpportunityFilterParams) =>
    apiClient.get<PaginatedExternalOpportunities>('/external-opportunities', {
      params,
    }),

  getExternalOpportunity: (id: string) =>
    apiClient.get<ExternalOpportunity>(`/external-opportunities/${id}`),

  getVersionHistory: (id: string) =>
    apiClient.get<VersionsResponse>(`/external-opportunities/${id}/versions`),

  saveOpportunity: (id: string) =>
    apiClient.post<{ ok: boolean }>(`/external-opportunities/${id}/save`),

  unsaveOpportunity: (id: string) =>
    apiClient.delete<{ ok: boolean }>(`/external-opportunities/${id}/save`),

  listSaved: () =>
    apiClient.get<SavedListResponse>('/external-opportunities/saved'),

  listAlerts: () =>
    apiClient.get<AlertsResponse>('/external-opportunities/alerts'),

  markAlertRead: (alertId: string) =>
    apiClient.put<{ ok: boolean }>(
      `/external-opportunities/alerts/${alertId}/read`,
    ),

  importOpportunity: (id: string) =>
    apiClient.post<ImportOpportunityResponse>(
      `/external-opportunities/${id}/import`,
    ),

  listImported: () =>
    apiClient.get<ImportedListResponse>('/external-opportunities/imported'),
};

import apiClient from './client';

/** Result shape returned by the Grants.gov admin refresh endpoint. */
export interface RefreshResult {
  fetched: number;
  upserted: number;
  failed: number;
  errors: Array<{ opportunityNumber?: string; message: string }>;
}

/**
 * Grantor-admin Grants.gov ingestion controls (Plan 08-04, PRD-INTAKE-019A).
 * Kept separate from the applicant-facing external opportunity client to avoid
 * cross-plan file conflicts.
 */
export const externalSyncApi = {
  /** Trigger a manual full refresh of imported Grants.gov opportunities. */
  refreshNow: () =>
    apiClient.post<RefreshResult>('/external-opportunities/admin/refresh'),
};
